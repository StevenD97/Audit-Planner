import type {
  Clause,
  EvidencePlanItem,
  GapAssessment,
  InterviewQuestion,
  ProgrammeSlot,
  StandardId,
  AuditFinding,
  CorrectiveAction,
  ComplianceObligation,
  ComplianceEvaluation,
  Risk,
  Control,
  Process
} from '../types'
import { computeClauseScoreV2, type ScoringV2Context } from './scoringV2'
import { computeClosureEffectiveness, getRecurringFindings, type RecurringFinding } from './findings'
import { collectProcessClauseIds } from './processClauses'
import { computeCoveragePriority } from './riskHeatmap'
import { suggestCanonicalTrails, buildCustomTrail } from './trailBuilder'
import type { AuditTrailDefinition } from '../types'

/**
 * Deterministic, offline "Audit Intelligence Engine" — see docs/ARCHITECTURE.md
 * §6 for why this is a rule/graph engine rather than an LLM call. Every
 * function here takes the current audit project's data (workspace-wide,
 * unfiltered — each function filters by `auditProjectId` itself where
 * "current audit only" is the right scope) plus the relevant knowledge-base
 * clauses, and returns structured recommendations the UI renders as
 * "insert into..." cards, never raw free text.
 *
 * As of docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md's M6, weak-area/priority
 * scoring is computed via engine/scoringV2.ts (the same explainable,
 * multi-input model the Readiness Assessment screen uses) rather than the
 * older engine/scoring.ts, so this engine and the readiness score agree with
 * each other and every reason shown here is a real ScoreDriver label, not a
 * separately-maintained heuristic.
 */

export interface RecommenderContext {
  auditProjectId: string
  standardIds: StandardId[]
  scopeClauses: Clause[]
  gapAssessments: GapAssessment[]
  evidencePlanItems: EvidencePlanItem[]
  auditFindings: AuditFinding[]
  correctiveActions: CorrectiveAction[]
  complianceObligations: ComplianceObligation[]
  complianceEvaluations: ComplianceEvaluation[]
  risks: Risk[]
  controls: Control[]
  processes: Process[]
  programmeSlots?: ProgrammeSlot[]
}

function toScoringContext(ctx: RecommenderContext): ScoringV2Context {
  return {
    gapAssessments: ctx.gapAssessments,
    auditFindings: ctx.auditFindings,
    correctiveActions: ctx.correctiveActions,
    complianceObligations: ctx.complianceObligations,
    complianceEvaluations: ctx.complianceEvaluations,
    evidencePlanItems: ctx.evidencePlanItems,
    risks: ctx.risks,
    controls: ctx.controls,
    processes: ctx.processes
  }
}

export interface QuestionRecommendation {
  clauseId: string
  clauseNumber: string
  clauseTitle: string
  priorityScore: number
  reasons: string[]
  questions: InterviewQuestion[]
}

/** 1. Recommend audit questions, ranked by the same explainable score the Readiness Assessment shows (lower score = higher priority). */
export function recommendQuestions(ctx: RecommenderContext): QuestionRecommendation[] {
  const scoringCtx = toScoringContext(ctx)
  return ctx.scopeClauses
    .filter((c) => c.interviewQuestions.length > 0)
    .map((clause) => {
      const scored = computeClauseScoreV2(clause.id, ctx.auditProjectId, scoringCtx)
      return {
        clauseId: clause.id,
        clauseNumber: clause.clauseNumber,
        clauseTitle: clause.title,
        priorityScore: 100 - scored.score,
        reasons: scored.drivers.length > 0 ? scored.drivers.map((d) => d.label) : ['Standard coverage'],
        questions: clause.interviewQuestions
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
}

export interface ProcessTrailStep {
  process: Process
  risks: Risk[]
  controls: Control[]
  clauseIds: string[]
}

/** 2. Suggest audit trails: the canonical catalogue, a custom clause-graph trail from the weakest clause, and a process-graph trail (Process -> Risk -> Control -> Clauses) from the highest coverage-priority process. */
export function suggestAuditTrails(ctx: RecommenderContext): {
  canonical: AuditTrailDefinition[]
  customSeedClause?: Clause
  customTrail?: ReturnType<typeof buildCustomTrail>
  processTrail?: ProcessTrailStep
} {
  const canonical = suggestCanonicalTrails(ctx.standardIds)

  const weak = identifyWeakAreas(ctx)[0]
  const seedClause = weak ? ctx.scopeClauses.find((c) => c.id === weak.clauseId) : undefined
  const customTrail = seedClause ? buildCustomTrail(seedClause) : undefined

  const priorities = computeCoveragePriority(
    ctx.processes,
    ctx.risks,
    ctx.controls,
    ctx.auditFindings,
    ctx.complianceObligations,
    ctx.complianceEvaluations
  )
  const topPriority = priorities.find((p) => p.score > 0)
  const topProcess = topPriority && ctx.processes.find((p) => p.id === topPriority.processId)
  let processTrail: ProcessTrailStep | undefined
  if (topProcess) {
    const risks = ctx.risks.filter((r) => r.processId === topProcess.id)
    const riskIds = new Set(risks.map((r) => r.id))
    const controls = ctx.controls.filter((c) => riskIds.has(c.riskId))
    const clauseIds = collectProcessClauseIds([topProcess.id], ctx.processes, ctx.risks, ctx.controls)
    processTrail = { process: topProcess, risks, controls, clauseIds }
  }

  return { canonical, customSeedClause: seedClause, customTrail, processTrail }
}

export interface WeakAreaResult {
  clauseId: string
  clauseNumber: string
  title: string
  score: number
  reasons: string[]
}

/** 3. Identify likely weak areas — lowest v2-scoring clauses first, with the exact drivers behind each score. */
export function identifyWeakAreas(ctx: RecommenderContext, limit = 10): WeakAreaResult[] {
  const scoringCtx = toScoringContext(ctx)
  return ctx.scopeClauses
    .map((clause) => {
      const scored = computeClauseScoreV2(clause.id, ctx.auditProjectId, scoringCtx)
      return {
        clauseId: clause.id,
        clauseNumber: clause.clauseNumber,
        title: clause.title,
        score: scored.score,
        reasons: scored.drivers.map((d) => d.label)
      }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}

export interface InterviewPlanBlock {
  role: string
  clauses: { clauseId: string; clauseNumber: string; title: string }[]
  questions: InterviewQuestion[]
  suggestedDurationMinutes: number
}

/** 4. Generate an interview plan grouped by process-owner role. */
export function generateInterviewPlan(ctx: RecommenderContext): InterviewPlanBlock[] {
  const byRole = new Map<string, InterviewPlanBlock>()
  const ranked = recommendQuestions(ctx)

  for (const rec of ranked) {
    const clause = ctx.scopeClauses.find((c) => c.id === rec.clauseId)
    if (!clause) continue
    const roles = clause.processOwnerRoles.length > 0 ? clause.processOwnerRoles : ['Process owner (unassigned)']
    for (const role of roles) {
      const block = byRole.get(role) ?? {
        role,
        clauses: [],
        questions: [],
        suggestedDurationMinutes: 0
      }
      block.clauses.push({ clauseId: clause.id, clauseNumber: clause.clauseNumber, title: clause.title })
      block.questions.push(...clause.interviewQuestions)
      block.suggestedDurationMinutes = Math.min(120, block.clauses.length * 15 + 15)
      byRole.set(role, block)
    }
  }

  return Array.from(byRole.values()).sort((a, b) => b.questions.length - a.questions.length)
}

export interface MissingEvidenceItem {
  clauseId: string
  clauseNumber: string
  title: string
  description: string
  category: string
}

/** 5. Highlight missing evidence — required by the knowledge base but not marked obtained in the Evidence Planner, for this audit project. */
export function highlightMissingEvidence(ctx: RecommenderContext): MissingEvidenceItem[] {
  const evidenceForProject = ctx.evidencePlanItems.filter((e) => e.auditProjectId === ctx.auditProjectId)
  const obtainedKeys = new Set(
    evidenceForProject.filter((e) => e.status === 'obtained').map((e) => `${e.clauseId}::${e.description}`)
  )
  const requestedOrMissingKeys = new Set(
    evidenceForProject.filter((e) => e.status !== 'obtained').map((e) => `${e.clauseId}::${e.description}`)
  )

  const missing: MissingEvidenceItem[] = []
  for (const clause of ctx.scopeClauses) {
    for (const ev of clause.evidenceRequired) {
      const key = `${clause.id}::${ev.description}`
      if (obtainedKeys.has(key)) continue
      // Either explicitly tracked as outstanding, or never added to the evidence plan at all.
      if (requestedOrMissingKeys.has(key) || !evidenceForProject.some((e) => e.clauseId === clause.id)) {
        missing.push({
          clauseId: clause.id,
          clauseNumber: clause.clauseNumber,
          title: clause.title,
          description: ev.description,
          category: ev.category
        })
      }
    }
  }
  return missing
}

export interface AgendaItem {
  day: number
  startTime: string
  endTime: string
  activityType: string
  title: string
  processOwner?: string
  location?: string
}

/** 6. Generate a today's-agenda view by combining this audit project's programme slots with clause titles. */
export function generateAgenda(ctx: RecommenderContext): AgendaItem[] {
  const slots = (ctx.programmeSlots ?? []).filter((s) => s.auditProjectId === ctx.auditProjectId)
  return slots
    .map((slot) => {
      const clauseTitles = slot.clauseIds
        .map((id) => ctx.scopeClauses.find((c) => c.id === id))
        .filter((c): c is Clause => Boolean(c))
        .map((c) => `${c.clauseNumber} ${c.title}`)
      const title =
        slot.activityType === 'opening_meeting'
          ? 'Opening meeting'
          : slot.activityType === 'closing_meeting'
            ? 'Closing meeting'
            : slot.activityType === 'break'
              ? slot.notes ?? 'Break'
              : clauseTitles.join('; ') || 'Unallocated'
      return {
        day: slot.dayNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        activityType: slot.activityType,
        title,
        processOwner: slot.processOwner,
        location: slot.location
      }
    })
    .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime))
}

export interface WeakControl {
  controlId: string
  description: string
  /** Clauses this control is meant to evidence that are currently scoring below 50% (v2) despite the control existing. */
  weakClauseIds: string[]
}

export interface ProcessClosurePerformance {
  processId: string
  totalActions: number
  closureRatePct: number
  closedOnTimePct: number
}

export interface PatternAnalysis {
  /** Clauses/processes with repeated findings across the workspace's entire audit history, not just this audit. */
  recurringFindings: RecurringFinding[]
  /** Controls whose linked clauses are still scoring poorly despite the control existing on paper. */
  weakControls: WeakControl[]
  /** Processes with the worst corrective-action closure track record, worst first. */
  poorClosureAreas: ProcessClosurePerformance[]
}

/** 7. Pattern/recurrence analysis across the graph — repeat findings, controls that aren't actually working, and processes with poor closure discipline. Every item here is a count or percentage computed from real records, not inferred. */
export function analysePatterns(ctx: RecommenderContext): PatternAnalysis {
  const scoringCtx = toScoringContext(ctx)

  const recurringFindings = getRecurringFindings(ctx.auditFindings)

  const weakControls: WeakControl[] = ctx.controls
    .map((control) => ({
      controlId: control.id,
      description: control.description,
      weakClauseIds: control.clauseIds.filter(
        (id) => computeClauseScoreV2(id, ctx.auditProjectId, scoringCtx).score < 50
      )
    }))
    .filter((c) => c.weakClauseIds.length > 0)

  const poorClosureAreas: ProcessClosurePerformance[] = ctx.processes
    .map((process) => {
      const clauseIds = new Set(collectProcessClauseIds([process.id], ctx.processes, ctx.risks, ctx.controls))
      const findingIds = new Set(
        ctx.auditFindings
          .filter((f) => f.processId === process.id || (f.clauseId !== undefined && clauseIds.has(f.clauseId)))
          .map((f) => f.id)
      )
      const actions = ctx.correctiveActions.filter((a) => findingIds.has(a.findingId))
      const effectiveness = computeClosureEffectiveness(actions)
      return { processId: process.id, ...effectiveness }
    })
    .filter((p) => p.totalActions > 0 && p.closureRatePct < 100)
    .sort((a, b) => a.closureRatePct - b.closureRatePct)

  return { recurringFindings, weakControls, poorClosureAreas }
}
