import { describe, it, expect } from 'vitest'
import {
  getOverdueObligations,
  computeComplianceSummary,
  getObligationsForClause,
  collectObligationClauseIds
} from '../src/shared/engine/compliance'
import type { ComplianceObligation, ComplianceEvaluation } from '../src/shared/types'

const now = new Date('2026-08-03T00:00:00.000Z')

const obligations: ComplianceObligation[] = [
  {
    id: 'ob-1',
    legislationId: 'leg-1',
    description: 'Annual discharge permit review',
    requirements: [],
    nextReviewAt: '2026-01-01T00:00:00.000Z', // overdue
    clauseIds: ['iso14001-6.1.3', 'iso14001-9.1.2']
  },
  {
    id: 'ob-2',
    legislationId: 'leg-1',
    description: 'Fire safety certificate renewal',
    requirements: [],
    nextReviewAt: '2027-01-01T00:00:00.000Z', // not yet due
    clauseIds: ['iso45001-8.1.1']
  },
  {
    id: 'ob-3',
    legislationId: 'leg-2',
    description: 'No review date set',
    requirements: [],
    clauseIds: []
  }
]

const evaluations: ComplianceEvaluation[] = [
  { id: 'ev-1', obligationId: 'ob-1', status: 'non_compliant', evaluatedAt: '2026-01-05T00:00:00.000Z' },
  { id: 'ev-2', obligationId: 'ob-1', status: 'compliant', evaluatedAt: '2026-06-01T00:00:00.000Z' }, // latest wins
  { id: 'ev-3', obligationId: 'ob-2', status: 'partial', evaluatedAt: '2026-02-01T00:00:00.000Z' }
]

describe('getOverdueObligations', () => {
  it('flags only obligations whose nextReviewAt has passed, sorted most-overdue first', () => {
    const overdue = getOverdueObligations(obligations, now)
    expect(overdue).toHaveLength(1)
    expect(overdue[0].obligationId).toBe('ob-1')
    expect(overdue[0].daysOverdue).toBeGreaterThan(200)
  })

  it('does not flag an obligation with no review date at all', () => {
    const overdue = getOverdueObligations(obligations, now)
    expect(overdue.find((o) => o.obligationId === 'ob-3')).toBeUndefined()
  })
})

describe('computeComplianceSummary', () => {
  it('uses the latest evaluation per obligation, excludes not-yet-evaluated from the compliance rate', () => {
    const summary = computeComplianceSummary(obligations, evaluations, now)
    // ob-1 -> compliant (latest), ob-2 -> partial, ob-3 -> not_evaluated
    expect(summary.counts).toEqual({ compliant: 1, non_compliant: 0, partial: 1, not_evaluated: 1 })
    expect(summary.compliantPct).toBe(50) // 1 compliant / 2 evaluated
    expect(summary.overdue).toHaveLength(1)
  })

  it('reports 0% (not NaN) when nothing has been evaluated yet', () => {
    const summary = computeComplianceSummary(obligations, [], now)
    expect(summary.compliantPct).toBe(0)
    expect(summary.counts.not_evaluated).toBe(3)
  })
})

describe('getObligationsForClause', () => {
  it('finds obligations referencing a given clause', () => {
    expect(getObligationsForClause('iso14001-6.1.3', obligations).map((o) => o.id)).toEqual(['ob-1'])
  })

  it('returns an empty array for a clause with no linked obligations', () => {
    expect(getObligationsForClause('iso45001-5.1', obligations)).toEqual([])
  })
})

describe('collectObligationClauseIds', () => {
  it('unions clause ids across in-scope obligations only', () => {
    const ids = collectObligationClauseIds(['ob-1', 'ob-2'], obligations)
    expect(new Set(ids)).toEqual(new Set(['iso14001-6.1.3', 'iso14001-9.1.2', 'iso45001-8.1.1']))
  })

  it('returns an empty array when no obligations are in scope', () => {
    expect(collectObligationClauseIds([], obligations)).toEqual([])
  })
})
