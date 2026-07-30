import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const improvement45001: Clause[] = [
  mkClause(S, '10', {
    title: 'Improvement',
    sortOrder: 1000,
    isContainer: true,
    requirementSummary: 'General improvement principle, incident/nonconformity/corrective action, and continual improvement.',
    explanation: 'The "Act" phase; uniquely for 45001 this includes "incident" as a category distinct from nonconformity.',
    auditIntent: 'Check incident investigation depth and worker participation, not only paperwork closure.'
  }),
  mkClause(S, '10.1', {
    parentClauseNumber: '10',
    title: 'General',
    sortOrder: 1010,
    requirementSummary: 'The organization shall determine and select opportunities for improvement and implement necessary actions to achieve the intended outcomes of the OH&S management system.',
    explanation: 'A short umbrella clause with no direct 14001 equivalent (14001 has no separate "10.1 General" — its 10.1 is "Continual improvement" itself).',
    auditIntent: 'Confirm improvement opportunities from all sources (audits, incidents, consultation, monitoring) feed a single, visible improvement mechanism.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Improvement register/log aggregating opportunities from all sources' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Where do improvement opportunities get logged, regardless of source (audit, incident, worker suggestion)?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm a single improvement log/register exists rather than opportunities scattered across disconnected sources.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Improvement opportunities from different sources (audits, incidents, suggestions) are not tracked centrally, risking loss of follow-up.' }],
    relatedClauses: [{ clauseNumber: '10.2', relationship: 'feeds_into' }, { clauseNumber: '10.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '10.1', relationship: 'partial_overlap' }],
    riskPrompts: [{ prompt: 'Are improvement opportunities from worker consultation actually reaching this register?', riskWeight: 2 }]
  }),
  mkClause(S, '10.2', {
    parentClauseNumber: '10',
    title: 'Incident, nonconformity and corrective action',
    sortOrder: 1020,
    requirementSummary:
      'React in a timely manner to incidents/nonconformities: control/correct, deal with consequences; evaluate need for corrective action with worker participation and involvement of other relevant interested parties, by investigating/reviewing, determining cause(s), checking for similar/potential occurrences; review existing OH&S risk assessments as appropriate; determine/implement action incl. corrective action per hierarchy of controls and MOC; assess OH&S risks for new/changed hazards before acting; review effectiveness; change the OH&S management system if necessary. Corrective action proportionate to effects/potential effects. Retain evidence; communicate to relevant workers/representatives/interested parties.',
    explanation: 'Explicitly requires worker participation in the investigation itself (not just being informed of the outcome), and requires reviewing whether new controls introduce new hazards before implementing them — a subtlety often missed.',
    auditIntent: 'Verify worker participation in investigations (not management-only investigation), and that new/changed hazards from the corrective action itself were assessed before implementation.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Operations Manager', 'Worker representatives'],
    mandatoryDocumentedInfo: [
      { description: 'Nature of incidents/nonconformities and subsequent actions taken', kind: 'record' },
      { description: 'Results of any action and corrective action, including their effectiveness', kind: 'record' }
    ],
    evidenceRequired: [
      { category: 'record', description: 'Incident/nonconformity/CAPA register with root cause, worker participation evidence, and effectiveness review' },
      { category: 'record', description: 'Evidence communication of investigation outcomes to relevant workers/representatives' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'Were you or a colleague involved in investigating the last incident in your area, or was it management-only?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'For your most significant incident this year, what new hazard risk did the corrective action itself introduce, and how was that assessed?', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Select 2-3 closed incident investigations and verify: timely reaction, worker participation, root cause depth, hierarchy-of-controls-based corrective action, effectiveness review, and communication to workers.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A significant incident investigation shows no evidence of worker participation despite the explicit requirement.' },
      { severityHint: 'Minor', description: 'Corrective actions are closed without an effectiveness review or communication to affected workers.' }
    ],
    relatedClauses: [{ clauseNumber: '9.2.2', relationship: 'depends_on' }, { clauseNumber: '5.4', relationship: 'depends_on' }, { clauseNumber: '8.1.2', relationship: 'depends_on' }, { clauseNumber: '6.1.2.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '10.2', relationship: 'equivalent', note: '14001 10.2 covers nonconformities only; 45001 10.2 additionally covers "incidents" (with or without an accompanying nonconformity) and mandates worker participation in investigation.' }],
    riskPrompts: [
      { prompt: 'How many incident investigations are overdue or closed with superficial root cause (e.g. "human error" only)?', riskWeight: 5 },
      { prompt: 'Is there a repeat-incident theme across sites/shifts suggesting an unaddressed systemic cause?', riskWeight: 5 }
    ]
  }),
  mkClause(S, '10.3', {
    parentClauseNumber: '10',
    title: 'Continual improvement',
    sortOrder: 1030,
    requirementSummary: 'Continually improve suitability/adequacy/effectiveness of the OH&S management system by: enhancing OH&S performance; promoting a supporting culture; promoting worker participation in improvement actions; communicating relevant continual improvement results to workers/representatives; maintaining/retaining documented evidence.',
    explanation: 'Explicitly ties continual improvement to culture-building and worker participation — a recurring theme distinguishing 45001 from 14001\'s more document-centric equivalent.',
    auditIntent: 'Look for proactive, culture-oriented improvement activity (not only reactive corrective action) with visible worker involvement.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    evidenceRequired: [
      { category: 'record', description: 'Register of proactive OH&S improvement initiatives with worker involvement evidence' },
      { category: 'record', description: 'Evidence of communication of improvement results to workers/representatives' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'What safety improvement have you or your colleagues driven recently, rather than management alone?', questionType: 'open' }],
    auditTests: [{ description: 'Identify at least one worker-driven or worker-involved proactive improvement completed in the audit period.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'All improvement activity is management-driven with no evidenced worker involvement.' }],
    relatedClauses: [{ clauseNumber: '9.3', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'depends_on' }, { clauseNumber: '5.4', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '10.1', relationship: 'equivalent', note: '14001 10.1 is the nearest equivalent but has no worker-participation or culture-promotion requirement.' }],
    riskPrompts: [{ prompt: 'Has worker involvement in improvement initiatives declined or become tokenistic (e.g. same 2-3 representatives always consulted)?', riskWeight: 2 }]
  })
]
