import { mkClause } from '../helpers'
import type { Clause } from '../../types'

const S = 'iso45001' as const

export const leadership45001: Clause[] = [
  mkClause(S, '5', {
    title: 'Leadership and worker participation',
    sortOrder: 500,
    isContainer: true,
    requirementSummary: 'Leadership/commitment, OH&S policy, roles/responsibilities/authorities, and consultation/participation of workers.',
    explanation: 'Unlike ISO 14001\'s Clause 5, 45001 formally includes worker participation as a leadership-level clause (5.4) — reflecting that OH&S outcomes depend on workforce engagement, not management alone.',
    auditIntent: 'Test both top-management commitment and genuine, structured worker participation — the two weakest areas typically found in 45001 audits.'
  }),
  mkClause(S, '5.1', {
    parentClauseNumber: '5',
    title: 'Leadership and commitment',
    sortOrder: 510,
    requirementSummary:
      'Top management shall demonstrate leadership/commitment by: taking overall responsibility/accountability for preventing work-related injury/ill health and providing safe/healthy workplaces; ensuring policy/objectives compatible with strategic direction; integrating OH&S into business processes; ensuring resources available; communicating importance; ensuring intended outcomes achieved; directing/supporting persons; ensuring/promoting continual improvement; supporting other managers\' leadership; developing/promoting a supportive culture; protecting workers from reprisals when reporting; ensuring consultation/participation processes; supporting health and safety committees.',
    explanation: 'A markedly broader leadership list than ISO 14001\'s equivalent, explicitly including anti-reprisal protection and safety-culture building — these are common weak points in interviews.',
    auditIntent: 'Directly test whether workers feel safe reporting incidents/hazards without fear of reprisal, and whether top management can describe concrete culture-building actions.',
    processOwnerRoles: ['Top management / Managing Director', 'Site Director'],
    evidenceRequired: [
      { category: 'record', description: 'Business plan/budget showing OH&S resource allocation' },
      { category: 'record', description: 'Anti-reprisal/"speak up" policy and any related case records (anonymised)' },
      { category: 'record', description: 'Health and safety committee terms of reference and minutes' }
    ],
    interviewQuestions: [
      { audienceRole: 'Top management', question: 'What have you personally done in the last year to build a safety culture, beyond signing off the policy?', questionType: 'open' },
      { audienceRole: 'Worker', question: 'If you reported a hazard or near-miss that implicated a supervisor\'s decision, what would happen to you?', questionType: 'open' },
      { audienceRole: 'Worker representative', question: 'Does management genuinely support the health and safety committee\'s function?', questionType: 'open' }
    ],
    auditTests: [{ description: 'Sample recent incident reports and confirm no evidence of reprisal or reporting suppression; compare reported near-miss rate trend for signs of under-reporting.' }],
    potentialFindings: [
      { severityHint: 'Major', description: 'Evidence that a worker faced negative consequences for reporting a hazard or incident.' },
      { severityHint: 'Minor', description: 'Health and safety committee exists on paper but has not met at its stated frequency.' }
    ],
    relatedClauses: [{ clauseNumber: '5.4', relationship: 'feeds_into' }, { clauseNumber: '10.2', relationship: 'verified_by' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '5.1', relationship: 'equivalent', note: '14001 5.1 has no direct equivalent to the anti-reprisal or culture-building requirements — 45001 is broader here.' }],
    riskPrompts: [{ prompt: 'Is the near-miss/hazard reporting rate unusually low compared to sector benchmarks, suggesting under-reporting?', riskWeight: 4 }]
  }),
  mkClause(S, '5.2', {
    parentClauseNumber: '5',
    title: 'OH&S policy',
    sortOrder: 520,
    requirementSummary:
      'Top management shall establish an OH&S policy that: commits to safe/healthy working conditions for prevention of work-related injury/ill health, appropriate to context/OH&S risks/opportunities; provides a framework for objectives; commits to fulfil legal/other requirements; commits to eliminate hazards/reduce OH&S risks; commits to continual improvement; commits to consultation and participation of workers/representatives.',
    explanation: 'Broader than the 14001 policy equivalent — explicitly commits to the hierarchy of controls and to worker consultation/participation, not only compliance and improvement.',
    auditIntent: 'Verify the policy\'s hazard-elimination and worker-participation commitments are reflected in actual practice, not just wording.',
    processOwnerRoles: ['Top management'],
    mandatoryDocumentedInfo: [{ description: 'OH&S policy', kind: 'document' }],
    evidenceRequired: [
      { category: 'record', description: 'Signed, dated OH&S policy' },
      { category: 'record', description: 'Evidence of communication to workers and, where they exist, representatives' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Can you describe what the OH&S policy commits the organization to, in your own words?', questionType: 'open' }],
    auditTests: [{ description: 'Sample worker awareness of the policy\'s hazard-elimination and consultation commitments.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Policy has not been reviewed following a significant change in OH&S risk profile.' }],
    relatedClauses: [{ clauseNumber: '6.2.1', relationship: 'feeds_into' }, { clauseNumber: '5.4', relationship: 'feeds_into' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '5.2', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Does the policy predate a significant change in workforce composition or activity (e.g. new high-hazard process)?', riskWeight: 2 }]
  }),
  mkClause(S, '5.3', {
    parentClauseNumber: '5',
    title: 'Organizational roles, responsibilities and authorities',
    sortOrder: 530,
    requirementSummary: 'Top management shall ensure responsibilities/authorities for relevant roles assigned/communicated, and assign responsibility/authority for (a) ensuring OH&S management system conformance and (b) reporting on OH&S performance to top management. Top management remains accountable even where responsibility/authority is assigned.',
    explanation: 'Explicitly preserves top management accountability even when day-to-day responsibility is delegated — a point often tested directly in interviews.',
    auditIntent: 'Confirm the OH&S manager has genuine stop-work authority and that performance reporting to top management is routine.',
    processOwnerRoles: ['Top management', 'SHE/OH&S Manager'],
    evidenceRequired: [
      { category: 'record', description: 'Organization chart / RACI for OH&S roles' },
      { category: 'record', description: 'Evidence of stop-work authority being exercised (e.g. a documented stoppage)' }
    ],
    interviewQuestions: [{ audienceRole: 'Worker', question: 'Do you know who has the authority to stop a job on safety grounds, and has it ever happened?', questionType: 'open' }],
    auditTests: [{ description: 'Confirm at least one instance of stop-work authority being exercised and the outcome.' }],
    potentialFindings: [{ severityHint: 'Minor', description: 'Stop-work authority is documented but workers are unaware it exists or how to invoke it.' }],
    relatedClauses: [{ clauseNumber: '5.1', relationship: 'depends_on' }],
    crossStandardEquivalents: [{ standardId: 'iso14001', clauseNumber: '5.3', relationship: 'equivalent' }],
    riskPrompts: [{ prompt: 'Has stop-work authority ever been overridden or discouraged in practice?', riskWeight: 4 }]
  }),
  mkClause(S, '5.4', {
    parentClauseNumber: '5',
    title: 'Consultation and participation of workers',
    sortOrder: 540,
    requirementSummary:
      'Establish/implement/maintain process(es) for consultation and participation of workers/representatives at all levels/functions in developing/planning/implementing/evaluating/improving the OH&S management system. Provide mechanisms/time/training/resources; provide timely access to clear information; remove obstacles/barriers; emphasize non-managerial worker consultation on policy/roles/objectives/legal requirements/monitoring/audit programme/improvement; emphasize non-managerial worker participation in hazard identification/risk assessment/controls/competence/communication/investigation.',
    explanation: 'Has no ISO 14001 equivalent — this is the clause that most distinguishes 45001\'s participatory model, and the one most often given only superficial treatment (a suggestion box) rather than the structured, resourced process required.',
    auditIntent: 'Test depth of participation against the specific list in 5.4 d) and e) — most organizations only do 1-2 of the nine consultation items and 2-3 of the seven participation items well.',
    processOwnerRoles: ['SHE/OH&S Manager', 'Worker representatives', 'HR'],
    evidenceRequired: [
      { category: 'record', description: 'Health and safety committee minutes showing worker representative input to policy, objectives, risk assessments' },
      { category: 'record', description: 'Evidence workers were consulted on the audit programme and on determining monitoring needs' },
      { category: 'record', description: 'Evidence of removed/mitigated participation barriers (language, literacy, shift patterns)' },
      { category: 'record', description: 'Evidence workers participated in incident investigations' }
    ],
    interviewQuestions: [
      { audienceRole: 'Worker', question: 'Were you or a representative consulted before this risk assessment/procedure was finalised?', questionType: 'trace' },
      { audienceRole: 'Worker representative', question: 'What obstacles to participation have you raised, and what was done about them?', questionType: 'open' },
      { audienceRole: 'Process owner', question: 'How are non-managerial workers involved in planning the internal audit programme?', questionType: 'open' }
    ],
    auditTests: [
      { description: 'For a recent risk assessment or incident investigation, confirm documented evidence of non-managerial worker participation.' },
      { description: 'Check whether training/consultation time was provided at no cost to workers and during working hours where practicable.' }
    ],
    potentialFindings: [
      { severityHint: 'Major', description: 'No evidence of non-managerial worker participation in hazard identification or incident investigation despite the requirement.' },
      { severityHint: 'Minor', description: 'Consultation mechanisms exist for permanent staff but exclude contractors, agency or night-shift workers.' }
    ],
    relatedClauses: [{ clauseNumber: '6.1.2.1', relationship: 'feeds_into' }, { clauseNumber: '10.2', relationship: 'feeds_into' }, { clauseNumber: '9.2.2', relationship: 'feeds_into' }],
    crossStandardEquivalents: [],
    riskPrompts: [
      { prompt: 'Do night-shift, agency, or contractor workers have equivalent participation mechanisms to permanent day-shift staff?', riskWeight: 4 },
      { prompt: 'Have any obstacles to participation (language, literacy, shift patterns) been identified but not acted on?', riskWeight: 3 }
    ]
  })
]
