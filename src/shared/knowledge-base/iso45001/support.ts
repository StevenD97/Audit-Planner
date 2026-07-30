import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const support45001: Clause[] = [
  mkClause(S, '7', {
    title: 'Support',
    sortOrder: 700,
    isContainer: true,
    requirementSummary: 'Resources, competence, awareness, communication and documented information underpinning the OH&S management system.',
    explanation: 'Enabling infrastructure clauses; scale expectations to the hazard profile established in Clause 6.',
    auditIntent: 'Calibrate depth of evidence expected to the organization\'s actual risk profile.'
  }),
  mkClause(S, '7.1', {
    parentClauseNumber: '7',
    title: 'Resources',
    sortOrder: 710,
    requirementSummary: 'Determine and provide resources needed for establishment, implementation, maintenance and continual improvement of the OH&S management system.',
    explanation: 'Covers people, PPE budget, competent OH&S advice, monitoring/testing equipment, and time for consultation/participation.',
    auditIntent: 'Test whether PPE/engineering-control budgets and consultation time are genuinely resourced, not just headcount.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'OH&S budget/resource plan incl. PPE, engineering controls, consultation time' }],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Is there anything you need to work safely that you don\'t currently have?', questionType: 'open' }],
    auditTests: [{ description: 'Compare resource allocation against the hazard/risk profile from 6.1.2.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'PPE replacement budget is reactive rather than planned.' }],
    relatedClauses: [{ clauseNumber: '5.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Has a corrective action ever stalled due to lack of resource/budget for an engineering control?', riskWeight: 3 }]
  }),
  mkClause(S, '7.2', {
    parentClauseNumber: '7',
    title: 'Competence',
    sortOrder: 720,
    requirementSummary: 'Determine necessary competence of workers affecting/able to affect OH&S performance; ensure workers competent (including the ability to identify hazards) based on education/training/experience; take actions to acquire/maintain competence where applicable and evaluate effectiveness; retain documented evidence.',
    explanation: 'Explicitly requires the ability to identify hazards as part of competence — broader than a generic skills matrix.',
    auditIntent: 'Confirm competence assessment specifically tests hazard-recognition ability, not only task skill.',
    processOwnerRoles: ['HR/Training', 'SHE/OH&S Manager', 'Line Managers'],
    mandatoryDocumentedInfo: [{ description: 'Evidence of competence (training records, certificates)', kind: 'record' }],
    evidenceRequired: [
      { category: 'competence', description: 'Competence matrix including hazard-recognition ability per role' },
      { category: 'competence', description: 'Training records/certificates (incl. statutory certifications e.g. confined space, working at height)' },
      { category: 'competence', description: 'Effectiveness evaluation evidence (assessment, observed competence)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'What training have you had that specifically helps you recognise hazards in your own job, and how was that checked?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Select a high-hazard role and trace competence determination → training → hazard-recognition effectiveness evaluation.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A worker in a high-hazard role (e.g. confined space, working at height) lacks the required statutory competence evidence.' },
      { severityHint: 'Minor', description: 'Training records show attendance only, with no assessment of hazard-recognition ability.' }
    ],
    relatedClauses: [{ clauseNumber: '7.3', relationship: 'feeds_into' }, { clauseNumber: '6.1.2.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is there high contractor/agency turnover in a high-hazard role with a lag in competence verification?', riskWeight: 4 }]
  }),
  mkClause(S, '7.3', {
    parentClauseNumber: '7',
    title: 'Awareness',
    sortOrder: 730,
    requirementSummary: 'Workers shall be made aware of: the OH&S policy/objectives; their contribution to effectiveness incl. benefits of improved performance; implications of not conforming; incidents and investigation outcomes relevant to them; hazards/risks/actions relevant to them; their ability to remove themselves from imminent/serious danger and protection arrangements for doing so.',
    explanation: 'Explicitly requires awareness of the right to remove oneself from imminent danger and the protections for doing so — a specific, testable awareness item with no 14001 equivalent.',
    auditIntent: 'Directly test whether workers know they can stop work/remove themselves from danger and will be protected for doing so.',
    processOwnerRoles: ['HR/Training', 'Line Managers'],
    evidenceRequired: [
      { category: 'record', description: 'Induction/training records covering the right to remove from imminent danger' },
      { category: 'record', description: 'Toolbox talk records on relevant hazards/incidents' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'If you felt a task was immediately dangerous, could you stop and walk away, and would you be protected for doing so?', questionType: 'open' }],
    auditTests: [{ description: 'Interview at least 3 workers across shifts/functions on awareness of imminent-danger removal rights.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Workers are unaware of their right to remove themselves from imminent danger without penalty.' }],
    relatedClauses: [{ clauseNumber: '5.1', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.3', relationship: 'equivalent', note: '45001 adds the imminent-danger removal right, which has no 14001 counterpart.' }],
    riskPrompts: [{ prompt: 'Has a worker ever been disciplined or questioned for stopping work on safety grounds?', riskWeight: 5 }]
  }),
  mkClause(S, '7.4', {
    parentClauseNumber: '7',
    title: 'Communication',
    sortOrder: 740,
    isContainer: true,
    requirementSummary: 'Establish process(es) for internal/external communication incl. with contractors and visitors (7.4.1), internal (7.4.2), and external (7.4.3).',
    explanation: 'Explicitly names contractors and visitors as an internal communication audience, not just organizational levels/functions.',
    auditIntent: 'Confirm contractor/visitor communication channels exist distinctly from employee channels.'
  }),
  mkClause(S, '7.4.1', {
    parentClauseNumber: '7.4',
    title: 'General',
    sortOrder: 741,
    requirementSummary: 'Determine what/when/with whom (incl. internally among levels/functions and among contractors/visitors)/how to communicate for OH&S.',
    explanation: 'Sets the communication planning framework, explicitly including contractors and visitors as a "with whom" category.',
    auditIntent: 'Verify a distinct communication channel/method exists for contractors and site visitors.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Communication plan/matrix incl. contractor and visitor channels' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How is safety-critical information communicated specifically to visitors and contractors, separate from employees?', questionType: 'open' }],
    auditTests: [{ description: 'Observe or request evidence of the visitor/contractor site safety briefing process.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'No distinct communication process exists for visitors/contractors beyond a generic sign-in sheet.' }],
    relatedClauses: [{ clauseNumber: '8.1.4.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.4.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are contractors/visitors briefed on emergency procedures before entering hazardous areas?', riskWeight: 3 }]
  }),
  mkClause(S, '7.4.2', {
    parentClauseNumber: '7.4',
    title: 'Internal communication',
    sortOrder: 742,
    requirementSummary: 'Internally communicate OH&S-relevant information among levels/functions, incl. changes to the OH&S management system; ensure communication processes enable workers to contribute to continual improvement.',
    explanation: 'Two-way requirement, mirroring 14001 but for OH&S content.',
    auditIntent: 'Confirm a genuine upward feedback mechanism, not only downward briefings.',
    processOwnerRoles: ['Line Managers'],
    evidenceRequired: [{ category: 'record', description: 'Evidence of worker-originated safety suggestions/concerns and outcomes' }],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Have you raised a safety suggestion, and what happened to it?', questionType: 'open' }],
    auditTests: [{ description: 'Trace one worker-raised concern to a documented outcome.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Communication is one-way with no evidenced worker feedback loop.' }],
    relatedClauses: [{ clauseNumber: '5.4', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.4.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is there a functioning safety suggestion scheme, and when was it last used?', riskWeight: 1 }]
  }),
  mkClause(S, '7.4.3', {
    parentClauseNumber: '7.4',
    title: 'External communication',
    sortOrder: 743,
    requirementSummary: 'Externally communicate OH&S-relevant information as established by communication processes and legal/other requirements.',
    explanation: 'Covers statutory incident reporting (e.g. RIDDOR-equivalent) and other mandated external disclosures.',
    auditIntent: 'Verify statutory incident reporting has actually been submitted where required, on time.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Legal/Compliance'],
    evidenceRequired: [{ category: 'record', description: 'Statutory incident reports/submissions with dates' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What OH&S incidents are you legally required to report externally, and when was the last one submitted?', questionType: 'verification' }],
    auditTests: [{ description: 'Verify a reportable incident (if any occurred) against statutory reporting timescales.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A statutorily reportable incident was not reported to the relevant authority within the required timescale.' }],
    relatedClauses: [{ clauseNumber: '6.1.3', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.4.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Any incident in the audit period bordering on the statutory reporting threshold?', riskWeight: 5 }]
  }),
  mkClause(S, '7.5', {
    parentClauseNumber: '7',
    title: 'Documented information',
    sortOrder: 750,
    isContainer: true,
    requirementSummary: 'OH&S management system documented information required by the standard plus that determined necessary by the organization; covers creating/updating (7.5.2) and control (7.5.3).',
    explanation: 'Mirrors 14001 7.5 structure.',
    auditIntent: 'Assess proportionality of documentation to hazard profile.'
  }),
  mkClause(S, '7.5.1', {
    parentClauseNumber: '7.5',
    title: 'General',
    sortOrder: 751,
    requirementSummary: 'OH&S documented information = that required by the standard + that the organization determines necessary for OH&S management system effectiveness.',
    explanation: 'Scoping clause proportionate to size/complexity/competence/legal demonstration needs.',
    auditIntent: 'Check high-hazard activities are not under-documented relative to their risk.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Document/record register or master list' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How did you decide what needs a written procedure versus relying on training/competence?', questionType: 'open' }],
    auditTests: [{ description: 'Compare documentation depth against hazard significance from 6.1.2.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'A high-hazard task (e.g. permit-to-work activity) lacks a written procedure.' }],
    relatedClauses: [{ clauseNumber: '7.5.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.5.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is there a permit-to-work or safe system of work activity operating without a written procedure?', riskWeight: 4 }]
  }),
  mkClause(S, '7.5.2', {
    parentClauseNumber: '7.5',
    title: 'Creating and updating',
    sortOrder: 752,
    requirementSummary: 'Ensure appropriate identification/description, format/media, review/approval for suitability/adequacy when creating/updating documented information.',
    explanation: 'Document authoring discipline, identical intent to 14001 7.5.2.',
    auditIntent: 'Spot-check identification fields and approval evidence.',
    processOwnerRoles: ['Document controller'],
    evidenceRequired: [{ category: 'record', description: 'Document template with identification fields and approval sign-off' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Who approves a new or revised safe system of work before release?', questionType: 'verification' }],
    auditTests: [{ description: 'Sample 3 procedures for identification/approval evidence.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'A safety procedure in use lacks version/approval information.' }],
    relatedClauses: [{ clauseNumber: '7.5.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.5.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Do multiple versions of the same safety procedure circulate on site?', riskWeight: 2 }]
  }),
  mkClause(S, '7.5.3', {
    parentClauseNumber: '7.5',
    title: 'Control of documented information',
    sortOrder: 753,
    requirementSummary: 'Ensure availability/suitability where needed and adequate protection; address distribution/access/retrieval/use, storage/preservation, change control, retention/disposition; control external-origin documents determined necessary. Access includes workers and, where they exist, representatives.',
    explanation: 'Explicitly extends access rights to workers and their representatives, not only management/document control staff.',
    auditIntent: 'Confirm workers/representatives can actually access relevant safety documentation, not only management.',
    processOwnerRoles: ['Document controller'],
    evidenceRequired: [{ category: 'record', description: 'Document control procedure; evidence of worker/representative access to relevant OH&S documents' }],
    interviewQuestions: [{ audienceRole: 'Worker representative', question: 'Can you access the risk assessments and procedures relevant to your area on request?', questionType: 'verification' }],
    auditTests: [{ description: 'At point of use, confirm the current controlled version is available; test worker representative access to a requested document.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Worker representatives are denied or delayed access to relevant risk assessments on request.' }],
    relatedClauses: [{ clauseNumber: '5.4', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '7.5.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Has a worker representative ever requested and been refused a safety document?', riskWeight: 3 }]
  })
]
