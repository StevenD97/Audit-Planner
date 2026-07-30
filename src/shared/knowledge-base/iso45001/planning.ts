import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const planning45001: Clause[] = [
  mkClause(S, '6', {
    title: 'Planning',
    sortOrder: 600,
    isContainer: true,
    requirementSummary: 'Risk/opportunity actions (hazard identification, risk/opportunity assessment, legal requirements), OH&S objectives, and planning to achieve them.',
    explanation: 'The hazard/risk core of the OH&S management system — where most audit trails should originate.',
    auditIntent: 'Use this as the primary source of audit trails into Operation (8) and Performance Evaluation (9).'
  }),
  mkClause(S, '6.1', {
    parentClauseNumber: '6',
    title: 'Actions to address risks and opportunities',
    sortOrder: 610,
    isContainer: true,
    requirementSummary: 'Umbrella clause: general planning considerations (6.1.1), hazard identification/risk/opportunity assessment (6.1.2), legal/other requirements (6.1.3), and planning action (6.1.4).',
    explanation: 'Groups the hazard-to-action pipeline.',
    auditIntent: 'Confirm the four sub-processes are integrated and pre-change risk assessment (for planned changes) genuinely happens before implementation.',
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'depends_on' }, { clauseNumber: '6.1.3', relationship: 'depends_on' }, { clauseNumber: '6.1.4', relationship: 'depends_on' }]
  }),
  mkClause(S, '6.1.1', {
    parentClauseNumber: '6.1',
    title: 'General',
    sortOrder: 611,
    requirementSummary:
      'Considering 4.1-4.3, determine risks/opportunities needed to give assurance of intended outcomes, prevent/reduce undesired effects, and achieve continual improvement, taking into account hazards, OH&S/other risks, OH&S/other opportunities, and legal/other requirements. Assess risks/opportunities from changes before they are implemented (permanent or temporary).',
    explanation: 'Explicitly requires pre-implementation assessment of planned changes — a frequent audit trail into 8.1.3 Management of change.',
    auditIntent: 'Confirm change risk assessment happens before, not after, implementation, including temporary changes.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Operations Manager'],
    evidenceRequired: [{ category: 'record', description: 'Change register cross-referenced to pre-implementation risk assessments' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'For your last temporary change (e.g. a temporary works or shutdown), was risk assessed before or after it started?', questionType: 'trace' }],
    auditTests: [{ description: 'Select one recent temporary and one permanent change; confirm risk assessment pre-dates implementation for both.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A temporary change (e.g. temporary works, shutdown maintenance) was implemented without prior risk assessment.' }],
    relatedClauses: [{ clauseNumber: '8.1.3', relationship: 'verified_by' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.1.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are temporary/short-duration changes assessed with the same rigour as permanent ones?', riskWeight: 4 }]
  }),
  mkClause(S, '6.1.2', {
    parentClauseNumber: '6.1',
    title: 'Hazard identification and assessment of risks and opportunities',
    sortOrder: 612,
    isContainer: true,
    requirementSummary: 'Groups hazard identification (6.1.2.1), assessment of OH&S/other risks (6.1.2.2), and assessment of OH&S/other opportunities (6.1.2.3).',
    explanation: 'The three-step hazard-to-risk-to-opportunity pipeline central to 45001.',
    auditIntent: 'Confirm all three steps exist as distinct, evidenced activities rather than a single informal "risk assessment".'
  }),
  mkClause(S, '6.1.2.1', {
    parentClauseNumber: '6.1.2',
    title: 'Hazard identification',
    sortOrder: 6121,
    requirementSummary:
      'Establish/implement/maintain an ongoing, proactive hazard identification process considering: how work is organized and social factors (workload, hours, victimisation, harassment, bullying), leadership/culture; routine/non-routine activities incl. infrastructure/equipment/materials/physical conditions, design/R&D/production/service delivery/maintenance/disposal, human factors, how work is performed; past incidents (internal/external); potential emergencies; people (workplace access, vicinity, remote workers); other issues (work area/process design, vicinity situations, uncontrolled situations near the workplace); actual/proposed changes; changes in hazard knowledge.',
    explanation: 'An exceptionally broad list, deliberately including psychosocial factors (workload, bullying, harassment) and human factors, not just physical hazards — often under-addressed in practice.',
    auditIntent: 'Test whether psychosocial hazards and non-routine/emergency situations are genuinely identified, not just physical/mechanical hazards.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Line Managers', 'HR (for psychosocial hazards)'],
    mandatoryDocumentedInfo: [{ description: 'Hazard register/identification records', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Hazard register covering routine, non-routine, and emergency situations' },
      { category: 'record', description: 'Evidence psychosocial hazards (workload, bullying, harassment, work organization) have been considered' },
      { category: 'record', description: 'Evidence of hazard identification for contractors, visitors, and persons in the vicinity of the workplace' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'Beyond physical hazards, have workload, shift patterns or workplace behaviour been assessed as hazards here?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'How are hazards for non-routine tasks (e.g. breakdown maintenance) identified, given they don\'t occur on a fixed schedule?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Select one non-routine activity (e.g. confined space entry, breakdown repair) and verify a specific hazard identification/assessment exists for it.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'Hazard identification does not cover a clearly present non-routine or emergency scenario (e.g. confined space work).' },
      { severityHint: 'Minor', description: 'Psychosocial hazards (workload, bullying, harassment) are not addressed in the hazard register at all.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2.2', relationship: 'feeds_into' }, { clauseNumber: '8.1.2', relationship: 'feeds_into' }, { clauseNumber: '8.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.1.2', relationship: 'analogous_concept', note: 'ISO 14001 environmental aspects identification is the environmental equivalent; 45001 hazard identification is markedly broader in scope (incl. psychosocial/human factors).' }],
    riskPrompts: [
      { prompt: 'Have there been any recent stress-related absences, grievances or turnover spikes suggesting unassessed psychosocial hazards?', riskWeight: 4 },
      { prompt: 'Does the hazard register reflect the actual current activities on site, or does it look unchanged for several years?', riskWeight: 3 }
    ]
  }),
  mkClause(S, '6.1.2.2', {
    parentClauseNumber: '6.1.2',
    title: 'Assessment of OH&S risks and other risks to the OH&S management system',
    sortOrder: 6122,
    requirementSummary: 'Establish/implement/maintain process(es) to assess OH&S risks from identified hazards (taking into account existing control effectiveness) and to determine/assess other risks to the OH&S management system. Methodology/criteria shall be defined for scope/nature/timing to be proactive rather than reactive, used systematically. Documented information required on methodology/criteria.',
    explanation: 'Requires the risk assessment methodology itself (not just outputs) to be documented and demonstrably proactive.',
    auditIntent: 'Verify risk scores account for existing control effectiveness (not assessed as if no controls existed, nor ignoring residual risk), and that the same methodology is applied consistently.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    mandatoryDocumentedInfo: [{ description: 'Risk assessment methodology and criteria', kind: 'document' }],
    evidenceRequired: [
      { category: 'procedure', description: 'Risk assessment methodology (e.g. likelihood x severity matrix) with defined criteria' },
      { category: 'record', description: 'Completed risk assessments referencing existing control effectiveness' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How does your risk scoring account for the controls already in place?', questionType: 'trace' }],
    auditTests: [{ description: 'Select 2-3 risk assessments and confirm consistent application of the defined methodology.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Risk assessments do not reference or account for existing control effectiveness.' }],
    relatedClauses: [{ clauseNumber: '6.1.2.1', relationship: 'depends_on' }, { clauseNumber: '8.1.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.1.4', relationship: 'analogous_concept' }],
    riskPrompts: [{ prompt: 'Are high residual risks (after controls) still rated as acceptable without further justification?', riskWeight: 4 }]
  }),
  mkClause(S, '6.1.2.3', {
    parentClauseNumber: '6.1.2',
    title: 'Assessment of OH&S opportunities and other opportunities for the OH&S management system',
    sortOrder: 6123,
    requirementSummary: 'Establish/implement/maintain process(es) to assess OH&S opportunities to enhance performance (considering planned changes, incl. opportunities to adapt work/work organization/environment to workers, and to eliminate hazards/reduce risks) and other opportunities to improve the OH&S management system.',
    explanation: 'A distinct, positive counterpart to risk assessment — often skipped entirely in practice, with organizations only ever documenting risks.',
    auditIntent: 'Confirm at least some genuine opportunities (not just "reduce risk further") have been identified and progressed.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'OH&S opportunities register/log distinct from the risk register' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What OH&S opportunity have you identified and acted on recently, separate from closing out a risk?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm at least one documented opportunity (e.g. ergonomic redesign, automation removing a manual handling hazard) exists.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'No OH&S opportunities have ever been documented; only risks are tracked.' }],
    relatedClauses: [{ clauseNumber: '6.1.2.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.1.4', relationship: 'analogous_concept' }],
    riskPrompts: [{ prompt: 'Has automation or redesign ever been evaluated specifically as a hazard-elimination opportunity?', riskWeight: 2 }]
  }),
  mkClause(S, '6.1.3', {
    parentClauseNumber: '6.1',
    title: 'Determination of legal requirements and other requirements',
    sortOrder: 613,
    requirementSummary: 'Establish/implement/maintain process(es) to determine/access up-to-date legal/other requirements applicable to hazards/OH&S risks/the management system; determine how they apply and what needs to be communicated; take them into account. Maintain/retain documented information, kept updated.',
    explanation: 'The OH&S legal register — equivalent in function to 14001\'s compliance obligations but named "legal requirements and other requirements".',
    auditIntent: 'Verify currency of the register against recent legislative change and that requirements are mapped to specific controls.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Legal/Compliance'],
    mandatoryDocumentedInfo: [{ description: 'Legal requirements and other requirements register', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Legal/other requirements register with applicability determination' },
      { category: 'record', description: 'Evidence of a legal-update monitoring mechanism' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How do you learn about new OH&S legislation, and how is it incorporated?', questionType: 'open' }],
    auditTests: [{ description: 'Select 2-3 legal requirements and trace to a specific operational control and to 9.1.2 evaluation evidence.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A known applicable legal requirement (e.g. exposure limit, statutory inspection) is not being met.' }],
    relatedClauses: [{ clauseNumber: '9.1.2', relationship: 'verified_by' }, { clauseNumber: '6.1.4', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.1.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Any recent enforcement notice, prohibition notice or improvement notice not reflected in the register/CAPA?', riskWeight: 5 }]
  }),
  mkClause(S, '6.1.4', {
    parentClauseNumber: '6.1',
    title: 'Planning action',
    sortOrder: 614,
    requirementSummary:
      'Plan actions to address risks/opportunities (6.1.2.2/6.1.2.3) and legal/other requirements (6.1.3), and to prepare for/respond to emergencies (8.2); plan how to integrate/implement actions into the OH&S management system or other business processes and evaluate their effectiveness. Take into account the hierarchy of controls (8.1.2) and OH&S management system outputs. Consider best practices, technological options, financial/operational/business requirements.',
    explanation: 'Explicitly requires the hierarchy of controls to be applied when planning actions — a common audit test is whether administrative controls/PPE are reached for before elimination/substitution/engineering options are properly considered.',
    auditIntent: 'Verify the hierarchy of controls is genuinely applied in order, not defaulted to PPE/training as the first response.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Operations Manager'],
    evidenceRequired: [{ category: 'record', description: 'Action plan/tracker showing hierarchy-of-controls rationale for selected controls' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'For this risk, why was this particular control chosen over elimination or substitution?', questionType: 'trace' }],
    auditTests: [{ description: 'Select 2-3 planned actions and confirm elimination/substitution/engineering options were genuinely considered before administrative controls/PPE.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'PPE is the default control for a hazard where engineering controls were feasible but not evaluated.' }],
    relatedClauses: [{ clauseNumber: '8.1.2', relationship: 'feeds_into' }, { clauseNumber: '8.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.1.5', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is PPE routinely used as the sole control for a hazard where higher-order controls exist elsewhere in the sector?', riskWeight: 4 }]
  }),
  mkClause(S, '6.2', {
    parentClauseNumber: '6',
    title: 'OH&S objectives and planning to achieve them',
    sortOrder: 620,
    isContainer: true,
    requirementSummary: 'Establish OH&S objectives (6.2.1) and plan how to achieve them (6.2.2).',
    explanation: 'Converts risk/legal findings into measurable OH&S performance targets.',
    auditIntent: 'Confirm objectives reflect the actual risk profile and worker consultation input, not generic lagging indicators only (e.g. LTIFR alone).'
  }),
  mkClause(S, '6.2.1', {
    parentClauseNumber: '6.2',
    title: 'OH&S objectives',
    sortOrder: 621,
    requirementSummary: 'Establish OH&S objectives at relevant functions/levels to maintain/improve the OH&S management system and performance. Objectives shall be consistent with policy; measurable (if practicable) or capable of performance evaluation; take into account applicable requirements, risk/opportunity assessment results, and worker consultation results; monitored; communicated; updated.',
    explanation: 'Must explicitly incorporate consultation results — an objective set without worker input is a documented nonconformity trigger, not just an OFI.',
    auditIntent: 'Verify objectives include leading indicators (not just lagging, e.g. LTIFR) and trace to consultation records.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    mandatoryDocumentedInfo: [{ description: 'OH&S objectives and plans to achieve them', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'OH&S objectives with baseline/target/current performance, incl. leading indicators' },
      { category: 'record', description: 'Evidence of worker/representative consultation on objective-setting' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker representative', question: 'Were you consulted on this year\'s OH&S objectives?', questionType: 'verification' }],
    auditTests: [{ description: 'Select 2 objectives and confirm consultation evidence and current monitoring data.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'OH&S objectives were set without any evidence of worker consultation.' }],
    relatedClauses: [{ clauseNumber: '5.4', relationship: 'depends_on' }, { clauseNumber: '6.2.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.2.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Are objectives entirely lagging-indicator based (incident counts only) with no leading indicators (near-miss reporting rate, training completion)?', riskWeight: 2 }]
  }),
  mkClause(S, '6.2.2', {
    parentClauseNumber: '6.2',
    title: 'Planning to achieve OH&S objectives',
    sortOrder: 622,
    requirementSummary: 'Determine: what will be done; resources required; responsibility; completion timing; how results evaluated (incl. monitoring indicators); how integrated into business processes. Maintain/retain documented information.',
    explanation: 'Standard SMART planning requirement for OH&S objectives.',
    auditIntent: 'Verify resourcing and interim tracking, not only year-end reporting.',
    processOwnerRoles: ['SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Action plan per objective with resource, owner, timescale, indicator' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What resources did this action plan require, and were they provided?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm interim progress tracking exists for at least one objective action plan.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Action plans lack defined monitoring indicators.' }],
    relatedClauses: [{ clauseNumber: '6.2.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '6.2.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Were resources requested for an objective ever declined without adjusting the objective?', riskWeight: 2 }]
  })
]
