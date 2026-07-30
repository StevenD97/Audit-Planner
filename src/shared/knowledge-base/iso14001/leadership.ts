import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso14001' as const

export const leadership14001: Clause[] = [
  mkClause(S, '5', {
    title: 'Leadership',
    sortOrder: 500,
    isContainer: true,
    requirementSummary: 'Top management leadership, environmental policy, and roles/responsibilities/authorities.',
    explanation: 'Establishes accountability at the top of the organization — an EMS driven only by a middle-manager "champion" with no top management engagement is the classic root cause behind many other clause failures.',
    auditIntent: 'Test top management\'s personal engagement, not just delegated compliance.'
  }),
  mkClause(S, '5.1', {
    parentClauseNumber: '5',
    title: 'Leadership and commitment',
    sortOrder: 510,
    requirementSummary:
      'Top management shall demonstrate leadership/commitment by: taking accountability for EMS effectiveness; ensuring policy/objectives compatible with strategic direction; integrating EMS into business processes; ensuring resources available; communicating importance of EMS/conformance; ensuring intended outcomes achieved; directing/supporting persons; promoting continual improvement; supporting other managers\' leadership.',
    explanation: 'A checklist of observable leadership behaviours — this is one of the hardest clauses to fake in an interview, since it requires top management to speak fluently about the EMS in their own words.',
    auditIntent: 'Interview top management directly (not only the EMS coordinator) to test genuine ownership of environmental performance, resourcing decisions and integration into business planning.',
    processOwnerRoles: ['Top management / Managing Director', 'Site Director'],
    evidenceRequired: [
      { category: 'record', description: 'Business plan/budget showing EMS resource allocation approved by top management' },
      { category: 'record', description: 'Management review minutes signed/chaired by top management' },
      { category: 'record', description: 'Internal communications from top management on environmental performance (town halls, memos, intranet)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Top management', question: 'What is your personal role in the EMS, and what environmental outcomes are you accountable for this year?', questionType: 'open' },
      { audienceRole: 'Top management', question: 'Tell me about a recent resourcing decision you made specifically because of an environmental risk or opportunity.', questionType: 'open' },
      { audienceRole: 'Worker', question: 'How does senior management communicate the importance of environmental performance to you?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Compare top management\'s stated priorities against the actual management review inputs/outputs and resource allocation records.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'Top management cannot articulate specific environmental objectives or recent performance without prompting from the EMS coordinator.' },
      { severityHint: 'OFI', description: 'Leadership commitment is visible in policy statements but not evidenced in resource/budget decisions.' }
    ],
    relatedClauses: [{ clauseNumber: '5.2', relationship: 'feeds_into' }, { clauseNumber: '9.3', relationship: 'verified_by' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '5.1', relationship: 'equivalent', note: '45001 5.1 additionally requires protecting workers from reprisals and building a supporting safety culture — broader than 14001 5.1.' }],
    riskPrompts: [{ prompt: 'Has an environmental incident or enforcement action occurred where top management involvement was minimal or delayed?', riskWeight: 4 }]
  }),
  mkClause(S, '5.2', {
    parentClauseNumber: '5',
    title: 'Environmental policy',
    sortOrder: 520,
    requirementSummary:
      'Top management shall establish an environmental policy appropriate to context, providing a framework for objectives, committing to protection of the environment (incl. pollution prevention), meeting compliance obligations, and continual improvement. Policy shall be documented, communicated, and available to interested parties.',
    explanation: 'The policy is the top-level "contract" the organization makes with itself and its stakeholders; it must be specific enough to drive objectives, not generic boilerplate.',
    auditIntent: 'Verify the policy content maps to the organization\'s actual significant aspects/context, is genuinely communicated (not just posted), and is externally available.',
    processOwnerRoles: ['Top management'],
    mandatoryDocumentedInfo: [{ description: 'Environmental policy', kind: 'document' }],
    evidenceRequired: [
      { category: 'record', description: 'Signed, dated environmental policy document' },
      { category: 'record', description: 'Evidence of communication (induction records, notice boards, intranet, toolbox talks)' },
      { category: 'record', description: 'Evidence policy is available externally (website, on request)' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'Are you aware of the environmental policy, and can you describe what it commits the organization to?', questionType: 'open' },
      { audienceRole: 'Top management', question: 'When was the policy last reviewed, and what prompted any changes?', questionType: 'trace' }
    ],
    auditTests: [{ description: 'Sample 3 workers across different roles/shifts and check awareness of the policy\'s key commitments.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'Policy has not been reviewed despite material changes to the organization\'s significant aspects or compliance obligations.' },
      { severityHint: 'OFI', description: 'Policy is generic and does not reference the organization\'s specific commitments (e.g. named beyond "comply with law").' }
    ],
    relatedClauses: [{ clauseNumber: '6.2.1', relationship: 'feeds_into' }, { clauseNumber: '7.3', relationship: 'verified_by' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '5.2', relationship: 'equivalent', note: '45001 policy additionally commits to eliminating hazards/reducing risk and worker consultation/participation.' }],
    riskPrompts: [{ prompt: 'Does the policy predate a significant business change (merger, new site, new process) without update?', riskWeight: 2 }]
  }),
  mkClause(S, '5.3', {
    parentClauseNumber: '5',
    title: 'Roles, responsibilities and authorities',
    sortOrder: 530,
    requirementSummary:
      'Top management shall ensure responsibilities/authorities for relevant roles are assigned and communicated, and shall assign responsibility/authority for (a) ensuring EMS conformance and (b) reporting EMS performance to top management.',
    explanation: 'Requires a named person (not necessarily full-time) with authority to intervene, plus a defined reporting line into top management — audits frequently find (a) is delegated but (b) reporting is ad hoc or absent.',
    auditIntent: 'Confirm the EMS management representative role has real authority and that performance reporting to top management is routine and evidenced.',
    processOwnerRoles: ['Top management', 'SHE/Environmental Manager'],
    evidenceRequired: [
      { category: 'record', description: 'Organization chart / RACI showing EMS roles' },
      { category: 'record', description: 'Job description for EMS management representative including reporting authority' },
      { category: 'record', description: 'Management review minutes showing performance reporting to top management' }
    ],
    interviewQuestions: [
      { audienceRole: 'Process owner', question: 'What authority do you have to stop an activity or require corrective action if you find a nonconformity?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Confirm the person reporting EMS performance to top management can produce evidence of at least one such report in the audit period.' }],
    potentialFindings: [
      { severityHint: 'Minor', description: 'No documented reporting of EMS performance to top management occurred in the audit period.' }
    ],
    relatedClauses: [{ clauseNumber: '5.1', relationship: 'depends_on' }, { clauseNumber: '9.3', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso45001', clauseNumber: '5.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Has the EMS management representative changed recently without a formal handover of authority/responsibility?', riskWeight: 2 }]
  })
]
