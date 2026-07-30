import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const operation45001: Clause[] = [
  mkClause(S, '8', {
    title: 'Operation',
    sortOrder: 800,
    isContainer: true,
    requirementSummary: 'Operational planning/control (incl. hierarchy of controls, management of change, procurement/contractors/outsourcing) and emergency preparedness/response.',
    explanation: 'The "Do" phase, with substantially more granular sub-clauses than ISO 14001\'s equivalent — reflecting the immediacy of physical OH&S risk.',
    auditIntent: 'This clause group is where site inspection and worker interview evidence carries the most weight.'
  }),
  mkClause(S, '8.1', {
    parentClauseNumber: '8',
    title: 'Operational planning and control',
    sortOrder: 810,
    isContainer: true,
    requirementSummary: 'General operational control (8.1.1); eliminating hazards/reducing risks via the hierarchy of controls (8.1.2); management of change (8.1.3); procurement incl. contractors/outsourcing (8.1.4).',
    explanation: 'Groups all direct and third-party operational controls.',
    auditIntent: 'Confirm hierarchy-of-controls thinking is applied consistently across direct operations, change, and third parties.'
  }),
  mkClause(S, '8.1.1', {
    parentClauseNumber: '8.1',
    title: 'General',
    sortOrder: 811,
    requirementSummary: 'Plan/implement/control/maintain processes needed to meet OH&S management system requirements and implement Clause 6 actions by establishing criteria and implementing control per criteria; maintain/retain documented information for confidence processes carried out as planned; adapt work to workers. At multi-employer workplaces, coordinate relevant parts of the OH&S management system with other organizations.',
    explanation: 'Explicitly requires "adapting work to workers" (ergonomics) and coordination at shared/multi-employer worksites — both frequent gaps.',
    auditIntent: 'Test multi-employer coordination specifically — a common finding is each employer managing their own workers with no coordinated site-wide safety management.',
    processOwnerRoles: ['Operations Manager', 'SHE/OH&S Manager'],
    mandatoryDocumentedInfo: [{ description: 'Process(es) for 8.1, to the extent necessary for confidence', kind: 'document' }],
    evidenceRequired: [
      { category: 'procedure', description: 'Operating criteria/safe systems of work for hazardous activities' },
      { category: 'record', description: 'Multi-employer worksite coordination agreement/minutes (where applicable)' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'At shared worksites, how is safety management coordinated with the other employer(s) present?', questionType: 'open' }],
    auditTests: [{ description: 'Where multi-employer arrangements exist, verify a coordination mechanism (meetings, shared permit system) is active.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'No coordination mechanism exists at a multi-employer worksite with interacting hazards.' }],
    relatedClauses: [{ clauseNumber: '6.1.2.1', relationship: 'depends_on' }, { clauseNumber: '8.1.4.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '8.1', relationship: 'partial_overlap' }],
    riskPrompts: [{ prompt: 'Are there multiple employers/contractors working concurrently in the same physical area with no coordination record?', riskWeight: 5 }]
  }),
  mkClause(S, '8.1.2', {
    parentClauseNumber: '8.1',
    title: 'Eliminating hazards and reducing OH&S risks',
    sortOrder: 812,
    requirementSummary: 'Use the hierarchy of controls in order: eliminate; substitute with less hazardous processes/operations/materials/equipment; use engineering controls/reorganize work; use administrative controls incl. training; use adequate PPE (provided at no cost, where legally required).',
    explanation: 'The single most tested clause in most 45001 audits — the audit question is always "why this control and not a higher one?"',
    auditIntent: 'For a sample of significant risks, verify the rationale for the chosen control level and that PPE/administrative controls are not used where elimination/substitution/engineering was feasible.',
    processOwnerRoles: ['Operations Manager', 'SHE/OH&S Manager', 'Engineering'],
    evidenceRequired: [
      { category: 'record', description: 'Risk assessments showing hierarchy-of-controls rationale' },
      { category: 'record', description: 'PPE issue records and cost-to-worker confirmation (provided free)' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'For this task, was anything considered before you were given PPE — a different material, a guard, a different method?', questionType: 'open' }],
    auditTests: [{ description: 'Site walk: for 2-3 hazards, observe the actual control in place and question why it sits where it does in the hierarchy.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A significant hazard is controlled by PPE alone where a feasible engineering control was not evaluated.' },
      { severityHint: 'Minor', description: 'PPE is charged to or deducted from workers\' pay.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2.2', relationship: 'depends_on' }, { clauseNumber: '7.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '8.1', relationship: 'partial_overlap', note: '14001 references a control hierarchy only in a note under 8.1; 45001 makes it a distinct, mandatory sub-clause.' }],
    riskPrompts: [{ prompt: 'Is there a hazard for which the sector norm is an engineering control but this site uses PPE/administrative controls only?', riskWeight: 5 }]
  }),
  mkClause(S, '8.1.3', {
    parentClauseNumber: '8.1',
    title: 'Management of change',
    sortOrder: 813,
    requirementSummary: 'Establish process(es) for implementation/control of planned temporary/permanent changes impacting OH&S performance, incl. new/changed products/services/processes (workplace locations, work organization, working conditions, equipment, workforce), changes to legal/other requirements, changes in hazard/risk knowledge, and developments in knowledge/technology. Review consequences of unintended changes, mitigating adverse effects as necessary.',
    explanation: 'A dedicated MOC clause (unlike 14001, which covers this under Planning 6.3) — covers workforce changes (e.g. new starters, changed shift patterns) as an explicit MOC trigger.',
    auditIntent: 'Confirm MOC triggers include workforce/organizational changes, not only physical/engineering changes, and that unintended-change reviews actually occur.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Operations Manager', 'Engineering/Projects'],
    evidenceRequired: [
      { category: 'procedure', description: 'Management of change procedure covering physical, organizational and workforce changes' },
      { category: 'record', description: 'Completed MOC risk assessments for recent changes' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Was a recent shift-pattern or workforce change assessed through MOC?', questionType: 'trace' }],
    auditTests: [{ description: 'Select one recent workforce/organizational change and one physical/process change; confirm both went through MOC.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A significant physical or organizational change was implemented without MOC risk assessment.' }],
    relatedClauses: [{ clauseNumber: '6.1.1', relationship: 'depends_on' }, { clauseNumber: '6.1.2.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.3', relationship: 'equivalent', note: '14001 places management of change under Planning (6.3); 45001 places it under Operation (8.1.3) — same intent, different clause location.' }],
    riskPrompts: [{ prompt: 'Any recent restructure, new shift pattern, or new equipment introduction not processed through MOC?', riskWeight: 4 }]
  }),
  mkClause(S, '8.1.4', {
    parentClauseNumber: '8.1',
    title: 'Procurement',
    sortOrder: 814,
    isContainer: true,
    requirementSummary: 'General procurement control (8.1.4.1); contractor coordination (8.1.4.2); outsourcing control (8.1.4.3).',
    explanation: 'Far more granular than 14001\'s procurement coverage — reflecting the direct injury risk of poorly controlled contractors.',
    auditIntent: 'Treat contractor management as a priority audit trail; it is a leading indicator of overall OH&S system maturity.'
  }),
  mkClause(S, '8.1.4.1', {
    parentClauseNumber: '8.1.4',
    title: 'General',
    sortOrder: 8141,
    requirementSummary: 'Establish/implement/maintain process(es) to control procurement of products/services to ensure conformity to the OH&S management system.',
    explanation: 'A gatekeeping requirement — OH&S criteria must be part of the procurement decision, not bolted on afterward.',
    auditIntent: 'Verify OH&S criteria are embedded in the procurement process itself (e.g. purchase order templates, supplier qualification), not a parallel/ignored checklist.',
    processOwnerRoles: ['Procurement', 'SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Procurement procedure/policy including OH&S criteria for products and services' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Where in the purchasing process are OH&S requirements checked?', questionType: 'trace' }],
    auditTests: [{ description: 'Sample 2-3 recent purchase orders for equipment/services and confirm OH&S criteria were applied.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Equipment was procured without OH&S/compliance criteria being checked (e.g. missing CE marking, no manual/risk assessment supplied).' }],
    relatedClauses: [{ clauseNumber: '8.1.4.2', relationship: 'feeds_into' }, { clauseNumber: '8.1.4.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '8.1', relationship: 'partial_overlap' }],
    riskPrompts: [{ prompt: 'Is OH&S sign-off a mandatory gate in the purchase-order approval workflow, or advisory only?', riskWeight: 3 }]
  }),
  mkClause(S, '8.1.4.2', {
    parentClauseNumber: '8.1.4',
    title: 'Contractors',
    sortOrder: 8142,
    requirementSummary: 'Coordinate procurement process(es) with contractors to identify hazards and assess/control OH&S risks arising from: contractors\' activities impacting the organization; the organization\'s activities impacting contractors\' workers; contractors\' activities impacting other interested parties. Ensure OH&S management system requirements are met by contractors/workers; define/apply OH&S selection criteria for contractors.',
    explanation: 'A bidirectional risk requirement — the organization must manage risk it creates for contractors, not only risk contractors create for it.',
    auditIntent: 'Test both directions: has the organization assessed risk it poses to contractor workers, as well as risk contractors pose to the site?',
    processOwnerRoles: ['Procurement', 'SHE/OH&S Manager', 'Site supervision'],
    evidenceRequired: [
      { category: 'record', description: 'Contractor OH&S selection/qualification criteria and pre-qualification records' },
      { category: 'record', description: 'Contractor risk assessments/method statements reviewed and approved before work starts' },
      { category: 'record', description: 'Contractor site induction and permit-to-work records' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'How do you assess risk that your own site activities pose to a contractor\'s workers, not just the reverse?', questionType: 'open' },
      { audienceRole: 'Contractor', question: 'Were you inducted and given site-specific hazard information before starting work?', questionType: 'verification' }
    ],
    auditTests: [{ description: 'Select a current/recent contractor and trace: selection criteria applied → method statement reviewed → induction → on-site supervision/monitoring.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A contractor worked on site without an approved method statement/risk assessment for a hazardous task.' },
      { severityHint: 'Minor', description: 'Contractor OH&S selection criteria exist but were not applied for a specific engagement.' }
    ],
    relatedClauses: [{ clauseNumber: '7.4.1', relationship: 'depends_on' }, { clauseNumber: '8.1.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '8.1', relationship: 'partial_overlap', note: '14001 covers external providers/contractors in general terms within 8.1(c); 45001 devotes a full sub-clause with bidirectional risk assessment.' }],
    riskPrompts: [{ prompt: 'Has a contractor incident occurred, and was it investigated with the same rigour as an employee incident?', riskWeight: 4 }]
  }),
  mkClause(S, '8.1.4.3', {
    parentClauseNumber: '8.1.4',
    title: 'Outsourcing',
    sortOrder: 8143,
    requirementSummary: 'Ensure outsourced functions/processes are controlled; ensure outsourcing arrangements are consistent with legal/other requirements and achieving intended OH&S outcomes; define the type/degree of control within the OH&S management system.',
    explanation: 'Distinct from contractors on-site — this covers functions/processes performed off-site or by a third party on the organization\'s behalf (e.g. outsourced maintenance, transport).',
    auditIntent: 'Confirm outsourced functions with OH&S relevance are named and the control mechanism (contract clauses, audits, KPIs) is defined and used.',
    processOwnerRoles: ['Procurement', 'SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Outsourcing contracts/agreements specifying OH&S control expectations and monitoring mechanism' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What OH&S-relevant functions are outsourced, and how do you know the provider is performing them safely?', questionType: 'open' }],
    auditTests: [{ description: 'Select one outsourced function and verify a defined control/monitoring mechanism is active (not just a contract clause never followed up).' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Outsourcing contracts reference OH&S compliance generically with no active monitoring mechanism.' }],
    relatedClauses: [{ clauseNumber: '8.1.4.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '8.1', relationship: 'partial_overlap' }],
    riskPrompts: [{ prompt: 'Is there an outsourced high-hazard function (e.g. transport, maintenance) with no recent performance review?', riskWeight: 3 }]
  }),
  mkClause(S, '8.2', {
    parentClauseNumber: '8',
    title: 'Emergency preparedness and response',
    sortOrder: 820,
    requirementSummary:
      'Establish/implement/maintain process(es) to prepare for/respond to potential emergencies (from 6.1.2.1) incl.: planned response incl. first aid; training for planned response; periodic testing/exercising; evaluating/revising performance after tests/occurrences; communicating duties/responsibilities to all workers; communicating relevant information to contractors/visitors/emergency services/authorities/community as appropriate; considering needs/capabilities of relevant interested parties and ensuring involvement in developing the response. Maintain/retain documented information.',
    explanation: 'Broader stakeholder involvement than 14001\'s equivalent — explicitly names emergency services, authorities and community as parties to inform/involve.',
    auditIntent: 'Confirm external emergency services/authorities have actually been engaged (e.g. joint drills, liaison visits), not just an internal plan.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Site Security/Facilities', 'Emergency response team'],
    mandatoryDocumentedInfo: [{ description: 'Emergency preparedness and response process(es) and plans', kind: 'document' }],
    evidenceRequired: [
      { category: 'procedure', description: 'Emergency response plans incl. first aid provision' },
      { category: 'record', description: 'Drill/exercise records with dates, outcomes and revisions made' },
      { category: 'competence', description: 'First aid/fire warden/emergency team training and certification records' },
      { category: 'record', description: 'Evidence of liaison with external emergency services/authorities' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'What is your role in an emergency, and how do you know it?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'When did you last involve the local emergency services or authority in planning or testing your response?', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Select one identified potential emergency and trace: plan exists → training delivered → drill conducted → review → revision if needed → external liaison evidence.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'No planned response exists for a credible, identified emergency scenario with potential for serious injury.' },
      { severityHint: 'Minor', description: 'Drills have not occurred at the organization\'s own stated frequency.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2.1', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '8.2', relationship: 'equivalent', note: '45001 8.2 explicitly names external emergency services/authorities/community as parties to involve; 14001 8.2 is less prescriptive on external liaison.' }],
    riskPrompts: [{ prompt: 'Has an actual emergency occurred since the last drill, and did the real response match the plan and timings?', riskWeight: 5 }]
  })
]
