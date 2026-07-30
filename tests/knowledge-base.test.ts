import { describe, it, expect } from 'vitest'
import {
  allClauses,
  getClausesByStandard,
  getAuditableClauses,
  getClause,
  searchClauses,
  resolveRelatedClauses,
  resolveCrossStandardEquivalents,
  auditTrails
} from '@shared/knowledge-base'
import { resolveTrailClauses } from '@shared/engine/trailBuilder'

describe('knowledge base integrity', () => {
  it('has no duplicate clause ids', () => {
    const ids = allClauses.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('loads both standards with a substantial clause set', () => {
    expect(getClausesByStandard('iso14001').length).toBeGreaterThan(30)
    expect(getClausesByStandard('iso45001').length).toBeGreaterThan(35)
  })

  it('every auditable (non-container) clause has at least one interview question and one evidence item', () => {
    for (const clause of [...getAuditableClauses('iso14001'), ...getAuditableClauses('iso45001')]) {
      expect(clause.interviewQuestions.length, `${clause.id} missing questions`).toBeGreaterThan(0)
      expect(clause.evidenceRequired.length, `${clause.id} missing evidence`).toBeGreaterThan(0)
    }
  })

  it('every relatedClauses reference resolves to a real clause in the same standard', () => {
    for (const clause of allClauses) {
      const resolved = resolveRelatedClauses(clause)
      expect(resolved.length).toBe(clause.relatedClauses.length)
      for (const r of resolved) expect(r.standardId).toBe(clause.standardId)
    }
  })

  it('every crossStandardEquivalents reference resolves to a real clause', () => {
    for (const clause of allClauses) {
      const resolved = resolveCrossStandardEquivalents(clause)
      expect(resolved.length).toBe(clause.crossStandardEquivalents.length)
    }
  })

  it('parentClauseNumber references (where set) point to an existing clause', () => {
    for (const clause of allClauses) {
      if (!clause.parentClauseNumber) continue
      const parent = getClause(clause.standardId, clause.parentClauseNumber)
      expect(parent, `${clause.id} parent ${clause.parentClauseNumber} missing`).toBeDefined()
    }
  })

  it('search finds a known clause by keyword', () => {
    const results = searchClauses('hierarchy of controls', 'iso45001')
    expect(results.some((c) => c.clauseNumber === '8.1.2')).toBe(true)
  })

  it('every audit trail step resolves to a real clause', () => {
    for (const trail of auditTrails) {
      const resolved = resolveTrailClauses(trail)
      expect(resolved.length).toBe(trail.steps.length)
    }
  })
})
