import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const support14001: Clause[] = [
  mkClause(S, '7', {
    title: 'Support',
    sortOrder: 700,
    isContainer: true,
    requirementSummary: 'Resources, competence, awareness, communication and documented information underpinning the EMS.',
    explanation: 'The enabling infrastructure clauses — audits here focus on whether "enough" support exists, judged against the significance/complexity established in Clause 6.',
    auditIntent: 'Calibrate expectations to the organization\'s risk profile rather than a fixed checklist.'
  }),
  mkClause(S, '7.1', {
    parentClauseNumber: '7',
    title: 'Resources',
    sortOrder: 710,
    requirementSummary: 'Determine and provide resources needed for establishment, implementation, maintenance and continual improvement of the EMS.',
    explanation: 'Covers people, time, budget, equipment and infrastructure (e.g. monitoring equipment, spill kits, treatment plant capacity).',
    auditIntent: 'Test whether resourcing matches the scale of significant aspects/risks identified, not just whether a budget line exists.',
    processOwnerRoles: ['Top management', 'SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'EMS budget/resource plan approved by top management' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Is there anything you need to manage environmental performance effectively that you don\'t currently have?', questionType: 'open' }],
    auditTests: [{ description: 'Compare resource allocation against the significance/risk profile from 6.1.2/6.1.4.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Monitoring equipment maintenance/calibration budget is not clearly planned.' }],
    relatedClauses: [{ clauseNumber: '5.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Has an objective or corrective action stalled specifically due to lack of resource?', riskWeight: 3 }]
  }),
  mkClause(S, '7.2', {
    parentClauseNumber: '7',
    title: 'Competence',
    sortOrder: 720,
    requirementSummary: 'Determine necessary competence of persons doing work under the organization\'s control affecting environmental performance/compliance; ensure competence via education/training/experience; determine training needs; take actions and evaluate effectiveness; retain documented evidence.',
    explanation: 'Applies to anyone whose work can affect environmental performance, not only the environmental team — includes operators, contractors, and even some office-based roles depending on aspects.',
    auditIntent: 'Verify competence requirements are defined per role (not generic), training has occurred, and — critically — effectiveness was evaluated, not just attendance recorded.',
    processOwnerRoles: ['HR/Training', 'SHE/Environmental Manager', 'Line Managers'],
    mandatoryDocumentedInfo: [{ description: 'Evidence of competence (training records, certificates, qualifications)', kind: 'record' }],
    evidenceRequired: [
      { category: 'competence', description: 'Competence matrix/role profiles for environmentally significant roles' },
      { category: 'competence', description: 'Training records and certificates' },
      { category: 'competence', description: 'Evidence of training-effectiveness evaluation (e.g. post-training assessment, observed competence)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'What environmental training have you received for your role, and how was it checked that it worked?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'How do you determine competence requirements for a role that affects a significant aspect?', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Select a worker in a significant-aspect role and trace competence determination → training delivered → effectiveness evaluation.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'Training was delivered but no effectiveness evaluation was performed (attendance-only records).' },
      { severityHint: 'Major', description: 'A worker in a role with significant environmental impact (e.g. hazardous waste handling) lacks required competence evidence.' }
    ],
    relatedClauses: [{ clauseNumber: '7.3', relationship: 'feeds_into' }, { clauseNumber: '6.1.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.2', relationship: 'equivalent', note: '45001 explicitly includes "ability to identify hazards" as part of worker competence.' }],
    riskPrompts: [{ prompt: 'Is there high turnover or recent contractor use in an environmentally significant role, with a lag in competence evidence?', riskWeight: 3 }]
  }),
  mkClause(S, '7.3', {
    parentClauseNumber: '7',
    title: 'Awareness',
    sortOrder: 730,
    requirementSummary: 'Ensure persons doing work under the organization\'s control are aware of the environmental policy; significant aspects/impacts related to their work; their contribution to EMS effectiveness; and the implications of not conforming.',
    explanation: 'Broader than competence — a general-awareness bar for everyone on site, including non-operational staff and contractors.',
    auditIntent: 'Sample staff across functions/shifts (not just the environmental champions) to test genuine awareness.',
    processOwnerRoles: ['HR/Training', 'Line Managers'],
    evidenceRequired: [{ category: 'record', description: 'Induction records covering environmental awareness' }, { category: 'record', description: 'Toolbox talk / briefing records' }],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'What could happen if the EMS requirements for your job weren\'t followed?', questionType: 'open' }],
    auditTests: [{ description: 'Interview at least 3 workers from different functions/shifts unannounced.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Contractors on long-term site presence have not received environmental awareness induction.' }],
    relatedClauses: [{ clauseNumber: '5.2', relationship: 'depends_on' }, { clauseNumber: '6.1.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.3', relationship: 'equivalent', note: '45001 additionally requires awareness of the right to remove oneself from imminent danger.' }],
    riskPrompts: [{ prompt: 'Do contractors/agency workers receive the same awareness induction as permanent staff?', riskWeight: 3 }]
  }),
  mkClause(S, '7.4', {
    parentClauseNumber: '7',
    title: 'Communication',
    sortOrder: 740,
    isContainer: true,
    requirementSummary: 'Establish process(es) for internal/external communication (what/when/whom/how); ensure information is consistent/reliable; respond to relevant communications; retain evidence.',
    explanation: 'A deliberately flexible clause — the audit interest is whether the organization has actually thought through its communication needs rather than defaulted to "we have an intranet".',
    auditIntent: 'Confirm both internal and external channels function, and that inbound communications (complaints, regulator queries) get a documented response.',
    relatedClauses: [{ clauseNumber: '7.4.2', relationship: 'depends_on' }, { clauseNumber: '7.4.3', relationship: 'depends_on' }]
  }),
  mkClause(S, '7.4.1', {
    parentClauseNumber: '7.4',
    title: 'General',
    sortOrder: 741,
    requirementSummary: 'Determine what/when/whom/how to communicate; take compliance obligations into account; ensure communicated information is consistent with EMS-generated information and reliable; respond to relevant communications; retain evidence.',
    explanation: 'Sets the communication planning framework before splitting into internal/external.',
    auditIntent: 'Verify a communications plan exists and inbound queries/complaints are logged and responded to.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Communications/PR'],
    evidenceRequired: [{ category: 'record', description: 'Communications plan/matrix (what, when, whom, how)' }, { category: 'record', description: 'Log of external enquiries/complaints and responses' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Show me a recent external enquiry or complaint and how it was handled.', questionType: 'trace' }],
    auditTests: [{ description: 'Sample the complaints/enquiries log and verify timely, consistent responses.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'A logged community complaint has no evidence of a response or resolution.' }],
    relatedClauses: [{ clauseNumber: '9.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.4.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are there unresolved or repeated community/regulator complaints?', riskWeight: 4 }]
  }),
  mkClause(S, '7.4.2', {
    parentClauseNumber: '7.4',
    title: 'Internal communication',
    sortOrder: 742,
    requirementSummary: 'Internally communicate EMS-relevant information among levels/functions, including EMS changes, as appropriate; enable persons to contribute to continual improvement.',
    explanation: 'Tests whether communication is two-way — staff should be able to feed suggestions upward, not just receive bulletins.',
    auditIntent: 'Confirm a genuine feedback/suggestion mechanism exists and has been used.',
    processOwnerRoles: ['Line Managers', 'SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'Evidence of two-way internal communication (suggestion scheme, team briefings with feedback capture)' }],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Have you ever raised an environmental suggestion or concern, and what happened to it?', questionType: 'open' }],
    auditTests: [{ description: 'Trace one worker-raised suggestion/concern to a documented outcome.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Communication is one-way (top-down) with no evidenced mechanism for worker input.' }],
    relatedClauses: [{ clauseNumber: '10.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.4.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is there a functioning suggestion scheme, and when was it last used?', riskWeight: 1 }]
  }),
  mkClause(S, '7.4.3', {
    parentClauseNumber: '7.4',
    title: 'External communication',
    sortOrder: 743,
    requirementSummary: 'Externally communicate EMS-relevant information as established by the communication process(es) and as required by compliance obligations.',
    explanation: 'Covers regulatory reporting, public disclosures, and any voluntary external reporting the organization has committed to.',
    auditIntent: 'Confirm mandatory external reporting (e.g. permit returns, emissions reporting) has actually been submitted on time.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Legal/Compliance'],
    evidenceRequired: [{ category: 'record', description: 'Copies of submitted regulatory returns/reports and submission dates' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What external environmental reports are you required to submit, and when were they last sent?', questionType: 'verification' }],
    auditTests: [{ description: 'Verify at least one mandatory external report/return against its required submission date.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A mandatory regulatory report/return was submitted late or not at all.' }],
    relatedClauses: [{ clauseNumber: '6.1.3', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.4.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Any recent near-miss on a regulatory reporting deadline?', riskWeight: 4 }]
  }),
  mkClause(S, '7.5', {
    parentClauseNumber: '7',
    title: 'Documented information',
    sortOrder: 750,
    isContainer: true,
    requirementSummary: 'EMS shall include documented information required by the standard plus that determined necessary by the organization; covers creating/updating (7.5.2) and control (7.5.3).',
    explanation: 'Sets expectations for document control proportionate to organizational complexity — not "more paperwork is better".',
    auditIntent: 'Sample document control practice rather than auditing this clause in isolation.'
  }),
  mkClause(S, '7.5.1', {
    parentClauseNumber: '7.5',
    title: 'General',
    sortOrder: 751,
    requirementSummary: 'EMS documented information = that required by the standard + that the organization determines necessary for EMS effectiveness.',
    explanation: 'A scoping clause — the extent of documentation should reflect size, complexity, competence and compliance-demonstration needs.',
    auditIntent: 'Assess whether documentation is proportionate — under-documented in high-risk areas, or excessively bureaucratic in low-risk ones, are both findings.',
    processOwnerRoles: ['SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'Document/record register or master list' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How did you decide what needs to be documented versus left to competence/experience?', questionType: 'open' }],
    auditTests: [{ description: 'Compare documentation depth against complexity/risk of the process being controlled.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'A high-risk process (e.g. hazardous waste transfer) is under-documented relative to its risk.' }],
    relatedClauses: [{ clauseNumber: '7.5.2', relationship: 'feeds_into' }, { clauseNumber: '7.5.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.5.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is documentation volume disproportionate (too much or too little) relative to the significance identified in 6.1.2?', riskWeight: 1 }]
  }),
  mkClause(S, '7.5.2', {
    parentClauseNumber: '7.5',
    title: 'Creating and updating documented information',
    sortOrder: 752,
    requirementSummary: 'Ensure appropriate identification/description (title, date, author, reference), format/media, and review/approval for suitability and adequacy when creating/updating documented information.',
    explanation: 'Basic document-authoring discipline — version control fields and an approval step before release.',
    auditIntent: 'Spot-check documents for identification fields and evidence of approval.',
    processOwnerRoles: ['Document controller', 'SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'Document template/standard with identification fields (title, date, author, version)' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Who approves a new or revised EMS procedure before it is released?', questionType: 'verification' }],
    auditTests: [{ description: 'Sample 3 documents for identification fields and approval evidence.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'A document in use lacks a version number or approval signature/date.' }],
    relatedClauses: [{ clauseNumber: '7.5.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.5.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are multiple versions of the same procedure found in circulation on site (e.g. printed copies not withdrawn)?', riskWeight: 2 }]
  }),
  mkClause(S, '7.5.3', {
    parentClauseNumber: '7.5',
    title: 'Control of documented information',
    sortOrder: 753,
    requirementSummary: 'Ensure documented information is available/suitable where needed and adequately protected; address distribution/access/retrieval/use, storage/preservation, change control, retention/disposition; control externally-originated documents determined necessary.',
    explanation: 'Practical document/record control — availability at point of use is as important as version control.',
    auditIntent: 'Check the right version is actually accessible at the point of use (e.g. on the shop floor, not only in an office server).',
    processOwnerRoles: ['Document controller'],
    evidenceRequired: [{ category: 'record', description: 'Document control procedure covering retention periods and superseded-document withdrawal' }],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Where do you access the current version of the procedure for this task?', questionType: 'verification' }],
    auditTests: [{ description: 'At point of use, confirm the document available matches the master/controlled version.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'An obsolete procedure version is still in use at the point of work.' }],
    relatedClauses: [{ clauseNumber: '7.5.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '7.5.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are externally-supplied documents (e.g. supplier SDS, contractor method statements) subject to any version control?', riskWeight: 2 }]
  })
]
