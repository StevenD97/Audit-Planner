import type { ComplianceObligation, ComplianceEvaluation, ComplianceEvaluationStatus } from '../types'

export interface OverdueObligation {
  obligationId: string
  description: string
  nextReviewAt: string
  daysOverdue: number
}

/** Obligations whose next review date has passed. `now` is injectable for testability. */
export function getOverdueObligations(obligations: ComplianceObligation[], now: Date = new Date()): OverdueObligation[] {
  const nowMs = now.getTime()
  return obligations
    .filter((o) => o.nextReviewAt && new Date(o.nextReviewAt).getTime() < nowMs)
    .map((o) => ({
      obligationId: o.id,
      description: o.description,
      nextReviewAt: o.nextReviewAt!,
      daysOverdue: Math.floor((nowMs - new Date(o.nextReviewAt!).getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}

export interface ComplianceSummary {
  /** % compliant among obligations that have at least one evaluation (mirrors computeReadiness's "excludes not-yet-assessed" rule). */
  compliantPct: number
  counts: Record<ComplianceEvaluationStatus, number>
  overdue: OverdueObligation[]
}

/** Latest evaluation per obligation, then a compliance-rate summary — same "latest wins, not-yet-evaluated excluded from the rate" shape as engine/scoring.ts's computeReadiness. */
export function computeComplianceSummary(
  obligations: ComplianceObligation[],
  evaluations: ComplianceEvaluation[],
  now: Date = new Date()
): ComplianceSummary {
  const latestByObligation = new Map<string, ComplianceEvaluation>()
  for (const ev of evaluations) {
    const existing = latestByObligation.get(ev.obligationId)
    if (!existing || ev.evaluatedAt > existing.evaluatedAt) latestByObligation.set(ev.obligationId, ev)
  }

  const counts: Record<ComplianceEvaluationStatus, number> = {
    compliant: 0,
    non_compliant: 0,
    partial: 0,
    not_evaluated: 0
  }
  for (const obligation of obligations) {
    const status = latestByObligation.get(obligation.id)?.status ?? 'not_evaluated'
    counts[status]++
  }

  const evaluated = counts.compliant + counts.non_compliant + counts.partial
  const compliantPct = evaluated === 0 ? 0 : Math.round((counts.compliant / evaluated) * 100)

  return { compliantPct, counts, overdue: getOverdueObligations(obligations, now) }
}

/** Reverse lookup: which obligations reference a given clause — "legal obligations linked to this clause". */
export function getObligationsForClause(clauseId: string, obligations: ComplianceObligation[]): ComplianceObligation[] {
  return obligations.filter((o) => o.clauseIds.includes(clauseId))
}

/** Union of clause ids across a set of in-scope obligations — mirrors engine/processClauses.ts's collectProcessClauseIds, for compliance-focused audit programme planning. */
export function collectObligationClauseIds(obligationIds: string[], obligations: ComplianceObligation[]): string[] {
  const scopeSet = new Set(obligationIds)
  const ids = new Set<string>()
  for (const obligation of obligations) {
    if (!scopeSet.has(obligation.id)) continue
    for (const clauseId of obligation.clauseIds) ids.add(clauseId)
  }
  return Array.from(ids)
}
