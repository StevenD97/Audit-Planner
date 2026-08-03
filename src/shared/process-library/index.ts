import type { RiskCategory } from '../types'

/**
 * Seeded, read-only starter processes — the same "seeded reference data the
 * user edits rather than starts from nothing" principle already used for
 * the ISO clause knowledge base (docs/UI_DESIGN.md principle #1), applied
 * to the new process-centric model (docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md
 * §5) so the Process Explorer isn't an empty, intimidating screen on first
 * use. "Adopting" a library process clones it (new ids for the process and
 * every risk/control) into a chosen Function in the workspace; the library
 * itself is never mutated.
 */

export interface LibraryControl {
  description: string
  controlType?: string
  clauseIds: string[]
}

export interface LibraryRisk {
  category: RiskCategory
  description: string
  likelihood: 1 | 2 | 3 | 4 | 5
  severity: 1 | 2 | 3 | 4 | 5
  controls: LibraryControl[]
}

export interface LibraryProcess {
  libraryId: string
  name: string
  description: string
  inputs: string[]
  activities: string[]
  outputs: string[]
  kpis: string[]
  clauseIds: string[]
  risks: LibraryRisk[]
}

export const PROCESS_LIBRARY: LibraryProcess[] = [
  {
    libraryId: 'permit-to-work',
    name: 'Permit to Work',
    description: 'Authorisation and control of high-risk work (hot work, confined space, isolation/LOTO, working at height).',
    inputs: ['Work request', 'Hazard identification', 'Risk assessment'],
    activities: ['Risk assessment', 'Permit issuance', 'Isolation/LOTO', 'Work execution', 'Permit closure'],
    outputs: ['Completed permit record', 'Incident-free work completion'],
    kpis: ['% permits closed on time', 'Permit non-conformance rate'],
    clauseIds: ['iso45001-8.1.2', 'iso45001-8.1.3'],
    risks: [
      {
        category: 'ohs_hazard',
        description: 'Uncontrolled release of stored energy during isolation work',
        likelihood: 2,
        severity: 5,
        controls: [
          { description: 'Lock-out/tag-out procedure with independent verification', clauseIds: ['iso45001-8.1.2'] },
          { description: 'Permit sign-off restricted to a competent, authorised person', clauseIds: ['iso45001-7.2'] }
        ]
      },
      {
        category: 'ohs_hazard',
        description: 'Work commences without a valid, current permit',
        likelihood: 3,
        severity: 4,
        controls: [{ description: 'Site access control linked to an active permit register', clauseIds: ['iso45001-8.1.1'] }]
      }
    ]
  },
  {
    libraryId: 'waste-management',
    name: 'Waste Management',
    description: 'Segregation, storage, transfer and licensed disposal of waste streams.',
    inputs: ['Waste generation points', 'Waste classification', 'Contractor licences'],
    activities: ['Segregation', 'Storage', 'Transfer note completion', 'Licensed disposal'],
    outputs: ['Waste transfer records', 'Compliance evidence'],
    kpis: ['% waste diverted from landfill', 'Non-conformances on transfer notes'],
    clauseIds: ['iso14001-8.1', 'iso14001-6.1.3', 'iso14001-9.1.2'],
    risks: [
      {
        category: 'environmental_aspect',
        description: 'Hazardous waste mixed with general waste at source',
        likelihood: 3,
        severity: 4,
        controls: [
          { description: 'Colour-coded segregation points with staff training', clauseIds: ['iso14001-7.2'] },
          { description: 'Waste contractor licence verification before collection', clauseIds: ['iso14001-8.1'] }
        ]
      },
      {
        category: 'compliance',
        description: 'Waste carrier operates on an expired licence',
        likelihood: 2,
        severity: 4,
        controls: [{ description: 'Annual licence verification register', clauseIds: ['iso14001-9.1.2'] }]
      }
    ]
  },
  {
    libraryId: 'incident-management',
    name: 'Incident Management & Investigation',
    description: 'Reporting, investigation, root cause analysis and corrective action for incidents and near misses.',
    inputs: ['Incident report', 'Witness statements'],
    activities: ['Immediate response', 'Investigation', 'Root cause analysis', 'Corrective action'],
    outputs: ['Investigation report', 'Corrective actions'],
    kpis: ['Lost time injury frequency rate', 'Time to close investigations', 'Repeat incident rate'],
    clauseIds: ['iso45001-10.1', 'iso45001-10.2'],
    risks: [
      {
        category: 'ohs_hazard',
        description: 'Incidents and near misses go under-reported',
        likelihood: 3,
        severity: 3,
        controls: [
          { description: 'No-blame near-miss reporting channel', clauseIds: ['iso45001-5.4'] },
          { description: 'Management review of incident/near-miss trends', clauseIds: ['iso45001-9.3'] }
        ]
      },
      {
        category: 'ohs_hazard',
        description: 'An incident recurs because the prior corrective action was ineffective',
        likelihood: 2,
        severity: 4,
        controls: [{ description: 'Corrective action effectiveness verified before closure', clauseIds: ['iso45001-10.2'] }]
      }
    ]
  },
  {
    libraryId: 'contractor-management',
    name: 'Contractor Management',
    description: 'Pre-qualification, induction, supervision and performance review of contractors.',
    inputs: ['Contractor pre-qualification', 'RAMS', 'Induction records'],
    activities: ['Pre-qualification', 'Induction', 'Supervision', 'Performance review'],
    outputs: ['Approved contractor list', 'RAMS approvals'],
    kpis: ['% contractors inducted before site access', 'Contractor incident rate'],
    clauseIds: ['iso45001-8.1.4', 'iso14001-8.1'],
    risks: [
      {
        category: 'ohs_hazard',
        description: 'An un-inducted contractor gains site access',
        likelihood: 2,
        severity: 4,
        controls: [{ description: 'Site access system gated on induction completion', clauseIds: ['iso45001-8.1.4'] }]
      },
      {
        category: 'compliance',
        description: 'RAMS not reviewed/approved before work starts',
        likelihood: 3,
        severity: 3,
        controls: [{ description: 'RAMS approval checklist gating work authorisation', clauseIds: ['iso45001-8.1.4'] }]
      }
    ]
  },
  {
    libraryId: 'emergency-preparedness',
    name: 'Emergency Preparedness & Response',
    description: 'Planning, drilling and equipment readiness for foreseeable emergency scenarios.',
    inputs: ['Emergency scenarios', 'Response plans', 'Drill schedule'],
    activities: ['Scenario planning', 'Drills', 'Equipment checks', 'Plan review'],
    outputs: ['Drill records', 'Updated response plans'],
    kpis: ['Drill completion rate', 'Response time achieved in drills'],
    clauseIds: ['iso45001-8.2', 'iso14001-8.2'],
    risks: [
      {
        category: 'ohs_hazard',
        description: 'A response plan is untested — no drill has been performed',
        likelihood: 3,
        severity: 4,
        controls: [{ description: 'Annual drill schedule with completion tracking', clauseIds: ['iso45001-8.2'] }]
      },
      {
        category: 'environmental_aspect',
        description: 'Spill response equipment is missing or expired',
        likelihood: 2,
        severity: 4,
        controls: [{ description: 'Spill kit inspection register', clauseIds: ['iso14001-8.2'] }]
      }
    ]
  },
  {
    libraryId: 'training-competence',
    name: 'Training & Competence Management',
    description: 'Identifying, delivering and verifying the competence required for each role.',
    inputs: ['Role competence requirements', 'Training needs analysis'],
    activities: ['Induction training', 'Refresher training', 'Competence verification'],
    outputs: ['Training records', 'Competence matrix'],
    kpis: ['% roles with current competence', 'Overdue training %'],
    clauseIds: ['iso14001-7.2', 'iso45001-7.2'],
    risks: [
      {
        category: 'compliance',
        description: 'A worker performs a task requiring certification/competence they do not hold',
        likelihood: 3,
        severity: 4,
        controls: [{ description: 'Competence matrix gates task assignment', clauseIds: ['iso45001-7.2'] }]
      },
      {
        category: 'business',
        description: 'Training records fall out of date and go unnoticed',
        likelihood: 2,
        severity: 2,
        controls: [{ description: 'Automated training-expiry alerts', clauseIds: ['iso14001-7.2'] }]
      }
    ]
  },
  {
    libraryId: 'management-review',
    name: 'Management Review',
    description: 'Top management review of EMS/OH&S performance, suitability and continuing adequacy.',
    inputs: ['Audit results', 'Incident trends', 'Compliance evaluation results', 'Objectives performance'],
    activities: ['Data compilation', 'Review meeting', 'Decision/action tracking'],
    outputs: ['Management review minutes', 'Actions'],
    kpis: ['% management review actions closed on time'],
    clauseIds: ['iso14001-9.3', 'iso45001-9.3'],
    risks: [
      {
        category: 'business',
        description: 'Management review is superficial and misses required inputs',
        likelihood: 2,
        severity: 3,
        controls: [{ description: 'Standard review agenda covering every required input', clauseIds: ['iso14001-9.3.2', 'iso45001-9.3'] }]
      }
    ]
  },
  {
    libraryId: 'legal-compliance',
    name: 'Legal & Compliance Obligations Management',
    description: 'Identifying, tracking and evaluating compliance with legal and other obligations, including permit conditions.',
    inputs: ['Legal register', 'Regulatory updates', 'Permit conditions'],
    activities: ['Obligation identification', 'Compliance evaluation', 'Permit renewal tracking'],
    outputs: ['Compliance evaluation records', 'Updated legal register'],
    kpis: ['% obligations evaluated on schedule', 'Overdue permit renewals'],
    clauseIds: ['iso14001-6.1.3', 'iso14001-9.1.2', 'iso45001-6.1.3', 'iso45001-9.1.2'],
    risks: [
      {
        category: 'compliance',
        description: 'The legal register is not updated after a regulatory change',
        likelihood: 2,
        severity: 4,
        controls: [{ description: 'Scheduled legal register review with a named responsible person', clauseIds: ['iso14001-6.1.3'] }]
      },
      {
        category: 'compliance',
        description: 'A permit condition is breached without detection',
        likelihood: 2,
        severity: 5,
        controls: [{ description: 'Permit condition compliance checklist reviewed at a defined frequency', clauseIds: ['iso14001-9.1.2'] }]
      }
    ]
  },
  {
    libraryId: 'change-management',
    name: 'Management of Change',
    description: 'Risk-assessing and approving temporary or permanent changes before they are implemented.',
    inputs: ['Proposed change', 'Change risk screening'],
    activities: ['Change risk assessment', 'Approval', 'Implementation', 'Post-change review'],
    outputs: ['Change records', 'Updated risk assessments/procedures'],
    kpis: ['% changes risk-assessed before implementation'],
    clauseIds: ['iso45001-8.1.3', 'iso14001-8.1'],
    risks: [
      {
        category: 'ohs_hazard',
        description: 'A process, equipment or organisational change is implemented without a risk assessment',
        likelihood: 2,
        severity: 4,
        controls: [{ description: 'Management-of-change approval gate before implementation', clauseIds: ['iso45001-8.1.3'] }]
      }
    ]
  },
  {
    libraryId: 'monitoring-measurement',
    name: 'Monitoring, Measurement, Analysis & Evaluation',
    description: 'Scheduled monitoring, calibration and trend analysis of environmental and OH&S performance data.',
    inputs: ['Monitoring plan', 'Calibration schedule', 'Performance data'],
    activities: ['Data collection', 'Calibration', 'Trend analysis', 'Reporting'],
    outputs: ['Monitoring reports', 'Calibration records'],
    kpis: ['% monitoring completed on schedule', 'Calibration compliance %'],
    clauseIds: ['iso14001-9.1.1', 'iso45001-9.1.1'],
    risks: [
      {
        category: 'business',
        description: 'Monitoring equipment is out of calibration',
        likelihood: 2,
        severity: 3,
        controls: [{ description: 'Calibration register with due-date alerts', clauseIds: ['iso14001-9.1.1'] }]
      },
      {
        category: 'business',
        description: 'Monitoring data is collected but never analysed or trended',
        likelihood: 3,
        severity: 2,
        controls: [{ description: 'Scheduled trend-analysis review feeding management review', clauseIds: ['iso45001-9.1.1'] }]
      }
    ]
  }
]
