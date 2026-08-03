import { describe, it, expect } from 'vitest'
import { getActiveProvider, nullProvider } from '@shared/engine/ai'
import * as recommender from '@shared/engine/recommender'

describe('AI provider seam', () => {
  it('defaults to the always-available deterministic provider', () => {
    const provider = getActiveProvider()
    expect(provider.id).toBe('none')
    expect(provider.available).toBe(true)
  })

  it('wraps the existing recommender functions unchanged (same behaviour, new seam)', () => {
    expect(nullProvider.recommendQuestions).toBe(recommender.recommendQuestions)
    expect(nullProvider.suggestAuditTrails).toBe(recommender.suggestAuditTrails)
    expect(nullProvider.identifyWeakAreas).toBe(recommender.identifyWeakAreas)
    expect(nullProvider.generateInterviewPlan).toBe(recommender.generateInterviewPlan)
    expect(nullProvider.highlightMissingEvidence).toBe(recommender.highlightMissingEvidence)
    expect(nullProvider.generateAgenda).toBe(recommender.generateAgenda)
  })
})
