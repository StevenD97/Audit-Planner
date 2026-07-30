import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const context14001: Clause[] = [
  mkClause(S, '4', {
    title: 'Context of the organization',
    sortOrder: 400,
    isContainer: true,
    requirementSummary: 'Establishes the foundation for the EMS: internal/external context, interested parties, scope and the EMS itself.',
    explanation:
      'This clause group is the "Plan" foundation of the EMS — before objectives or controls are set, the organization must understand what affects it and who it must satisfy.',
    auditIntent: 'Confirm the organization has genuinely analysed its context rather than treating 4.1-4.4 as a paperwork exercise disconnected from 6.1 risk/aspect identification.'
  }),
  mkClause(S, '4.1', {
    parentClauseNumber: '4',
    title: 'Understanding the organization and its context',
    sortOrder: 410,
    requirementSummary:
      'Determine external and internal issues relevant to purpose and affecting the ability to achieve intended EMS outcomes, including environmental conditions the organization affects or is affected by (pollution levels, resource availability, climate change, biodiversity, ecosystem health).',
    explanation:
      'A structured PESTLE/SWOT-style scan of issues (regulatory, market, technological, cultural, and specifically environmental conditions) that could help or hinder the EMS, revisited periodically rather than done once at certification.',
    auditIntent: 'Establish whether the context analysis is current, organization-specific (not generic/copied), and demonstrably used as an input to 4.2/6.1 rather than filed and forgotten.',
    processOwnerRoles: ['Top management', 'SHE/Environmental Manager', 'Strategy/Business Planning lead'],
    evidenceRequired: [
      { category: 'record', description: 'Context of the organization analysis (SWOT/PESTLE or equivalent)', typicalSource: 'EMS manual or standalone context register' },
      { category: 'record', description: 'Minutes showing context reviewed at management review or strategic planning' }
    ],
    interviewQuestions: [
      { audienceRole: 'Top management', question: 'What external and internal issues do you see as most relevant to this site\'s environmental performance right now?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'When did you last update the context analysis, and what changed?', questionType: 'trace' },
      { audienceRole: 'Top management', question: 'How does climate change or resource scarcity feature in your context assessment, if at all?', questionType: 'open' }
    ],
    auditTests: [
      { description: 'Trace one identified external issue (e.g. a new regulation or a climate risk) through to 6.1.3/6.1.4 and confirm it produced a documented risk/opportunity or compliance obligation.' }
    ],
    potentialFindings: [
      { severityHint: 'OFI', description: 'Context analysis is generic/template-based and not clearly linked to the organization\'s actual activities.' },
      { severityHint: 'Minor', description: 'Context analysis has not been reviewed since initial certification despite significant organizational change.' }
    ],
    relatedClauses: [
      { clauseNumber: '4.2', relationship: 'feeds_into' },
      { clauseNumber: '6.1.4', relationship: 'feeds_into' }
    ],
    crossStandardEquivalents: [
      { standardId: 'iso45001', clauseNumber: '4.1', relationship: 'equivalent', note: 'Identical structure; 45001 4.1 note also references climate change (2024 amendment).' }
    ],
    riskPrompts: [{ prompt: 'Has the sector experienced recent major regulatory change (e.g. extended producer responsibility, carbon reporting) not yet reflected in the context analysis?', riskWeight: 3 }]
  }),
  mkClause(S, '4.2', {
    parentClauseNumber: '4',
    title: 'Understanding the needs and expectations of interested parties',
    sortOrder: 420,
    requirementSummary:
      'Determine relevant interested parties; their relevant needs/expectations; and which of these become compliance obligations addressed through the EMS.',
    explanation:
      'Requires an interested-party register (regulators, neighbours, customers, investors, NGOs, employees, supply chain) with an explicit decision on which needs/expectations the organization treats as binding (compliance obligations) versus merely noted.',
    auditIntent: 'Verify the interested party list is complete for the site\'s actual context and that the compliance-obligations decision (6.1.3) is traceable back to specific interested-party requirements.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Legal/Compliance', 'Community/Stakeholder relations'],
    mandatoryDocumentedInfo: [],
    evidenceRequired: [
      { category: 'record', description: 'Interested parties register with needs/expectations and compliance-obligation determination' },
      { category: 'record', description: 'Evidence of stakeholder engagement (community liaison minutes, customer environmental questionnaires, regulator correspondence)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'Who are your relevant interested parties, and how did you decide which of their expectations become compliance obligations?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'Show me a recent example of a stakeholder expectation that changed and how the EMS responded.', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Cross-check the interested-party register against the compliance obligations register (6.1.3) for at least 3 parties.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'Interested party register omits an obviously relevant party (e.g. a downstream regulator or an adjacent community) for the site\'s activities.' },
      { severityHint: 'OFI', description: 'No clear rationale recorded for why certain stakeholder expectations were or were not adopted as compliance obligations.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.3', relationship: 'feeds_into' }, { clauseNumber: '4.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '4.2', relationship: 'equivalent', note: '45001 4.2 explicitly names "workers" as a mandatory interested party; 14001 does not single one out.' }],
    riskPrompts: [{ prompt: 'Are there active community complaints or enforcement notices suggesting an interested party expectation was missed?', riskWeight: 4 }]
  }),
  mkClause(S, '4.3', {
    parentClauseNumber: '4',
    title: 'Determining the scope of the environmental management system',
    sortOrder: 430,
    requirementSummary:
      'Determine EMS boundaries/applicability considering 4.1/4.2, organizational units/functions/physical boundaries, activities/products/services, and authority/ability to control or influence over the life cycle. Once defined, all in-scope activities/products/services must be included. Scope shall be documented information, available to interested parties.',
    explanation: 'A precise, defensible statement of what the EMS covers (and, importantly, what it deliberately excludes and why) — scope cannot be used to exclude an inconvenient activity that is otherwise within the organization\'s control.',
    auditIntent: 'Confirm the scope statement is accurate, available to interested parties (e.g. published), and that nothing materially within the organization\'s control has been improperly excluded.',
    processOwnerRoles: ['Top management', 'SHE/Environmental Manager'],
    mandatoryDocumentedInfo: [{ description: 'EMS scope statement', kind: 'document' }],
    evidenceRequired: [
      { category: 'record', description: 'Published/available EMS scope statement (website, manual, certificate schedule)' },
      { category: 'record', description: 'Site plan/organization chart showing boundaries matching the scope wording' }
    ],
    interviewQuestions: [
      { audienceRole: 'Top management', question: 'Why is the scope drawn where it is — are there any activities, sites or leased areas deliberately excluded, and on what basis?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'Is the published scope statement identical to what is on the certificate/EMS manual?', questionType: 'verification' }
    ],
    auditTests: [{ description: 'Walk the site boundary/process list against the scope statement to identify any undeclared activity under the organization\'s control.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A significant activity under the organization\'s direct control is excluded from scope without justification.' },
      { severityHint: 'Minor', description: 'Scope statement is not available/accessible to interested parties as required.' }
    ],
    relatedClauses: [{ clauseNumber: '4.4', relationship: 'feeds_into' }, { clauseNumber: '6.1.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '4.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Has the organization recently acquired, leased or divested a site/activity that may not yet be reflected in scope?', riskWeight: 3 }]
  }),
  mkClause(S, '4.4', {
    parentClauseNumber: '4',
    title: 'Environmental management system',
    sortOrder: 440,
    requirementSummary: 'Establish, implement, maintain and continually improve an EMS, including the processes needed and their interactions, per this document, considering 4.1/4.2 knowledge.',
    explanation: 'The umbrella requirement that the EMS must actually operate as an integrated set of interacting processes, not a binder of disconnected procedures.',
    auditIntent: 'Confirm process interactions are understood and documented (e.g. a process map/turtle diagrams) and that the EMS is a living system reflecting 4.1/4.2 knowledge.',
    processOwnerRoles: ['SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'EMS process map / process interaction diagram' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How do the EMS processes you manage interact with other business processes (production planning, procurement, HR)?', questionType: 'open' }],
    auditTests: [{ description: 'Select one EMS process and trace its inputs/outputs to at least one other business process.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'EMS documentation describes individual procedures but no process interaction view exists.' }],
    relatedClauses: [{ clauseNumber: '4.1', relationship: 'depends_on' }, { clauseNumber: '4.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '4.4', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is the EMS integrated with the wider business management system or run as a parallel, siloed system?', riskWeight: 2 }]
  })
]
