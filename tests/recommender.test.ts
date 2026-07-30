import { describe, it, expect } from 'vitest'
import { getAuditableClauses } from '@shared/knowledge-base'
import {
  recommendQuestions,
  identifyWeakAreas,
  highlightMissingEvidence,
  generateInterviewPlan,
  type RecommenderContext
} from '@shared/engine/recommender'
import type { GapAssessment } from '@shared/types'

describe('recommender engine', () => {
  const clauses = getAuditableClauses('iso45001').slice(0, 5)

  function baseCtx(overrides: Partial<RecommenderContext> = {}): RecommenderContext {
    return {
      standardIds: ['iso45001'],
      scopeClauses: clauses,
      gapAssessments: [],
      evidencePlanItems: [],
      ...overrides
    }
  }

  it('ranks a clause with a prior Major NC above one with no history', () => {
    const gaps: GapAssessment[] = [
      { id: '1', auditProjectId: 'p1', clauseId: clauses[0].id, rating: 'major_nc', assessedAt: '2026-01-01' }
    ]
    const ranked = recommendQuestions(baseCtx({ gapAssessments: gaps }))
    expect(ranked[0].clauseId).toBe(clauses[0].id)
    expect(ranked[0].reasons.some((r) => r.includes('Major NC'))).toBe(true)
  })

  it('identifies weak areas sorted worst-first', () => {
    const gaps: GapAssessment[] = [
      { id: '1', auditProjectId: 'p1', clauseId: clauses[0].id, rating: 'conforms', assessedAt: '2026-01-01' },
      { id: '2', auditProjectId: 'p1', clauseId: clauses[1].id, rating: 'major_nc', assessedAt: '2026-01-01' }
    ]
    const weak = identifyWeakAreas(baseCtx({ gapAssessments: gaps }))
    expect(weak[0].clauseId).toBe(clauses[1].id)
  })

  it('flags evidence required by the knowledge base but absent from the evidence plan', () => {
    const missing = highlightMissingEvidence(baseCtx())
    expect(missing.length).toBeGreaterThan(0)
  })

  it('does not flag evidence already marked obtained', () => {
    const ev = clauses[0].evidenceRequired[0]
    const missing = highlightMissingEvidence(
      baseCtx({
        evidencePlanItems: [
          {
            id: 'e1',
            auditProjectId: 'p1',
            clauseId: clauses[0].id,
            category: ev.category,
            description: ev.description,
            status: 'obtained'
          }
        ]
      })
    )
    expect(missing.some((m) => m.clauseId === clauses[0].id && m.description === ev.description)).toBe(false)
  })

  it('groups the interview plan by process owner role', () => {
    const plan = generateInterviewPlan(baseCtx())
    expect(plan.length).toBeGreaterThan(0)
    for (const block of plan) expect(block.questions.length).toBeGreaterThan(0)
  })
})
