import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const context45001: Clause[] = [
  mkClause(S, '4', {
    title: 'Context of the organization',
    sortOrder: 400,
    isContainer: true,
    requirementSummary: 'External/internal issues, worker and other interested party needs, OH&S management system scope, and the OH&S management system itself.',
    explanation: 'Foundation clauses paralleling ISO 14001 Clause 4, but with workers as a mandatory, named interested party throughout.',
    auditIntent: 'Confirm workers are treated as a distinct, consulted interested party, not folded silently into "employees" generic HR language.'
  }),
  mkClause(S, '4.1', {
    parentClauseNumber: '4',
    title: 'Understanding the organization and its context',
    sortOrder: 410,
    requirementSummary: 'Determine external/internal issues relevant to purpose and affecting the ability to achieve intended OH&S outcomes.',
    explanation: 'A PESTLE/SWOT-style scan for OH&S — the 2024 amendment adds an explicit note that relevant interested parties can have requirements related to climate change.',
    auditIntent: 'Confirm the context scan considers real workplace-relevant issues (workforce demographics, contractor use, new hazards from climate-related events) not a generic corporate risk list.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    assumptions: ['Treated per the 2024 amendment: climate-change-related requirements are an explicit consideration under external issues, without this being a wholesale restructuring of clause 4.1.'],
    evidenceRequired: [{ category: 'record', description: 'OH&S context analysis (SWOT/PESTLE or equivalent) including workforce and climate-related considerations' }],
    interviewQuestions: [{ audienceRole: 'Top management', question: 'What internal and external issues do you see as most relevant to worker health and safety right now, including any climate-related ones (e.g. heat stress, extreme weather)?', questionType: 'open' }],
    auditTests: [{ description: 'Trace one identified issue (e.g. an ageing workforce, extreme heat events) through to 6.1.2 hazard identification.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Context analysis does not consider climate-related OH&S issues (e.g. heat stress) despite outdoor/exposed work activities.' }],
    relatedClauses: [{ clauseNumber: '4.2', relationship: 'feeds_into' }, { clauseNumber: '6.1.2.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '4.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Does the workforce include significant outdoor, lone, or high-heat-exposure work not reflected in the context analysis?', riskWeight: 3 }]
  }),
  mkClause(S, '4.2', {
    parentClauseNumber: '4',
    title: 'Understanding the needs and expectations of workers and other interested parties',
    sortOrder: 420,
    requirementSummary: 'Determine other interested parties (beyond workers); relevant needs/expectations of workers and other interested parties; which needs/expectations are/could become legal requirements and other requirements.',
    explanation: 'Workers are named explicitly as a mandatory interested party (unlike 14001, which has no single named party) — reflecting the participatory ethos of 45001.',
    auditIntent: 'Confirm the process actively captures worker expectations (not just via management-selected representatives) and other parties (contractors, regulators, health services).',
    processOwnerRoles: ['SHE/OH&S Manager', 'HR', 'Worker representatives'],
    evidenceRequired: [
      { category: 'record', description: 'Interested parties register including workers, workers\' representatives, contractors, regulators' },
      { category: 'record', description: 'Evidence of direct worker consultation on needs/expectations (surveys, safety committee minutes)' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Have you or your representative been asked what you need from the safety management system?', questionType: 'open' }],
    auditTests: [{ description: 'Trace a worker-raised expectation to a decision on whether it became a legal/other requirement.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Worker expectations are inferred by management with no direct consultation evidence.' }],
    relatedClauses: [{ clauseNumber: '5.4', relationship: 'feeds_into' }, { clauseNumber: '6.1.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '4.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are workers\' representatives (union or elected) actively engaged, or nominal only?', riskWeight: 3 }]
  }),
  mkClause(S, '4.3', {
    parentClauseNumber: '4',
    title: 'Determining the scope of the OH&S management system',
    sortOrder: 430,
    requirementSummary: 'Determine boundaries/applicability of the OH&S management system considering 4.1/4.2 and planned/performed work-related activities. Scope shall include activities/products/services within the organization\'s control/influence that can impact its OH&S performance. Scope shall be documented information.',
    explanation: 'Scope is anchored to work-related activities under control/influence — cannot exclude a hazardous activity simply because it is contracted out if the organization still influences it.',
    auditIntent: 'Verify no in-scope, hazard-bearing activity has been improperly excluded, particularly shared/multi-employer worksites.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    mandatoryDocumentedInfo: [{ description: 'OH&S management system scope statement', kind: 'document' }],
    evidenceRequired: [{ category: 'record', description: 'Scope statement including sites, multi-employer worksite arrangements' }],
    interviewQuestions: [{ audienceRole: 'Top management', question: 'Are there any shared/multi-employer worksites, and how is scope drawn around them?', questionType: 'open' }],
    auditTests: [{ description: 'Check scope against actual site list/contractor presence for undeclared hazardous activity under the organization\'s influence.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A multi-employer worksite where the organization has clear influence over worker safety is excluded from scope.' }],
    relatedClauses: [{ clauseNumber: '4.4', relationship: 'feeds_into' }, { clauseNumber: '8.1.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '4.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Any recent change in contractor/multi-employer arrangements not reflected in scope?', riskWeight: 3 }]
  }),
  mkClause(S, '4.4', {
    parentClauseNumber: '4',
    title: 'OH&S management system',
    sortOrder: 440,
    requirementSummary: 'Establish, implement, maintain and continually improve an OH&S management system, including processes needed and their interactions, per this document.',
    explanation: 'The umbrella system-level requirement mirroring ISO 14001 4.4.',
    auditIntent: 'Confirm OH&S processes are integrated with operations, not run as a standalone safety department system.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'OH&S process map/interaction diagram' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How do OH&S processes interact with production planning and HR processes?', questionType: 'open' }],
    auditTests: [{ description: 'Trace one OH&S process\'s inputs/outputs to a non-OH&S business process.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'OH&S management system operates in isolation from production/operations planning.' }],
    relatedClauses: [{ clauseNumber: '4.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '4.4', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is OH&S considered at the production/operations planning stage or only after the fact?', riskWeight: 2 }]
  })
]
