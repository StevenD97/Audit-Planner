import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const performance45001: Clause[] = [
  mkClause(S, '9', {
    title: 'Performance evaluation',
    sortOrder: 900,
    isContainer: true,
    requirementSummary: 'Monitoring/measurement/analysis/performance evaluation, internal audit, and management review.',
    explanation: 'The "Check" phase, aggregating data from every other clause.',
    auditIntent: 'Use internal audit results and monitoring trends as a map for where to dig deeper elsewhere in the OH&S management system.'
  }),
  mkClause(S, '9.1', {
    parentClauseNumber: '9',
    title: 'Monitoring, measurement, analysis and performance evaluation',
    sortOrder: 910,
    isContainer: true,
    requirementSummary: 'General monitoring/measurement/analysis/performance evaluation (9.1.1) and evaluation of compliance (9.1.2).',
    explanation: 'Splits general OH&S performance monitoring from the specific legal-compliance evaluation cycle.',
    auditIntent: 'Confirm both leading and lagging indicators are monitored, and compliance evaluation is a distinct, planned process.'
  }),
  mkClause(S, '9.1.1', {
    parentClauseNumber: '9.1',
    title: 'General',
    sortOrder: 911,
    requirementSummary:
      'Establish/implement/maintain process(es) for monitoring/measurement/analysis/performance evaluation. Determine what needs monitoring (legal/other requirement fulfilment; hazard/risk/opportunity-related activities/operations; objective progress; control effectiveness); methods; criteria; when performed; when analysed/evaluated/communicated. Evaluate performance and determine effectiveness. Ensure monitoring/measuring equipment calibrated/verified. Retain documented evidence.',
    explanation: 'Explicitly requires monitoring "effectiveness of operational and other controls" — not just outcome metrics like incident counts.',
    auditIntent: 'Verify leading indicators (control effectiveness, near-miss reporting) are monitored alongside lagging indicators (LTIFR), and equipment (e.g. gas detectors, noise meters) is properly calibrated.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Occupational Health provider'],
    mandatoryDocumentedInfo: [{ description: 'Monitoring, measurement, analysis and performance evaluation results', kind: 'record' }],
    evidenceRequired: [
      { category: 'monitoring_data', description: 'OH&S performance data incl. leading indicators (near-miss rate, control effectiveness checks) and lagging indicators (LTIFR, TRIFR)' },
      { category: 'record', description: 'Calibration/verification certificates for monitoring/measuring equipment (e.g. gas monitors, noise/vibration meters)' }
    ],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'Beyond incident counts, what leading indicators do you monitor for OH&S performance?', questionType: 'open' }],
    auditTests: [{ description: 'Select 2-3 monitoring parameters (incl. at least one control-effectiveness check) and trace data → analysis → action.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'Gas/atmospheric monitoring equipment used for confined space entry is out of calibration.' },
      { severityHint: 'Minor', description: 'Only lagging indicators (incident counts) are monitored; no leading indicators exist.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2.1', relationship: 'verified_by' }, { clauseNumber: '6.2.1', relationship: 'verified_by' }, { clauseNumber: '9.1.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '9.1.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is safety-critical monitoring/measuring equipment (gas detection, noise dosimetry) overdue for calibration?', riskWeight: 5 }]
  }),
  mkClause(S, '9.1.2', {
    parentClauseNumber: '9.1',
    title: 'Evaluation of compliance',
    sortOrder: 912,
    requirementSummary: 'Establish/implement/maintain process(es) to evaluate compliance with legal/other requirements. Determine frequency/methods; evaluate compliance and act if needed; maintain knowledge/understanding of compliance status; retain documented evidence.',
    explanation: 'Distinct, planned compliance evaluation cycle — the OH&S equivalent to 14001 9.1.2.',
    auditIntent: 'Confirm a defined schedule exists covering all applicable legal/other requirements with evidenced outcomes.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Legal/Compliance'],
    mandatoryDocumentedInfo: [{ description: 'Compliance evaluation results', kind: 'record' }],
    evidenceRequired: [{ category: 'record', description: 'Compliance evaluation schedule/checklist and completed evaluations with findings/actions' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How often is legal compliance formally evaluated, and can you show me the last one for a statutory inspection requirement?', questionType: 'verification' }],
    auditTests: [{ description: 'Select 2-3 legal requirements (e.g. statutory plant inspection, noise exposure limit) and confirm recent, dated compliance evaluation records.' }],
    potentialFindings: [{ severityHint: 'Major', description: 'A statutory inspection/thorough examination (e.g. lifting equipment, pressure systems) is overdue.' }],
    relatedClauses: [{ clauseNumber: '6.1.3', relationship: 'verified_by' }, { clauseNumber: '10.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '9.1.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Is any statutory thorough examination/inspection (lifting equipment, pressure vessels, LEV) currently overdue?', riskWeight: 5 }]
  }),
  mkClause(S, '9.2', {
    parentClauseNumber: '9',
    title: 'Internal audit',
    sortOrder: 920,
    isContainer: true,
    requirementSummary: 'Conduct internal audits at planned intervals (9.2.1) via a managed audit programme (9.2.2).',
    explanation: 'The mechanism this application supports directly for OH&S, mirroring 14001 9.2.',
    auditIntent: 'Confirm the programme is risk-based, consultative, and its outputs are used.'
  }),
  mkClause(S, '9.2.1', {
    parentClauseNumber: '9.2',
    title: 'General',
    sortOrder: 921,
    requirementSummary: 'Conduct internal audits at planned intervals to determine whether the OH&S management system conforms to the organization\'s own requirements (incl. policy/objectives) and this document\'s requirements, and is effectively implemented/maintained.',
    explanation: 'Two conformance tests, as in 14001, but explicitly naming policy/objectives conformance.',
    auditIntent: 'Confirm audit scope/criteria explicitly test conformance to internal policy/objectives, not only the bare standard.',
    processOwnerRoles: ['Internal Audit lead', 'SHE/OH&S Manager'],
    evidenceRequired: [{ category: 'record', description: 'Internal audit reports referencing both standard requirements and internal policy/objectives' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'How do internal audits check conformance to your own OH&S policy and objectives, not just the standard?', questionType: 'open' }],
    auditTests: [{ description: 'Sample an internal audit report for references to internal policy/objective conformance.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'Internal audits check the standard only, never the organization\'s own OH&S objectives.' }],
    relatedClauses: [{ clauseNumber: '9.2.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '9.2.1', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Do internal audits ever find against internal OH&S objectives, or only ever against the bare standard minimum?', riskWeight: 2 }]
  }),
  mkClause(S, '9.2.2', {
    parentClauseNumber: '9.2',
    title: 'Internal audit programme',
    sortOrder: 922,
    requirementSummary:
      'Plan/establish/implement/maintain audit programme(s) incl. frequency/methods/responsibilities/consultation/planning/reporting, considering process importance and previous audit results; define audit criteria/scope per audit; select auditors ensuring objectivity/impartiality; ensure results reported to relevant managers, and to workers/representatives/other relevant interested parties; take action on nonconformities and continually improve OH&S performance; retain documented evidence.',
    explanation: 'Explicitly requires audit results to reach workers/representatives, not only managers — broader distribution than 14001\'s equivalent — and requires worker consultation on the audit programme itself (linking to 5.4).',
    auditIntent: 'Verify audit results are actually communicated to the workforce/representatives (not just a management-only report), and workers were consulted on programme planning.',
    processOwnerRoles: ['Internal Audit lead', 'SHE/OH&S Manager', 'Worker representatives'],
    mandatoryDocumentedInfo: [{ description: 'Evidence of implementation of the audit programme and audit results', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Risk-based multi-year internal audit programme/schedule' },
      { category: 'record', description: 'Evidence audit results were communicated to workers/representatives' },
      { category: 'record', description: 'Auditor competence/independence records' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker representative', question: 'Have internal audit results ever been shared with you or the safety committee?', questionType: 'verification' },
      { audienceRole: 'Process owner', question: 'Were workers consulted on how the audit programme was planned?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Confirm at least one internal audit result was communicated beyond management to workers/representatives; check programme coverage against all significant hazard areas.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A significant hazard area/site has never been internally audited despite being in scope for multiple cycles.' },
      { severityHint: 'Minor', description: 'Audit results are reported to management only, with no evidence of communication to workers/representatives.' }
    ],
    relatedClauses: [{ clauseNumber: '5.4', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'feeds_into' }, { clauseNumber: '9.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '9.2.2', relationship: 'equivalent', note: '45001 requires worker/representative reporting and consultation on the programme; 14001 does not.' }],
    riskPrompts: [{ prompt: 'Is the internal audit programme behind schedule for a high-hazard area?', riskWeight: 3 }]
  }),
  mkClause(S, '9.3', {
    parentClauseNumber: '9',
    title: 'Management review',
    sortOrder: 930,
    requirementSummary:
      'Top management shall review the OH&S management system at planned intervals for continuing suitability/adequacy/effectiveness, considering: status of previous review actions; changes in external/internal issues incl. interested party needs, legal/other requirements, risks/opportunities; extent policy/objectives met; performance info (incidents/NC/CA/continual improvement trends, monitoring results, compliance evaluation results, audit results, worker consultation/participation, risks/opportunities); adequacy of resources; interested party communications; improvement opportunities.',
    explanation: 'Presented as a single clause (unlike 14001\'s 9.3.1/9.3.2/9.3.3 split) but with an explicitly required input that 14001 lacks: "consultation and participation of workers" as a standing management review input.',
    auditIntent: 'Cross-check the review pack against every required input, specifically confirming worker consultation/participation is reported as a distinct item, and that outputs include explicit decisions/actions.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    mandatoryDocumentedInfo: [{ description: 'Management review results/minutes', kind: 'record' }],
    evidenceRequired: [
      { category: 'record', description: 'Management review input pack covering all required items incl. worker consultation/participation status' },
      { category: 'record', description: 'Management review minutes with explicit decisions/actions and owners' }
    ],
    interviewQuestions: [
      { audienceRole: 'Top management', question: 'What did the last management review conclude about worker consultation and participation specifically?', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Checklist the last management review pack against every required input a-g, specifically confirming worker consultation/participation appears as a distinct item.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'Management review inputs omit worker consultation/participation status entirely.' },
      { severityHint: 'Minor', description: 'Review minutes record discussion but no explicit decisions/actions for a missed objective.' }
    ],
    relatedClauses: [{ clauseNumber: '9.1.1', relationship: 'depends_on' }, { clauseNumber: '9.1.2', relationship: 'depends_on' }, { clauseNumber: '9.2.2', relationship: 'depends_on' }, { clauseNumber: '5.4', relationship: 'depends_on' }, { clauseNumber: '10.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '9.3', relationship: 'partial_overlap', note: '14001 splits this into 9.3.1-9.3.3 with no worker-consultation input requirement; content otherwise closely aligned.' }],
    riskPrompts: [{ prompt: 'Were any required inputs (e.g. worker consultation status, compliance evaluation results) missing from the last review pack?', riskWeight: 3 }]
  })
]
