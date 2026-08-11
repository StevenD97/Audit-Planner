import { describe, it, expect } from 'vitest'
import { getAuditableClauses } from '../src/shared/knowledge-base'
import { getEvidenceGuidance } from '../src/shared/knowledge-base/evidenceGuidance'

describe('evidence guidance coverage', () => {
  it('has an example for every interview question in both standards', () => {
    const missing: string[] = []
    for (const standardId of ['iso14001', 'iso45001'] as const) {
      for (const clause of getAuditableClauses(standardId)) {
        clause.interviewQuestions.forEach((q, i) => {
          if (!getEvidenceGuidance(clause.id, i)) missing.push(`${clause.id}::${i} — ${q.question}`)
        })
      }
    }
    expect(missing).toEqual([])
  })

  it('returns undefined for an out-of-range question index', () => {
    expect(getEvidenceGuidance('iso14001-4.1', 99)).toBeUndefined()
  })

  it('returns undefined for an unknown clause', () => {
    expect(getEvidenceGuidance('iso14001-99.99', 0)).toBeUndefined()
  })
})
