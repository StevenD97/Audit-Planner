import type { Clause, StandardId } from '../types'

/** Factory that fills in id/standardId/clauseNumber and safe array defaults. */
export function mkClause(
  standardId: StandardId,
  clauseNumber: string,
  partial: Partial<Omit<Clause, 'id' | 'standardId' | 'clauseNumber'>> &
    Pick<Clause, 'title' | 'sortOrder' | 'requirementSummary' | 'explanation' | 'auditIntent'>
): Clause {
  return {
    id: `${standardId}-${clauseNumber}`,
    standardId,
    clauseNumber,
    parentClauseNumber: partial.parentClauseNumber,
    title: partial.title,
    sortOrder: partial.sortOrder,
    isContainer: partial.isContainer ?? false,
    requirementSummary: partial.requirementSummary,
    explanation: partial.explanation,
    auditIntent: partial.auditIntent,
    processOwnerRoles: partial.processOwnerRoles ?? [],
    assumptions: partial.assumptions,
    mandatoryDocumentedInfo: partial.mandatoryDocumentedInfo ?? [],
    evidenceRequired: partial.evidenceRequired ?? [],
    interviewQuestions: partial.interviewQuestions ?? [],
    auditTests: partial.auditTests ?? [],
    potentialFindings: partial.potentialFindings ?? [],
    relatedClauses: partial.relatedClauses ?? [],
    crossStandardEquivalents: partial.crossStandardEquivalents ?? [],
    riskPrompts: partial.riskPrompts ?? []
  }
}
