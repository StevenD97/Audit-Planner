import type { Clause, GapAssessment, GapRating, RiskLevel } from '../types'

const RATING_SCORE: Record<GapRating, number | null> = {
  conforms: 100,
  ofi: 80,
  minor_nc: 40,
  major_nc: 0,
  not_assessed: null
}

export function gapRatingScore(rating: GapRating): number | null {
  return RATING_SCORE[rating]
}

export interface ClauseScore {
  clauseId: string
  clauseNumber: string
  title: string
  score: number | null
  rating: GapRating
}

export interface ReadinessResult {
  overallPct: number
  byClause: ClauseScore[]
  highRiskGaps: { clauseId: string; reason: string }[]
  recommendedActions: string[]
}

/**
 * Computes an overall readiness percentage and per-clause breakdown from the
 * latest gap assessment for each in-scope clause. Clauses with no assessment
 * yet ("not_assessed") are excluded from the average (they are surfaced
 * separately as "not yet assessed") rather than penalising the score, since a
 * half-finished audit shouldn't look artificially non-conformant.
 */
export function computeReadiness(clauses: Clause[], gapAssessments: GapAssessment[]): ReadinessResult {
  const latestByClause = new Map<string, GapAssessment>()
  for (const ga of gapAssessments) {
    const existing = latestByClause.get(ga.clauseId)
    if (!existing || (ga.assessedAt ?? '') > (existing.assessedAt ?? '')) {
      latestByClause.set(ga.clauseId, ga)
    }
  }

  const byClause: ClauseScore[] = clauses.map((c) => {
    const ga = latestByClause.get(c.id)
    const rating = ga?.rating ?? 'not_assessed'
    return { clauseId: c.id, clauseNumber: c.clauseNumber, title: c.title, score: gapRatingScore(rating), rating }
  })

  const scored = byClause.filter((c) => c.score !== null) as (ClauseScore & { score: number })[]
  const overallPct = scored.length === 0 ? 0 : Math.round(scored.reduce((sum, c) => sum + c.score, 0) / scored.length)

  const highRiskGaps = byClause
    .filter((c) => c.rating === 'major_nc' || c.rating === 'minor_nc')
    .map((c) => {
      const ga = latestByClause.get(c.clauseId)
      const riskSuffix = ga?.riskRating ? ` (risk: ${ga.riskRating})` : ''
      return {
        clauseId: c.clauseId,
        reason: `${c.clauseNumber} ${c.title} rated ${c.rating === 'major_nc' ? 'Major NC' : 'Minor NC'}${riskSuffix}`
      }
    })
    .sort((a, b) => (a.reason.includes('Major') === b.reason.includes('Major') ? 0 : a.reason.includes('Major') ? -1 : 1))

  const recommendedActions = byClause
    .filter((c) => c.rating === 'major_nc' || c.rating === 'minor_nc' || c.rating === 'ofi')
    .map((c) => {
      const ga = latestByClause.get(c.clauseId)
      if (ga?.recommendedAction) return `${c.clauseNumber}: ${ga.recommendedAction}`
      return `${c.clauseNumber} ${c.title}: define and implement a corrective/improvement action.`
    })

  return { overallPct, byClause, highRiskGaps, recommendedActions }
}

export function riskWeightToLevel(weight: number): RiskLevel {
  if (weight >= 4) return 'high'
  if (weight >= 2) return 'medium'
  return 'low'
}
