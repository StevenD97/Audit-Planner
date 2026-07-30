import { standards } from './standards'
import { iso14001Clauses } from './iso14001'
import { iso45001Clauses } from './iso45001'
import { auditTrails } from './trails'
import type { Clause, Standard, StandardId, AuditTrailDefinition } from '../types'

export const allClauses: Clause[] = [...iso14001Clauses, ...iso45001Clauses]
export { standards, auditTrails }

export function getStandard(standardId: StandardId): Standard | undefined {
  return standards.find((s) => s.id === standardId)
}

export function getClausesByStandard(standardId: StandardId): Clause[] {
  return allClauses.filter((c) => c.standardId === standardId).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getClause(standardId: StandardId, clauseNumber: string): Clause | undefined {
  return allClauses.find((c) => c.standardId === standardId && c.clauseNumber === clauseNumber)
}

export function getClauseById(id: string): Clause | undefined {
  return allClauses.find((c) => c.id === id)
}

export function getChildClauses(standardId: StandardId, parentClauseNumber: string): Clause[] {
  return allClauses
    .filter((c) => c.standardId === standardId && c.parentClauseNumber === parentClauseNumber)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Only the "auditable" leaf clauses (i.e. not structural containers like "6" or "6.1"). */
export function getAuditableClauses(standardId: StandardId): Clause[] {
  return getClausesByStandard(standardId).filter((c) => !c.isContainer)
}

export function searchClauses(query: string, standardId?: StandardId): Clause[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return allClauses
    .filter((c) => !standardId || c.standardId === standardId)
    .filter(
      (c) =>
        c.clauseNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.requirementSummary.toLowerCase().includes(q) ||
        c.explanation.toLowerCase().includes(q) ||
        c.interviewQuestions.some((iq) => iq.question.toLowerCase().includes(q)) ||
        c.evidenceRequired.some((e) => e.description.toLowerCase().includes(q))
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function resolveRelatedClauses(clause: Clause): Clause[] {
  return clause.relatedClauses
    .map((ref) => getClause(clause.standardId, ref.clauseNumber))
    .filter((c): c is Clause => Boolean(c))
}

export function resolveCrossStandardEquivalents(clause: Clause): Clause[] {
  return clause.crossStandardEquivalents
    .map((ref) => getClause(ref.standardId, ref.clauseNumber))
    .filter((c): c is Clause => Boolean(c))
}

export function getTrailsForStandards(standardIds: StandardId[]): AuditTrailDefinition[] {
  return auditTrails.filter(
    (t) => t.standardIds === 'combined' || t.standardIds.some((s) => standardIds.includes(s))
  )
}
