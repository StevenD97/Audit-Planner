import type {
  GapAssessment,
  AuditFinding,
  CorrectiveAction,
  ComplianceObligation,
  ComplianceEvaluation,
  EvidencePlanItem,
  Risk,
  Control,
  Process,
  OrgFunction,
  OrgDepartment
} from '../types'
import { gapRatingScore } from './scoring'
import { isFindingOpen } from './findings'
import { collectProcessClauseIds } from './processClauses'
import { riskScore } from './riskHeatmap'

export type ScoreSourceType = 'gap_assessment' | 'finding' | 'compliance' | 'evidence' | 'risk' | 'rollup'

export interface ScoreDriver {
  label: string
  /** Signed contribution to the score — negative is a penalty. */
  weight: number
  sourceType: ScoreSourceType
}

export interface ScoredEntity {
  id: string
  score: number
  drivers: ScoreDriver[]
  /** Present on process/department/site/overall rollups — the scored entities averaged into this one, for drill-down. */
  children?: ScoredEntity[]
}

export interface ScoringV2Context {
  gapAssessments: GapAssessment[]
  auditFindings: AuditFinding[]
  correctiveActions: CorrectiveAction[]
  complianceObligations: ComplianceObligation[]
  complianceEvaluations: ComplianceEvaluation[]
  evidencePlanItems: EvidencePlanItem[]
  risks: Risk[]
  controls: Control[]
  processes: Process[]
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function latestByObligation(evaluations: ComplianceEvaluation[]): Map<string, ComplianceEvaluation> {
  const map = new Map<string, ComplianceEvaluation>()
  for (const ev of evaluations) {
    const existing = map.get(ev.obligationId)
    if (!existing || ev.evaluatedAt > existing.evaluatedAt) map.set(ev.obligationId, ev)
  }
  return map
}

/**
 * Multi-input, explainable clause score — replaces the "gap rating only"
 * v1 model (engine/scoring.ts, still used unchanged by engine/recommender.ts
 * pending its own upgrade in a future milestone). Every input that moves the
 * score produces a driver, so "why is this clause at 55%" is always
 * answerable, not just the number (docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md
 * §3.4).
 */
export function computeClauseScoreV2(clauseId: string, auditProjectId: string, ctx: ScoringV2Context): ScoredEntity {
  let score = 100
  const drivers: ScoreDriver[] = []

  const gapAssessmentsForClause = ctx.gapAssessments
    .filter((g) => g.auditProjectId === auditProjectId && g.clauseId === clauseId)
    .sort((a, b) => (a.assessedAt ?? '').localeCompare(b.assessedAt ?? ''))
  const latestGap = gapAssessmentsForClause[gapAssessmentsForClause.length - 1]
  const rating = latestGap?.rating ?? 'not_assessed'
  const gapPenalty: Record<typeof rating, number> = {
    conforms: 0,
    ofi: -10,
    minor_nc: -30,
    major_nc: -60,
    not_assessed: -20
  }
  const gapLabel: Record<typeof rating, string> = {
    conforms: 'Conforms',
    ofi: 'OFI on record',
    minor_nc: 'Minor NC on record',
    major_nc: 'Major NC on record',
    not_assessed: 'Not yet gap-assessed'
  }
  if (gapPenalty[rating] !== 0) {
    score += gapPenalty[rating]
    drivers.push({ label: gapLabel[rating], weight: gapPenalty[rating], sourceType: 'gap_assessment' })
  }

  const findingsForClause = ctx.auditFindings.filter((f) => f.clauseId === clauseId && f.auditProjectId === auditProjectId)
  const openFindings = findingsForClause.filter((f) => isFindingOpen(f, ctx.correctiveActions))
  if (openFindings.length > 0) {
    const weight = -Math.min(30, openFindings.length * 15)
    score += weight
    drivers.push({ label: `${openFindings.length} open finding(s) against this clause`, weight, sourceType: 'finding' })
  }

  const allFindingsForClauseEverAudit = ctx.auditFindings.filter((f) => f.clauseId === clauseId)
  const findingIds = new Set(allFindingsForClauseEverAudit.map((f) => f.id))
  const hasLateClosure = ctx.correctiveActions.some(
    (a) => findingIds.has(a.findingId) && a.status === 'closed' && a.closedAt && new Date(a.closedAt) > new Date(a.dueDate)
  )
  if (hasLateClosure) {
    score -= 10
    drivers.push({ label: 'History of corrective actions closed late for this clause', weight: -10, sourceType: 'finding' })
  }

  const obligationsForClause = ctx.complianceObligations.filter((o) => o.clauseIds.includes(clauseId))
  if (obligationsForClause.length > 0) {
    const latest = latestByObligation(ctx.complianceEvaluations)
    const statuses = obligationsForClause.map((o) => latest.get(o.id)?.status ?? 'not_evaluated')
    if (statuses.includes('non_compliant')) {
      score -= 20
      drivers.push({ label: 'Linked legal obligation currently non-compliant', weight: -20, sourceType: 'compliance' })
    } else if (statuses.includes('partial')) {
      score -= 10
      drivers.push({ label: 'Linked legal obligation partially compliant', weight: -10, sourceType: 'compliance' })
    }
  }

  const evidenceForClause = ctx.evidencePlanItems.filter((e) => e.clauseId === clauseId && e.auditProjectId === auditProjectId)
  if (evidenceForClause.length > 0) {
    const obtainedPct = Math.round((evidenceForClause.filter((e) => e.status === 'obtained').length / evidenceForClause.length) * 100)
    if (obtainedPct < 100) {
      const weight = -Math.min(15, Math.round((100 - obtainedPct) * 0.2))
      score += weight
      drivers.push({ label: `${100 - obtainedPct}% of required evidence not yet obtained`, weight, sourceType: 'evidence' })
    }
  }

  const linkedHighRisk = ctx.processes.some((process) => {
    const processRisks = ctx.risks.filter((r) => r.processId === process.id)
    if (!processRisks.some((r) => riskScore(r) >= 15)) return false
    const processClauseIds = collectProcessClauseIds([process.id], ctx.processes, ctx.risks, ctx.controls)
    return processClauseIds.includes(clauseId)
  })
  if (linkedHighRisk) {
    score -= 10
    drivers.push({ label: 'Linked to a high risk (likelihood x severity >= 15)', weight: -10, sourceType: 'risk' })
  }

  return { id: clauseId, score: clamp(score), drivers }
}

function rollupDrivers(children: ScoredEntity[], labelFor: (child: ScoredEntity) => string): ScoreDriver[] {
  return children
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((child) => ({ label: `${labelFor(child)} scored ${child.score}%`, weight: child.score - 100, sourceType: 'rollup' }))
}

function average(children: ScoredEntity[]): number {
  if (children.length === 0) return 100
  return clamp(children.reduce((sum, c) => sum + c.score, 0) / children.length)
}

/** Averages the clauses a process links to (via its own clauses + its risks' controls), per computeClauseScoreV2. */
export function computeProcessScoreV2(
  process: Process,
  clauseTitleFor: (clauseId: string) => string,
  auditProjectId: string,
  ctx: ScoringV2Context
): ScoredEntity {
  const clauseIds = collectProcessClauseIds([process.id], ctx.processes, ctx.risks, ctx.controls)
  const children = clauseIds.map((id) => computeClauseScoreV2(id, auditProjectId, ctx))
  if (children.length === 0) {
    return { id: process.id, score: 100, drivers: [{ label: 'No clauses linked yet', weight: 0, sourceType: 'rollup' }], children }
  }
  return {
    id: process.id,
    score: average(children),
    drivers: rollupDrivers(children, (c) => clauseTitleFor(c.id)),
    children
  }
}

/** Averages the processes belonging to a department (via OrgFunction -> departmentId). */
export function computeDepartmentScoreV2(
  departmentId: string,
  functions: OrgFunction[],
  processNameFor: (processId: string) => string,
  clauseTitleFor: (clauseId: string) => string,
  auditProjectId: string,
  ctx: ScoringV2Context
): ScoredEntity {
  const functionIds = new Set(functions.filter((f) => f.departmentId === departmentId).map((f) => f.id))
  const departmentProcesses = ctx.processes.filter((p) => functionIds.has(p.functionId))
  const children = departmentProcesses.map((p) => computeProcessScoreV2(p, clauseTitleFor, auditProjectId, ctx))
  if (children.length === 0) {
    return { id: departmentId, score: 100, drivers: [{ label: 'No processes linked yet', weight: 0, sourceType: 'rollup' }], children }
  }
  return {
    id: departmentId,
    score: average(children),
    drivers: rollupDrivers(children, (c) => processNameFor(c.id)),
    children
  }
}

/** Averages the departments belonging to a site (via OrgDepartment -> siteId). */
export function computeSiteScoreV2(
  siteId: string,
  departments: OrgDepartment[],
  functions: OrgFunction[],
  departmentNameFor: (departmentId: string) => string,
  processNameFor: (processId: string) => string,
  clauseTitleFor: (clauseId: string) => string,
  auditProjectId: string,
  ctx: ScoringV2Context
): ScoredEntity {
  const siteDepartments = departments.filter((d) => d.siteId === siteId)
  const children = siteDepartments.map((d) =>
    computeDepartmentScoreV2(d.id, functions, processNameFor, clauseTitleFor, auditProjectId, ctx)
  )
  if (children.length === 0) {
    return { id: siteId, score: 100, drivers: [{ label: 'No departments linked yet', weight: 0, sourceType: 'rollup' }], children }
  }
  return {
    id: siteId,
    score: average(children),
    drivers: rollupDrivers(children, (c) => departmentNameFor(c.id)),
    children
  }
}

/** Top-level readiness for an audit's full clause scope (used when there's no org hierarchy in play — the common case). */
export function computeOverallReadinessV2(
  clauseIds: string[],
  clauseTitleFor: (clauseId: string) => string,
  auditProjectId: string,
  ctx: ScoringV2Context
): ScoredEntity {
  const children = clauseIds.map((id) => computeClauseScoreV2(id, auditProjectId, ctx))
  if (children.length === 0) {
    return { id: 'overall', score: 0, drivers: [{ label: 'No clauses in scope', weight: 0, sourceType: 'rollup' }], children }
  }
  return {
    id: 'overall',
    score: average(children),
    drivers: rollupDrivers(children, (c) => clauseTitleFor(c.id)),
    children
  }
}
