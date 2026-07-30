import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const planning14001: Clause[] = [
  mkClause(S, '6', {
    title: 'Planning',
    sortOrder: 600,
    isContainer: true,
    requirementSummary: 'Risk/opportunity actions (aspects, compliance obligations), environmental objectives, and planning of changes.',
    explanation: 'The engine room of the EMS: this is where context and policy get converted into concrete, prioritised actions.',
    auditIntent: 'This is normally the richest audit trail source — most nonconformities elsewhere trace back to a gap here.'
  }),
  mkClause(S, '6.1', {
    parentClauseNumber: '6',
    title: 'Actions to address risks and opportunities',
    sortOrder: 610,
    isContainer: true,
    requirementSummary: 'Umbrella clause requiring processes for aspects (6.1.2), compliance obligations (6.1.3), risks/opportunities (6.1.4) and planning action (6.1.5), documented to the extent needed for confidence they are carried out as planned.',
    explanation: 'Groups the four planning sub-processes that together form the risk-based core of the EMS.',
    auditIntent: 'Confirm the four sub-processes are integrated, not run as disconnected spreadsheets.',
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'depends_on' }, { clauseNumber: '6.1.3', relationship: 'depends_on' }, { clauseNumber: '6.1.4', relationship: 'depends_on' }, { clauseNumber: '6.1.5', relationship: 'depends_on' }]
  }),
  mkClause(S, '6.1.1', {
    parentClauseNumber: '6.1',
    title: 'General',
    sortOrder: 611,
    requirementSummary: 'Establish, implement and maintain process(es) to meet 6.1.2-6.1.5, available as documented information to the extent necessary for confidence they are carried out as planned.',
    explanation: 'Requires a defined methodology (not necessarily heavy documentation) for how aspects/obligations/risk are identified and planned.',
    auditIntent: 'Confirm a coherent, repeatable methodology exists and is actually followed, rather than ad hoc.',
    processOwnerRoles: ['SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'procedure', description: 'Risk/opportunity and aspects identification procedure/methodology' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Walk me through your methodology for identifying aspects, obligations, and risks/opportunities end to end.', questionType: 'open' }],
    auditTests: [{ description: 'Confirm the documented methodology matches what staff actually describe doing.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Methodology exists on paper but is not consistently applied across sites/departments.' }],
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.1.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is the same methodology applied consistently across all in-scope sites?', riskWeight: 2 }]
  }),
  mkClause(S, '6.1.2', {
    parentClauseNumber: '6.1',
    title: 'Environmental aspects',
    sortOrder: 612,
    requirementSummary:
      'Determine environmental aspects (controllable and influenceable) and impacts across the life cycle, including normal/abnormal conditions, change, and potential emergencies; determine significant aspects using established criteria; communicate significant aspects; document aspects/impacts, significance criteria, and significant aspects.',
    explanation: 'The core environmental risk-identification clause — a life-cycle perspective (raw materials to end-of-life) is now an explicit requirement, not just guidance.',
    auditIntent: 'Test completeness (normal/abnormal/emergency, upstream/downstream) and rigour of the significance methodology, and confirm significant aspects genuinely drive objectives/controls.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Process/Operations Manager', 'Procurement'],
    mandatoryDocumentedInfo: [
      { description: 'Environmental aspects and associated impacts register', kind: 'record' },
      { description: 'Significance criteria', kind: 'document' },
      { description: 'Significant environmental aspects list', kind: 'record' }
    ],
    evidenceRequired: [
      { category: 'record', description: 'Aspects/impacts register covering normal, abnormal and emergency conditions across the life cycle' },
      { category: 'procedure', description: 'Significance-scoring methodology (e.g. likelihood x severity x legal/stakeholder weighting)' },
      { category: 'record', description: 'Evidence significant aspects were communicated to relevant levels/functions' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'How did you determine which aspects are significant, and can you show me the scoring for one of them?', questionType: 'trace' },
      { audienceRole: 'Worker', question: 'Are you aware of which of your activities have a significant environmental impact?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'How are new products, processes or projects assessed for aspects before they start (design stage)?', questionType: 'open' }
    ],
    auditTests: [
      { description: 'Select 3 significant aspects and trace forward to operational controls (8.1), monitoring (9.1) and objectives (6.2) where applicable.' },
      { description: 'Select one recent change/new activity (6.3) and confirm aspects were reassessed before implementation.' }
    ],
    potentialFindings: [
      { severityHint: 'Major', description: 'A clearly significant aspect (e.g. a bulk chemical store, a discharge point) has not been identified or assessed at all.' },
      { severityHint: 'Minor', description: 'Significance criteria are not consistently applied — similar aspects scored differently with no rationale.' },
      { severityHint: 'OFI', description: 'Life cycle perspective is not evidenced beyond the organization\'s own site boundary (e.g. supplier/end-of-life stages not considered).' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.4', relationship: 'feeds_into' }, { clauseNumber: '8.1', relationship: 'feeds_into' }, { clauseNumber: '9.1.1', relationship: 'verified_by' }, { clauseNumber: '8.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.1.2.1', relationship: 'analogous_concept', note: 'Hazard identification is the OH&S equivalent risk-identification step, though 45001 separates identification (6.1.2.1) from risk assessment (6.1.2.2).' }],
    riskPrompts: [
      { prompt: 'Does the significant aspects list correlate with the organization\'s actual environmental permits/consents (e.g. missing an aspect the permit clearly regulates)?', riskWeight: 5 },
      { prompt: 'How long since the aspects register was refreshed relative to the pace of operational change on site?', riskWeight: 3 }
    ]
  }),
  mkClause(S, '6.1.3', {
    parentClauseNumber: '6.1',
    title: 'Compliance obligations',
    sortOrder: 613,
    requirementSummary: 'Determine and have access to compliance obligations related to aspects; determine how they apply; take them into account in the EMS. Compliance obligations shall be documented information.',
    explanation: 'A live legal/other-requirements register (permits, licences, consents, industry codes, contractual commitments) — access is not enough, applicability must be worked out.',
    auditIntent: 'Verify the register is current, covers all applicable regimes (not just headline environmental permits), and each obligation is mapped to how the organization meets it.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Legal/Compliance'],
    mandatoryDocumentedInfo: [{ description: 'Compliance obligations register', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Compliance obligations (legal/other requirements) register with applicability determination' },
      { category: 'record', description: 'Subscription to a legal update service or equivalent horizon-scanning evidence' },
      { category: 'record', description: 'Permits, licences, consents currently in force' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'How do you find out about new or changed legal requirements, and how quickly are they incorporated?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'Show me how a specific permit condition is linked to an operational control or monitoring requirement.', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Select 3 permit/licence conditions and trace to the register, to an operational control, and to 9.1.2 compliance evaluation evidence.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A permit condition is breached or not being monitored at all.' },
      { severityHint: 'Minor', description: 'Register omits a known applicable requirement (e.g. a recent amendment to waste regulations).' }
    ],
    relatedClauses: [{ clauseNumber: '4.2', relationship: 'depends_on' }, { clauseNumber: '9.1.2', relationship: 'verified_by' }, { clauseNumber: '6.1.5', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.1.3', relationship: 'equivalent', note: '45001 terms this "legal requirements and other requirements" rather than "compliance obligations", but the concept and register requirement are the same.' }],
    riskPrompts: [{ prompt: 'Any enforcement notices, fines or regulator correspondence in the audit period not reflected in the register/CAPA?', riskWeight: 5 }]
  }),
  mkClause(S, '6.1.4', {
    parentClauseNumber: '6.1',
    title: 'Risks and opportunities',
    sortOrder: 614,
    requirementSummary: 'Considering 4.1-4.3, determine risks/opportunities related to aspects, compliance obligations and other issues, needed to give assurance of intended outcomes, prevent/reduce undesired effects, and achieve continual improvement. Document the risks/opportunities that need addressing.',
    explanation: 'A broader risk register than just aspects/obligations — includes strategic/organizational risk (e.g. resourcing, reputational, climate-related physical/transition risk) to the EMS itself.',
    auditIntent: 'Confirm risk/opportunity determination is genuinely broader than the aspects register and is used, not just filed.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Top management'],
    mandatoryDocumentedInfo: [{ description: 'Risks and opportunities register', kind: 'record' }],
    evidenceRequired: [{ category: 'record', description: 'Risk and opportunity register linked to context, aspects and compliance obligations' }],
    interviewQuestions: [{ audienceRole: 'Top management', question: 'What environmental risks or opportunities keep you up at night that aren\'t simply "the aspects register"?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm at least one opportunity (not just a risk) has been identified and acted upon.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Risk register is effectively a duplicate of the aspects register with no additional organizational-level risks/opportunities considered.' }],
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'depends_on' }, { clauseNumber: '6.1.3', relationship: 'depends_on' }, { clauseNumber: '6.1.5', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.1.2.3', relationship: 'analogous_concept' }],
    riskPrompts: [{ prompt: 'Does the risk register consider physical/transition climate risk to operations (e.g. flooding, water scarcity, decarbonisation pressure)?', riskWeight: 3 }]
  }),
  mkClause(S, '6.1.5', {
    parentClauseNumber: '6.1',
    title: 'Planning action',
    sortOrder: 615,
    requirementSummary: 'Plan actions to address significant aspects, compliance obligations, and risks/opportunities; plan how to implement/integrate the actions into EMS or business processes and evaluate their effectiveness, considering technological/financial/operational/business requirements.',
    explanation: 'The "so what" clause — converts 6.1.2-6.1.4 outputs into concrete, resourced, evaluable actions.',
    auditIntent: 'Trace specific significant aspects/obligations/risks to a named action with an owner, timescale and effectiveness check.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Process/Operations Manager'],
    evidenceRequired: [{ category: 'record', description: 'Action plan/tracker linking 6.1.2-6.1.4 items to specific actions, owners and target dates' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'For this significant aspect, what specific action was planned, who owns it, and how do you know it worked?', questionType: 'trace' }],
    auditTests: [{ description: 'Select 2-3 actions and verify effectiveness evaluation evidence exists (see 9.1).' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Actions are planned but effectiveness is never evaluated or closed out.' }],
    relatedClauses: [{ clauseNumber: '6.2', relationship: 'feeds_into' }, { clauseNumber: '8', relationship: 'feeds_into' }, { clauseNumber: '9.1.1', relationship: 'verified_by' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.1.4', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'What proportion of planned actions from the last 12 months are overdue?', riskWeight: 3 }]
  }),
  mkClause(S, '6.2', {
    parentClauseNumber: '6',
    title: 'Environmental objectives and planning to achieve them',
    sortOrder: 620,
    isContainer: true,
    requirementSummary: 'Establish environmental objectives (6.2.1) and plan how to achieve them (6.2.2).',
    explanation: 'Converts significant aspects/obligations/risks into measurable performance targets.',
    auditIntent: 'Confirm objectives are meaningfully linked to significance, not arbitrary corporate KPIs.'
  }),
  mkClause(S, '6.2.1', {
    parentClauseNumber: '6.2',
    title: 'Environmental objectives',
    sortOrder: 621,
    requirementSummary: 'Establish objectives at relevant functions/levels considering significant aspects, compliance obligations, and risks/opportunities. Objectives shall be consistent with policy, measurable (if practicable), monitored, communicated, updated, and documented.',
    explanation: 'Objectives must be traceable to significance, not just "reduce paper use" style generic targets disconnected from the aspects register.',
    auditIntent: 'Verify at least the majority of objectives map directly to identified significant aspects/obligations/risks, and that they are actually monitored, not set-and-forgotten.',
    processOwnerRoles: ['Top management', 'SHE/Environmental Manager'],
    mandatoryDocumentedInfo: [{ description: 'Environmental objectives', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Environmental objectives with baseline, target and current performance' },
      { category: 'record', description: 'Evidence objectives were communicated to relevant functions/levels' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How does this objective relate to a significant aspect or compliance obligation?', questionType: 'trace' }],
    auditTests: [{ description: 'Select 2 objectives and confirm current-period monitoring data exists and is reviewed.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'An objective has no monitoring data or has been static/unchanged for multiple review cycles despite non-achievement.' },
      { severityHint: 'OFI', description: 'Objectives are not clearly traceable to significant aspects/compliance obligations/risk.' }
    ],
    relatedClauses: [{ clauseNumber: '6.2.2', relationship: 'feeds_into' }, { clauseNumber: '9.1.1', relationship: 'verified_by' }, { clauseNumber: '9.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.2.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'How many objectives were missed last period, and what happened as a result?', riskWeight: 3 }]
  }),
  mkClause(S, '6.2.2', {
    parentClauseNumber: '6.2',
    title: 'Planning actions to achieve environmental objectives',
    sortOrder: 622,
    requirementSummary: 'Determine: what will be done; resources required; responsibility; completion timing; how results will be evaluated (incl. indicators). Consider integration into business processes.',
    explanation: 'A standard SMART action-plan requirement — the audit interest is whether the plan is resourced and actually tracked to completion.',
    auditIntent: 'Verify action plans for objectives have named owners, dates, resources, and are reviewed at an appropriate cadence (not only annually at management review).',
    processOwnerRoles: ['SHE/Environmental Manager', 'Process/Operations Manager'],
    evidenceRequired: [{ category: 'record', description: 'Action plan per objective with resource, owner, timescale and evaluation method/indicator' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What resources did you need for this action plan, and were they provided?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm at least one action plan shows interim progress tracking, not just a year-end result.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Action plans lack defined indicators for monitoring progress.' }],
    relatedClauses: [{ clauseNumber: '6.2.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '6.2.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Were resources requested for an objective action plan ever declined, and was the objective adjusted accordingly?', riskWeight: 2 }]
  }),
  mkClause(S, '6.3', {
    parentClauseNumber: '6',
    title: 'Planning of changes',
    sortOrder: 630,
    requirementSummary: 'When change affecting/potentially affecting the EMS is determined, it shall be carried out in a planned manner, managed to ensure the EMS achieves its intended outcomes.',
    explanation: 'A management-of-change control specific to the EMS — new clause emphasis in the 2026 edition; covers organizational, process, and site changes, not just physical/engineering MOC.',
    auditIntent: 'Confirm a genuine MOC trigger/process exists (not only for capital projects) and that EMS implications (aspects, risks, competence, controls) are assessed before implementation.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Engineering/Projects'],
    evidenceRequired: [
      { category: 'procedure', description: 'Management of change procedure covering EMS-relevant changes' },
      { category: 'record', description: 'Completed MOC assessments for recent organizational/process/site changes' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Tell me about the last significant change on site — how was it assessed for environmental impact before it happened?', questionType: 'trace' }],
    auditTests: [{ description: 'Select one recent change (new line, new supplier, org restructure) and confirm it went through MOC with 6.1.2/6.1.4 reassessment before go-live.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A significant change was implemented with no prior environmental risk/aspect assessment.' }],
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'verified_by' }, { clauseNumber: '8.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '8.1.3', relationship: 'analogous_concept', note: '45001 places management of change under Operation (8.1.3) rather than Planning; conceptually equivalent control.' }],
    riskPrompts: [{ prompt: 'Is there a current or recently completed capital project, restructure or new contract not yet reflected in the aspects/risk registers?', riskWeight: 4 }]
  })
]
