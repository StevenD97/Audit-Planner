import type {
  Clause,
  EvidencePlanItem,
  GapAssessment,
  InterviewQuestion,
  ProgrammeSlot,
  StandardId
} from '../types'
import { computeReadiness } from './scoring'
import { suggestCanonicalTrails, buildCustomTrail } from './trailBuilder'
import type { AuditTrailDefinition } from '../types'

/**
 * Deterministic, offline "AI Assistant" — see docs/ARCHITECTURE.md §6 for why
 * this is a rule/graph engine rather than an LLM call. Every function here
 * takes the current audit project's data plus the relevant knowledge-base
 * clauses and returns structured recommendations the UI renders as
 * "insert into..." cards, never raw free text.
 */

export interface RecommenderContext {
  standardIds: StandardId[]
  scopeClauses: Clause[]
  gapAssessments: GapAssessment[]
  evidencePlanItems: EvidencePlanItem[]
  programmeSlots?: ProgrammeSlot[]
}

export interface QuestionRecommendation {
  clauseId: string
  clauseNumber: string
  clauseTitle: string
  priorityScore: number
  reasons: string[]
  questions: InterviewQuestion[]
}

/** 1. Recommend audit questions, ranked by prior NC history / risk / missing evidence. */
export function recommendQuestions(ctx: RecommenderContext): QuestionRecommendation[] {
  const readiness = computeReadiness(ctx.scopeClauses, ctx.gapAssessments)
  const scoreByClause = new Map(readiness.byClause.map((c) => [c.clauseId, c]))
  const evidenceGapByClause = missingEvidenceMap(ctx)

  return ctx.scopeClauses
    .filter((c) => c.interviewQuestions.length > 0)
    .map((clause) => {
      const rated = scoreByClause.get(clause.id)
      const reasons: string[] = []
      let priorityScore = 0

      if (rated?.rating === 'major_nc') {
        priorityScore += 50
        reasons.push('Previously rated Major NC')
      } else if (rated?.rating === 'minor_nc') {
        priorityScore += 30
        reasons.push('Previously rated Minor NC')
      } else if (rated?.rating === 'ofi') {
        priorityScore += 10
        reasons.push('Previously rated an Opportunity for Improvement')
      }

      const maxRiskWeight = Math.max(0, ...clause.riskPrompts.map((r) => r.riskWeight))
      priorityScore += maxRiskWeight * 5
      if (maxRiskWeight >= 4) reasons.push('High risk-weighted clause')

      const missingEvidenceCount = evidenceGapByClause.get(clause.id) ?? 0
      if (missingEvidenceCount > 0) {
        priorityScore += missingEvidenceCount * 8
        reasons.push(`${missingEvidenceCount} evidence item(s) not yet obtained`)
      }

      if (reasons.length === 0) reasons.push('Standard coverage')

      return {
        clauseId: clause.id,
        clauseNumber: clause.clauseNumber,
        clauseTitle: clause.title,
        priorityScore,
        reasons,
        questions: clause.interviewQuestions
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
}

/** 2. Suggest audit trails: canonical catalogue plus a custom trail from the weakest clause. */
export function suggestAuditTrails(ctx: RecommenderContext): {
  canonical: AuditTrailDefinition[]
  customSeedClause?: Clause
  customTrail?: ReturnType<typeof buildCustomTrail>
} {
  const canonical = suggestCanonicalTrails(ctx.standardIds)
  const weak = identifyWeakAreas(ctx)[0]
  if (!weak) return { canonical }
  const seedClause = ctx.scopeClauses.find((c) => c.id === weak.clauseId)
  if (!seedClause) return { canonical }
  return { canonical, customSeedClause: seedClause, customTrail: buildCustomTrail(seedClause) }
}

export interface WeakAreaResult {
  clauseId: string
  clauseNumber: string
  title: string
  score: number
  rating: string
  reasons: string[]
}

/** 3. Identify likely weak areas — lowest scoring clauses first. */
export function identifyWeakAreas(ctx: RecommenderContext, limit = 10): WeakAreaResult[] {
  const readiness = computeReadiness(ctx.scopeClauses, ctx.gapAssessments)
  const evidenceGapByClause = missingEvidenceMap(ctx)

  return readiness.byClause
    .map((c) => {
      const reasons: string[] = []
      if (c.rating === 'major_nc') reasons.push('Major nonconformity on record')
      if (c.rating === 'minor_nc') reasons.push('Minor nonconformity on record')
      if (c.rating === 'not_assessed') reasons.push('Not yet assessed')
      const gaps = evidenceGapByClause.get(c.clauseId) ?? 0
      if (gaps > 0) reasons.push(`${gaps} evidence item(s) outstanding`)
      return { ...c, reasons, effectiveScore: c.score ?? 50 }
    })
    .sort((a, b) => a.effectiveScore - b.effectiveScore)
    .slice(0, limit)
    .map(({ clauseId, clauseNumber, title, score, rating, reasons }) => ({
      clauseId,
      clauseNumber,
      title,
      score: score ?? 0,
      rating,
      reasons
    }))
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

/** 5. Highlight missing evidence — required by the knowledge base but not marked obtained in the Evidence Planner. */
export function highlightMissingEvidence(ctx: RecommenderContext): MissingEvidenceItem[] {
  const obtainedKeys = new Set(
    ctx.evidencePlanItems.filter((e) => e.status === 'obtained').map((e) => `${e.clauseId}::${e.description}`)
  )
  const requestedOrMissingKeys = new Set(
    ctx.evidencePlanItems.filter((e) => e.status !== 'obtained').map((e) => `${e.clauseId}::${e.description}`)
  )

  const missing: MissingEvidenceItem[] = []
  for (const clause of ctx.scopeClauses) {
    for (const ev of clause.evidenceRequired) {
      const key = `${clause.id}::${ev.description}`
      if (obtainedKeys.has(key)) continue
      // Either explicitly tracked as outstanding, or never added to the evidence plan at all.
      if (requestedOrMissingKeys.has(key) || !ctx.evidencePlanItems.some((e) => e.clauseId === clause.id)) {
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

function missingEvidenceMap(ctx: RecommenderContext): Map<string, number> {
  const missing = highlightMissingEvidence(ctx)
  const map = new Map<string, number>()
  for (const m of missing) {
    map.set(m.clauseId, (map.get(m.clauseId) ?? 0) + 1)
  }
  return map
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

/** 6. Generate a today's-agenda view by combining programme slots with clause titles. */
export function generateAgenda(ctx: RecommenderContext): AgendaItem[] {
  if (!ctx.programmeSlots) return []
  return ctx.programmeSlots
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
    .sort((a, b) => (a.day - b.day) || a.startTime.localeCompare(b.startTime))
}
