import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const operation14001: Clause[] = [
  mkClause(S, '8', {
    title: 'Operation',
    sortOrder: 800,
    isContainer: true,
    requirementSummary: 'Operational planning/control and emergency preparedness and response.',
    explanation: 'The "Do" phase — where planning becomes physical controls on site.',
    auditIntent: 'This is where site inspection evidence (not just documents) matters most.'
  }),
  mkClause(S, '8.1', {
    parentClauseNumber: '8',
    title: 'Operational planning and control',
    sortOrder: 810,
    requirementSummary:
      'Establish/implement/control/maintain process(es) to meet EMS requirements and implement Clause 6 actions by establishing operating criteria and implementing control accordingly; control planned changes and review unintended-change consequences; control/influence externally provided processes/products/services; apply life-cycle controls to design/procurement/external providers/end-of-life information.',
    explanation: 'The broadest operational clause — covers direct controls, contractor/outsourced control, and design/procurement life-cycle thinking.',
    auditIntent: 'Verify operating criteria exist for significant-aspect activities and are actually being followed on the ground; test contractor/supplier control.',
    processOwnerRoles: ['Operations Manager', 'Procurement', 'Engineering/Projects', 'SHE/Environmental Manager'],
    mandatoryDocumentedInfo: [{ description: 'Process(es) for 8.1, to the extent necessary for confidence they are carried out as planned', kind: 'document' }],
    evidenceRequired: [
      { category: 'procedure', description: 'Operating procedures/criteria for significant-aspect activities (e.g. chemical storage, waste handling, discharge control)' },
      { category: 'record', description: 'Contractor/supplier environmental requirements in procurement documents' },
      { category: 'record', description: 'Evidence of communication of environmental requirements to external providers' },
      { category: 'monitoring_data', description: 'Records confirming operating criteria were met (e.g. inspection checklists)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'What operating criteria/limits do you work to for this activity, and what happens if they are exceeded?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'How do you communicate environmental requirements to contractors and suppliers before they start work?', questionType: 'trace' }
    ],
    auditTests: [
      { description: 'Site inspection: observe a significant-aspect activity in progress and compare against the documented operating criteria.' },
      { description: 'Select a contractor/supplier and verify environmental requirements were included in the contract/PO and monitored.' }
    ],
    potentialFindings: [
      { severityHint: 'Major', description: 'Operating criteria for a significant aspect (e.g. bunding/secondary containment) are not implemented on site as documented.' },
      { severityHint: 'Minor', description: 'Contractor environmental requirements are not consistently included in procurement/contract documents.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'depends_on' }, { clauseNumber: '6.1.5', relationship: 'depends_on' }, { clauseNumber: '9.1.1', relationship: 'verified_by' }],
    crossStandardEquivalents: [
      { standardId: 'iso45001', clauseNumber: '8.1.1', relationship: 'partial_overlap' },
      { standardId: 'iso45001', clauseNumber: '8.1.4', relationship: 'partial_overlap', note: '45001 gives procurement/contractors/outsourcing its own detailed sub-clauses (8.1.4.1-8.1.4.3); 14001 covers the same ground within the single 8.1 clause.' }
    ],
    riskPrompts: [{ prompt: 'Are there any bypassed or overridden engineering controls observed during the site walk?', riskWeight: 5 }]
  }),
  mkClause(S, '8.2', {
    parentClauseNumber: '8',
    title: 'Emergency preparedness and response',
    sortOrder: 820,
    requirementSummary:
      'Establish/implement/maintain process(es) to prepare for and respond to potential emergencies (from 6.1.2): plan response actions to prevent/mitigate impacts; respond to actual emergencies; take mitigating action; periodically test response actions; periodically review/revise after incidents/tests; provide relevant information/training to interested parties incl. persons under the organization\'s control.',
    explanation: 'Requires the emergency plan to be tested, not just written, and revised after real events/drills, not left static.',
    auditIntent: 'Confirm drills have actually occurred, were reviewed, and led to plan updates where gaps were found.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Site Security/Facilities', 'Emergency response team'],
    mandatoryDocumentedInfo: [{ description: 'Emergency preparedness and response process(es)', kind: 'document' }],
    evidenceRequired: [
      { category: 'procedure', description: 'Emergency response plans for identified potential emergencies (spill, fire, flood, containment failure)' },
      { category: 'record', description: 'Drill/test records with dates and outcomes' },
      { category: 'record', description: 'Post-incident or post-drill review and any resulting plan revisions' },
      { category: 'competence', description: 'Training records for emergency response roles (spill response, first aid, fire wardens)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'What would you do right now if there were a significant chemical spill in this area?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'When was the last emergency drill, what did it reveal, and what changed afterwards?', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Select one potential emergency scenario and trace: risk identified (6.1.2) → plan exists → drill conducted → review → plan revision if needed.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'No emergency response plan exists for a credible, identified potential emergency (e.g. bulk fuel storage fire/spill).' },
      { severityHint: 'Minor', description: 'Drills have not been conducted within the organization\'s own stated frequency.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '8.2', relationship: 'equivalent', note: '45001 8.2 additionally requires communicating duties/responsibilities to workers and involving relevant interested parties in developing the response.' }],
    riskPrompts: [{ prompt: 'Has an actual emergency occurred since the last drill, and did the real response match the plan?', riskWeight: 5 }]
  })
]
