import { describe, it, expect } from 'vitest'
import { computeReadiness, gapRatingScore, riskWeightToLevel } from '@shared/engine/scoring'
import { getAuditableClauses } from '@shared/knowledge-base'
import type { GapAssessment } from '@shared/types'

describe('scoring engine', () => {
  it('maps gap ratings to expected scores', () => {
    expect(gapRatingScore('conforms')).toBe(100)
    expect(gapRatingScore('major_nc')).toBe(0)
    expect(gapRatingScore('not_assessed')).toBeNull()
  })

  it('maps risk weights to levels', () => {
    expect(riskWeightToLevel(5)).toBe('high')
    expect(riskWeightToLevel(3)).toBe('medium')
    expect(riskWeightToLevel(1)).toBe('low')
  })

  it('computes overall readiness only from assessed clauses', () => {
    const clauses = getAuditableClauses('iso14001').slice(0, 4)
    const gaps: GapAssessment[] = [
      {
        id: '1',
        auditProjectId: 'p1',
        clauseId: clauses[0].id,
        rating: 'conforms',
        assessedAt: '2026-01-01'
      },
      {
        id: '2',
        auditProjectId: 'p1',
        clauseId: clauses[1].id,
        rating: 'major_nc',
        assessedAt: '2026-01-01'
      }
    ]
    const result = computeReadiness(clauses, gaps)
    // Average of 100 and 0 across the two assessed clauses = 50; the other
    // two clauses are not_assessed and must not drag the average down.
    expect(result.overallPct).toBe(50)
    expect(result.highRiskGaps.length).toBe(1)
    expect(result.highRiskGaps[0].clauseId).toBe(clauses[1].id)
  })

  it('takes the latest assessment per clause when multiple exist', () => {
    const clauses = getAuditableClauses('iso14001').slice(0, 1)
    const gaps: GapAssessment[] = [
      { id: '1', auditProjectId: 'p1', clauseId: clauses[0].id, rating: 'major_nc', assessedAt: '2026-01-01' },
      { id: '2', auditProjectId: 'p1', clauseId: clauses[0].id, rating: 'conforms', assessedAt: '2026-06-01' }
    ]
    const result = computeReadiness(clauses, gaps)
    expect(result.overallPct).toBe(100)
  })
})
