import type { AuditTrailDefinition } from '../types'

export const auditTrails: AuditTrailDefinition[] = [
  {
    id: 'trail-leadership-objectives',
    name: 'Leadership → Objectives → Monitoring → Management Review',
    description:
      'Tests whether top management commitment genuinely translates into measurable objectives, whether those objectives are monitored, and whether the results actually reach and inform management review decisions — the classic "closed loop" test for both standards.',
    standardIds: 'combined',
    steps: [
      { standardId: 'iso14001', clauseNumber: '5.1', note: 'Confirm top management commitment and resourcing.' },
      { standardId: 'iso14001', clauseNumber: '6.2.1', note: 'Trace commitment to specific, measurable objectives.' },
      { standardId: 'iso14001', clauseNumber: '9.1.1', note: 'Verify objectives are actually monitored with valid data.' },
      { standardId: 'iso14001', clauseNumber: '9.3.2', note: 'Confirm monitoring results feed management review as an input.' },
      { standardId: 'iso14001', clauseNumber: '9.3.3', note: 'Confirm management review produces a decision/action closing the loop.' }
    ]
  },
  {
    id: 'trail-hazard-risk-controls-training-investigation',
    name: 'Hazard Identification → Risk Assessment → Controls → Training → Incident Investigation',
    description:
      'The core OH&S audit trail: confirms hazards are identified, properly assessed, controlled per the hierarchy of controls, that workers are competent in those controls, and that any resulting incident is properly investigated and fed back into the risk assessment.',
    standardIds: ['iso45001'],
    steps: [
      { standardId: 'iso45001', clauseNumber: '6.1.2.1', note: 'Confirm the hazard was identified (routine, non-routine or emergency).' },
      { standardId: 'iso45001', clauseNumber: '6.1.2.2', note: 'Verify the risk was assessed using the defined methodology, accounting for existing controls.' },
      { standardId: 'iso45001', clauseNumber: '8.1.2', note: 'Check the control selected follows the hierarchy of controls (not PPE-first).' },
      { standardId: 'iso45001', clauseNumber: '7.2', note: 'Confirm workers are competent in the control (training + effectiveness evaluation).' },
      { standardId: 'iso45001', clauseNumber: '10.2', note: 'If an incident occurred, verify investigation depth, worker participation, and whether the risk assessment was updated.' }
    ]
  },
  {
    id: 'trail-aspects-controls-monitoring-compliance',
    name: 'Environmental Aspects → Controls → Monitoring → Compliance Obligations',
    description:
      'The core environmental audit trail: confirms significant aspects are properly controlled, that controls are monitored with valid data, and that this demonstrably supports meeting compliance obligations (permits/consents).',
    standardIds: ['iso14001'],
    steps: [
      { standardId: 'iso14001', clauseNumber: '6.1.2', note: 'Select a significant environmental aspect.' },
      { standardId: 'iso14001', clauseNumber: '8.1', note: 'Verify an operational control/operating criterion exists and is followed on site.' },
      { standardId: 'iso14001', clauseNumber: '9.1.1', note: 'Confirm the control is monitored with calibrated, analysed data.' },
      { standardId: 'iso14001', clauseNumber: '6.1.3', note: 'Trace the aspect to its related compliance obligation (permit/consent/licence condition).' },
      { standardId: 'iso14001', clauseNumber: '9.1.2', note: 'Confirm compliance with that obligation has been formally evaluated.' }
    ]
  },
  {
    id: 'trail-legal-compliance',
    name: 'Compliance Obligations → Operational Control → Compliance Evaluation → Nonconformity & Corrective Action',
    description: 'Tests the full legal-compliance assurance loop, from identifying an obligation to closing out any gap found.',
    standardIds: 'combined',
    steps: [
      { standardId: 'iso14001', clauseNumber: '6.1.3', note: 'Select a compliance obligation (permit condition, statutory duty).' },
      { standardId: 'iso14001', clauseNumber: '8.1', note: 'Verify the operational control implementing that obligation.' },
      { standardId: 'iso14001', clauseNumber: '9.1.2', note: 'Confirm compliance evaluation evidence exists and is current.' },
      { standardId: 'iso14001', clauseNumber: '10.2', note: 'If non-compliance was found, verify corrective action was proportionate and effective.' }
    ]
  },
  {
    id: 'trail-management-of-change',
    name: 'Context/Risk Trigger → Management of Change → Competence → Operational Control → Monitoring',
    description: 'Tests whether organizational, process or workforce change is properly risk-assessed before implementation and correctly reflected in controls and competence afterward.',
    standardIds: 'combined',
    steps: [
      { standardId: 'iso14001', clauseNumber: '6.3', note: 'Identify a recent or planned change.' },
      { standardId: 'iso45001', clauseNumber: '8.1.3', note: 'Confirm OH&S management of change assessment occurred before implementation.' },
      { standardId: 'iso14001', clauseNumber: '6.1.2', note: 'Confirm aspects/hazards were reassessed for the change.' },
      { standardId: 'iso14001', clauseNumber: '7.2', note: 'Confirm competence was updated for anyone affected by the change.' },
      { standardId: 'iso14001', clauseNumber: '8.1', note: 'Confirm operational controls reflect the post-change state.' }
    ]
  },
  {
    id: 'trail-worker-participation',
    name: 'Worker Consultation → Risk Assessment Input → Objective Setting → Audit Programme → Incident Investigation',
    description: 'Tests whether the participatory requirements of ISO 45001 are substantively met across the whole management system, not only via a token committee.',
    standardIds: ['iso45001'],
    steps: [
      { standardId: 'iso45001', clauseNumber: '5.4', note: 'Confirm consultation/participation mechanisms exist and are resourced.' },
      { standardId: 'iso45001', clauseNumber: '6.1.2.1', note: 'Verify non-managerial workers participated in hazard identification.' },
      { standardId: 'iso45001', clauseNumber: '6.2.1', note: 'Verify objectives reflect consultation results.' },
      { standardId: 'iso45001', clauseNumber: '9.2.2', note: 'Verify workers were consulted on the audit programme and results reached them.' },
      { standardId: 'iso45001', clauseNumber: '10.2', note: 'Verify workers participated in incident investigation.' }
    ]
  },
  {
    id: 'trail-emergency-preparedness',
    name: 'Emergency Identification → Response Plan → Training → Testing → Review & Revision',
    description: 'Confirms the emergency preparedness cycle is a living process, not a static document.',
    standardIds: 'combined',
    steps: [
      { standardId: 'iso14001', clauseNumber: '6.1.2', note: 'Confirm the potential emergency was identified.' },
      { standardId: 'iso14001', clauseNumber: '8.2', note: 'Verify a response plan exists.' },
      { standardId: 'iso45001', clauseNumber: '8.2', note: 'Verify training and communication of duties to workers/contractors/authorities.' },
      { standardId: 'iso14001', clauseNumber: '8.2', note: 'Confirm periodic testing occurred.' },
      { standardId: 'iso14001', clauseNumber: '10.2', note: 'Confirm the plan was reviewed/revised after any real event or test.' }
    ]
  }
]
