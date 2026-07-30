import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const improvement14001: Clause[] = [
  mkClause(S, '10', {
    title: 'Improvement',
    sortOrder: 1000,
    isContainer: true,
    requirementSummary: 'Continual improvement and nonconformity/corrective action.',
    explanation: 'The "Act" phase closing the PDCA loop.',
    auditIntent: 'Check that corrective action is genuinely root-cause based, not just symptom-fixing.'
  }),
  mkClause(S, '10.1', {
    parentClauseNumber: '10',
    title: 'Continual improvement',
    sortOrder: 1010,
    requirementSummary: 'Continually improve suitability, adequacy and effectiveness of the EMS to enhance environmental performance, by determining improvement opportunities (Clause 9 and 10.2) and implementing necessary actions.',
    explanation: 'A deliberately broad clause capturing improvement activity that doesn\'t originate from a specific nonconformity (e.g. voluntary best-practice adoption, efficiency projects).',
    auditIntent: 'Look for improvement activity beyond reactive corrective action — proactive projects, benchmarking, technology upgrades.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Top management'],
    evidenceRequired: [{ category: 'record', description: 'Register of continual improvement initiatives (beyond corrective actions)' }],
    interviewQuestions: [{ audienceRole: 'Process owner', question: 'What environmental improvement have you driven proactively, not in response to a problem?', questionType: 'open' }],
    auditTests: [{ description: 'Identify at least one proactive (non-corrective-action) improvement initiative completed in the audit period.' }],
    potentialFindings: [{ severityHint: 'OFI', description: 'All "improvement" activity traces back to corrective actions; no proactive improvement is evidenced.' }],
    relatedClauses: [{ clauseNumber: '9.3.3', relationship: 'depends_on' }, { clauseNumber: '10.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '10.3', relationship: 'equivalent', note: '45001 places this content under 10.3 and adds an explicit 10.1 "General" clause; 14001 has no separate 10.1 General clause.' }],
    riskPrompts: [{ prompt: 'Has the organization benchmarked itself against sector best practice or comparable sites in the last audit period?', riskWeight: 1 }]
  }),
  mkClause(S, '10.2', {
    parentClauseNumber: '10',
    title: 'Nonconformity and corrective action',
    sortOrder: 1020,
    requirementSummary:
      'On nonconformity: react (control/correct, deal with consequences incl. mitigating impacts); evaluate need for corrective action by reviewing the NC, determining cause(s), and checking for similar/potential NCs elsewhere; implement action; review effectiveness; change EMS if needed. Corrective action shall be proportionate to the significance of effects/impacts. Retain evidence of NC nature/actions and CA results.',
    explanation: 'A full root-cause-analysis expectation, explicitly proportionate to impact — minor paperwork slips don\'t need the same rigour as a permit breach.',
    auditIntent: 'Test root-cause depth (not just "retrain the operator"), proportionality, and whether corrective action closure includes an effectiveness check and a search for similar occurrences elsewhere.',
    processOwnerRoles: ['SHE/Environmental Manager', 'Process/Operations Manager'],
    mandatoryDocumentedInfo: [
      { description: 'Nature of nonconformities and subsequent actions taken', kind: 'record' },
      { description: 'Results of corrective actions', kind: 'record' }
    ],
    evidenceRequired: [
      { category: 'record', description: 'Nonconformity/corrective action register (CAPA log) with root cause and effectiveness review' },
      { category: 'record', description: 'Evidence of extending corrective action to other similar processes/sites where relevant' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'Take me through root-cause analysis for your most significant nonconformity this year.', questionType: 'trace' },
      { audienceRole: 'Process owner', question: 'How do you check whether a similar nonconformity could occur in another department or site?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Select 2-3 closed CAPAs and verify: root cause depth, proportionate action, effectiveness review evidence, and consideration of recurrence elsewhere.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'A recurring nonconformity exists with no evidence root cause was ever properly investigated.' },
      { severityHint: 'Minor', description: 'Corrective actions are closed without an effectiveness review.' }
    ],
    relatedClauses: [{ clauseNumber: '9.2.2', relationship: 'depends_on' }, { clauseNumber: '9.1.2', relationship: 'depends_on' }, { clauseNumber: '8.2', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '10.2', relationship: 'equivalent', note: '45001 10.2 additionally covers "incidents" (with/without an accompanying nonconformity) and requires worker participation in the investigation — broader than 14001\'s NC-only scope.' }],
    riskPrompts: [{ prompt: 'How many CAPAs are currently overdue, and is there a repeat theme across them?', riskWeight: 4 }]
  })
]
