import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const performance14001: Clause[] = [
  mkClause(S, '9', {
    title: 'Performance evaluation',
    sortOrder: 900,
    isContainer: true,
    requirementSummary: 'Monitoring/measurement/analysis/evaluation, internal audit, and management review.',
    explanation: 'The "Check" phase — this is normally the auditor\'s single best source for finding evidence-backed nonconformities elsewhere in the EMS, since it aggregates data from every other clause.',
    auditIntent: 'Use this clause group\'s own outputs (internal audit results, monitoring trends, management review minutes) as a map of where to dig deeper elsewhere.'
  }),
  mkClause(S, '9.1', {
    parentClauseNumber: '9',
    title: 'Monitoring, measurement, analysis, and evaluation',
    sortOrder: 910,
    isContainer: true,
    requirementSummary: 'General monitoring/measurement/analysis/evaluation (9.1.1) and evaluation of compliance (9.1.2).',
    explanation: 'Splits general performance monitoring from the specific legal-compliance evaluation process.',
    auditIntent: 'Confirm both exist and are distinct, evidenced processes.'
  }),
  mkClause(S, '9.1.1', {
    parentClauseNumber: '9.1',
    title: 'General',
    sortOrder: 911,
    requirementSummary:
      'Evaluate environmental performance and EMS effectiveness. Determine what/how/criteria/when to monitor, measure, analyse and evaluate, with valid results. Ensure calibrated/verified monitoring equipment. Communicate performance information internally/externally as required. Retain evidence.',
    explanation: 'Requires a defined monitoring plan (parameters, methods, frequency, acceptance criteria) with calibration control — not ad hoc spot checks.',
    auditIntent: 'Verify monitoring data is valid (calibrated equipment, competent method) and actually analysed/evaluated against criteria, not just collected and filed.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Laboratory/Monitoring provider', 'Process/Operations Manager'],
    mandatoryDocumentedInfo: [{ description: 'Monitoring, measurement, analysis and evaluation results', kind: 'record' }],
    evidenceRequired: [
      { category: 'monitoring_data', description: 'Emissions/discharge/waste/energy monitoring data with trend analysis' },
      { category: 'record', description: 'Equipment calibration/verification certificates' },
      { category: 'record', description: 'Monitoring plan defining parameters, methods, frequency and criteria' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'Walk me through how a monitoring result gets from measurement to a decision or action.', questionType: 'trace' },
      { audienceRole: 'Process owner', question: 'When was the monitoring equipment last calibrated, and by whom?', questionType: 'verification' }
    ],
    auditTests: [{ description: 'Select 2-3 monitoring parameters and trace raw data → calibration status → analysis/trend → any resulting action.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'Monitoring equipment used for a compliance-critical parameter is out of calibration.' },
      { severityHint: 'Minor', description: 'Monitoring data is collected but not analysed/trended or reviewed against objectives.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2', relationship: 'verified_by' }, { clauseNumber: '6.2.1', relationship: 'verified_by' }, { clauseNumber: '9.1.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.1.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is there a trend of near-limit or exceedance results with no corrective action recorded?', riskWeight: 5 }]
  }),
  mkClause(S, '9.1.2', {
    parentClauseNumber: '9.1',
    title: 'Evaluation of compliance',
    sortOrder: 912,
    requirementSummary: 'Establish/implement/maintain process(es) to evaluate meeting compliance obligations; determine evaluation frequency; evaluate compliance and act if needed; maintain knowledge/understanding of compliance status; retain evidence.',
    explanation: 'A distinct, planned compliance-evaluation cycle (often confused with internal audit, but must exist even if internal audit doesn\'t explicitly test every obligation each cycle).',
    auditIntent: 'Confirm a compliance evaluation schedule/checklist exists covering all applicable obligations from 6.1.3, at a defined frequency, with evidenced outcomes.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Legal/Compliance'],
    mandatoryDocumentedInfo: [{ description: 'Compliance evaluation results', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Compliance evaluation schedule/checklist covering the compliance obligations register' },
      { category: 'record', description: 'Completed compliance evaluations with findings and any resulting actions' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How often is compliance formally evaluated, and can you show me the last evaluation for this permit?', questionType: 'verification' }],
    auditTests: [{ description: 'Select 2-3 compliance obligations and confirm each has a recent, dated compliance evaluation record.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'No formal compliance evaluation has been conducted for a material compliance obligation within the organization\'s own stated frequency.' }],
    relatedClauses: [{ clauseNumber: '6.1.3', relationship: 'verified_by' }, { clauseNumber: '10.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.1.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Does the compliance evaluation frequency match the risk level of the obligation (e.g. daily discharge limits evaluated only annually)?', riskWeight: 4 }]
  }),
  mkClause(S, '9.2', {
    parentClauseNumber: '9',
    title: 'Internal audit',
    sortOrder: 920,
    isContainer: true,
    requirementSummary: 'Conduct internal audits at planned intervals (9.2.1) via a managed audit programme (9.2.2).',
    explanation: 'The mechanism the organization uses to check itself — this application exists to support exactly this clause and its 45001 equivalent.',
    auditIntent: 'Confirm the internal audit programme is itself risk-based, competently resourced, and its outputs are used (feeding 10.2 and 9.3).'
  }),
  mkClause(S, '9.2.1', {
    parentClauseNumber: '9.2',
    title: 'General',
    sortOrder: 921,
    requirementSummary: 'Conduct internal audits at planned intervals to determine whether the EMS conforms to the organization\'s own requirements and this document\'s requirements, and is effectively implemented and maintained.',
    explanation: 'Two distinct conformance tests: against the standard, and against the organization\'s own documented EMS.',
    auditIntent: 'Confirm audit scope/criteria explicitly cover both tests, not only a generic "ISO 14001 checklist".',
    processOwnerRoles: ['Internal Audit lead', 'SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'Internal audit reports referencing both standard requirements and internal procedures' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How do your internal audits check conformance to your own procedures, not just to the standard?', questionType: 'open' }],
    auditTests: [{ description: 'Sample an internal audit report and confirm findings reference both standard clauses and internal document references.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Internal audit reports reference the standard only, with no check against the organization\'s own procedures.' }],
    relatedClauses: [{ clauseNumber: '9.2.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.2.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Do internal audits ever result in findings against the organization\'s own (stricter) internal procedures, or only ever against the bare minimum standard?', riskWeight: 2 }]
  }),
  mkClause(S, '9.2.2', {
    parentClauseNumber: '9.2',
    title: 'Internal audit programme',
    sortOrder: 922,
    requirementSummary:
      'Establish/implement/maintain internal audit programme(s) incl. frequency/methods/responsibilities/planning/reporting; consider environmental importance of processes, changes, and previous audit results; define audit objectives/criteria/scope per audit; select auditors ensuring objectivity/impartiality; report results to relevant management; retain programme/implementation/results evidence.',
    explanation: 'This is precisely the clause this application is built to support — a risk-based, auditor-independent programme covering the whole EMS over a defined cycle.',
    auditIntent: 'Verify programme coverage (all significant processes/sites over the cycle), auditor independence (no auditing one\'s own area), and that results reach management with action.',
    processOwnerRoles: ['Internal Audit lead', 'SHE/Environmental Manager'],
    mandatoryDocumentedInfo: [
      { description: 'Internal audit programme(s)', kind: 'document' },
      { description: 'Evidence of implementation of the audit programme(s)', kind: 'record' },
      { description: 'Evidence of audit results', kind: 'record' }
    ],
    evidenceRequired: [
      { category: 'record', description: 'Multi-year internal audit programme/schedule with risk-based prioritisation' },
      { category: 'record', description: 'Auditor competence records and independence declarations' },
      { category: 'record', description: 'Audit reports and closure evidence for raised nonconformities' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'How did you decide the frequency/depth of audit for this process versus another?', questionType: 'trace' },
      { audienceRole: 'Process owner', question: 'How do you ensure the auditor is independent of the area being audited?', questionType: 'verification' }
    ],
    auditTests: [{ description: 'Confirm the audit programme has actually covered all significant processes/sites within its stated cycle; sample closure evidence for 2-3 prior findings.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A significant process/site has never been internally audited despite being within scope for multiple cycles.' },
      { severityHint: 'Minor', description: 'An auditor audited their own area of direct responsibility.' }
    ],
    relatedClauses: [{ clauseNumber: '10.2', relationship: 'feeds_into' }, { clauseNumber: '9.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.2.2', relationship: 'equivalent', note: '45001 additionally requires audit results be reported to workers/representatives, not only management.' }],
    riskPrompts: [{ prompt: 'Is the audit programme behind schedule, or was a planned audit skipped/postponed?', riskWeight: 3 }]
  }),
  mkClause(S, '9.3', {
    parentClauseNumber: '9',
    title: 'Management review',
    sortOrder: 930,
    isContainer: true,
    requirementSummary: 'Top management reviews the EMS at planned intervals (9.3.1) covering defined inputs (9.3.2) and producing defined results (9.3.3).',
    explanation: 'The clause that should close the PDCA loop back to Leadership and Planning.',
    auditIntent: 'Confirm review is substantive (evidence of discussion/decisions) not a rubber-stamped slide deck.'
  }),
  mkClause(S, '9.3.1', {
    parentClauseNumber: '9.3',
    title: 'General',
    sortOrder: 931,
    requirementSummary: 'Top management shall review the EMS at planned intervals to ensure continuing suitability, adequacy and effectiveness.',
    explanation: 'Sets the "planned intervals" and top-management-led expectation.',
    auditIntent: 'Confirm reviews happen at the organization\'s own stated frequency and top management genuinely participates.',
    processOwnerRoles: ['Top management'],
    evidenceRequired: [{ category: 'record', description: 'Management review schedule/calendar' }],
    interviewQuestions: [{ audienceRole: 'Top management', question: 'How often do you review the EMS, and what was the outcome of the last review?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm reviews occurred at the stated interval over the last 2 cycles.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Management review has not occurred within the organization\'s own defined interval.' }],
    relatedClauses: [{ clauseNumber: '9.3.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.3', relationship: 'equivalent', note: '45001 does not split management review into 3 sub-clauses; content is equivalent but presented as one clause.' }],
    riskPrompts: [{ prompt: 'Was the last scheduled management review postponed or skipped?', riskWeight: 3 }]
  }),
  mkClause(S, '9.3.2', {
    parentClauseNumber: '9.3',
    title: 'Management review inputs',
    sortOrder: 932,
    requirementSummary:
      'Inputs shall include: status of actions from previous reviews; changes in external/internal issues, interested party needs incl. compliance obligations, significant aspects, risks/opportunities; extent objectives achieved; performance info (NC/CA trends, monitoring results, compliance, audit results); adequacy of resources; interested party communications incl. complaints; improvement opportunities.',
    explanation: 'A specific, non-negotiable input checklist — a common audit finding is a management review pack missing one or more of these inputs entirely.',
    auditIntent: 'Cross-check the actual management review pack/minutes against every listed input.',
    processOwnerRoles: ['SHE/Environmental Manager'],
    evidenceRequired: [{ category: 'record', description: 'Management review input pack/pre-read covering all required inputs' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Which of the required management review inputs do you find hardest to compile, and why?', questionType: 'open' }],
    auditTests: [{ description: 'Checklist the last management review pack against every input required by 9.3.2 a-g.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Management review inputs omit compliance evaluation results or complaint communications.' }],
    relatedClauses: [{ clauseNumber: '9.1.1', relationship: 'depends_on' }, { clauseNumber: '9.1.2', relationship: 'depends_on' }, { clauseNumber: '9.2.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.3', relationship: 'partial_overlap', note: '45001 additionally requires consultation/participation of workers as an explicit input.' }],
    riskPrompts: [{ prompt: 'Were any required inputs (e.g. audit results, compliance status) missing from the last review pack?', riskWeight: 3 }]
  }),
  mkClause(S, '9.3.3', {
    parentClauseNumber: '9.3',
    title: 'Management review results',
    sortOrder: 933,
    requirementSummary:
      'Results shall include: conclusions on continuing suitability/adequacy/effectiveness; continual improvement decisions; decisions on EMS changes incl. resources; actions when objectives not achieved; opportunities to improve integration with other business processes; strategic direction implications. Documented evidence required.',
    explanation: 'Tests whether the review actually produced decisions and actions, not just a discussion.',
    auditIntent: 'Verify each required output category is present in the minutes and that resulting actions were tracked to closure.',
    processOwnerRoles: ['Top management'],
    mandatoryDocumentedInfo: [{ description: 'Management review results/minutes', kind: 'record' }],
    evidenceRequired: [{ category: 'record', description: 'Management review minutes with explicit decisions/actions and owners' }],
    interviewQuestions: [{ audienceRole: 'Top management', question: 'What decision did you personally make at the last management review, and what happened next?', questionType: 'trace' }],
    auditTests: [{ description: 'Select an action from the last review minutes and confirm it was tracked to closure or carried forward with rationale.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Management review minutes record discussion but no explicit decisions/actions for a missed objective.' }],
    relatedClauses: [{ clauseNumber: '10.1', relationship: 'feeds_into' }, { clauseNumber: '6.2.1', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '9.3', relationship: 'partial_overlap' }],
    riskPrompts: [{ prompt: 'Are management review actions from prior cycles still open/overdue?', riskWeight: 3 }]
  })
]
