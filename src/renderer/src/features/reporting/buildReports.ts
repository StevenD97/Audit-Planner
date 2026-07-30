import { getAuditableClauses, getClauseById } from '@shared/knowledge-base'
import { computeReadiness } from '@shared/engine/scoring'
import type {
  AuditProject,
  ChecklistItem,
  EvidencePlanItem,
  GapAssessment,
  ProgrammeSlot
} from '@shared/types'
import type { ExportDocument } from '@shared/export'

function nowIso(): string {
  return new Date().toISOString()
}

export function buildAuditPlanDoc(project: AuditProject): ExportDocument {
  return {
    title: `Audit Plan — ${project.name}`,
    subtitle: `${project.standards.map((s) => (s === 'iso14001' ? 'ISO 14001' : 'ISO 45001')).join(' + ')} · ${project.auditType}`,
    generatedAt: nowIso(),
    sections: [
      {
        heading: 'Scope',
        paragraphs: [project.scopeStatement || 'No scope statement recorded.']
      },
      {
        heading: 'Logistics',
        paragraphs: [
          `Lead auditor: ${project.leadAuditor ?? 'Not assigned'}`,
          `Dates: ${project.startDate ?? 'TBC'} (${project.durationDays ?? '?'} day(s))`,
          `Audit team: ${project.auditTeam.map((m) => `${m.name} (${m.role})`).join(', ') || 'Not assigned'}`
        ]
      },
      {
        heading: 'Sites',
        table: {
          title: 'Sites',
          columns: ['Site', 'Address'],
          rows: project.sites.map((s) => [s.name, s.address ?? ''])
        }
      },
      {
        heading: 'Departments',
        table: {
          title: 'Departments',
          columns: ['Department', 'Site', 'Process owner'],
          rows: project.departments.map((d) => [
            d.name,
            project.sites.find((s) => s.id === d.siteId)?.name ?? '',
            d.processOwner ?? ''
          ])
        }
      }
    ]
  }
}

export function buildScheduleDoc(project: AuditProject, slots: ProgrammeSlot[]): ExportDocument {
  const rows = [...slots]
    .sort((a, b) => a.dayNumber - b.dayNumber || a.startTime.localeCompare(b.startTime))
    .map((slot) => {
      const clauseLabel = slot.clauseIds
        .map((id) => getClauseById(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .map((c) => `${c.clauseNumber} ${c.title}`)
        .join('; ')
      return [
        `Day ${slot.dayNumber}`,
        `${slot.startTime}-${slot.endTime}`,
        slot.activityType.replace('_', ' '),
        clauseLabel,
        slot.processOwner ?? '',
        slot.location ?? ''
      ]
    })
  return {
    title: `Audit Schedule — ${project.name}`,
    generatedAt: nowIso(),
    sections: [
      {
        heading: 'Schedule',
        table: { title: 'Schedule', columns: ['Day', 'Time', 'Activity', 'Clauses', 'Process owner', 'Location'], rows }
      }
    ]
  }
}

export function buildPrepPackDoc(
  project: AuditProject,
  slots: ProgrammeSlot[],
  checklist: ChecklistItem[],
  evidence: EvidencePlanItem[]
): ExportDocument {
  const plan = buildAuditPlanDoc(project)
  const schedule = buildScheduleDoc(project, slots)
  return {
    title: `Audit Preparation Pack — ${project.name}`,
    generatedAt: nowIso(),
    sections: [
      ...plan.sections,
      ...schedule.sections,
      {
        heading: 'Checklist',
        table: {
          title: 'Checklist',
          columns: ['Clause', 'Question', 'Risk', 'Status'],
          rows: checklist.map((c) => {
            const clause = getClauseById(c.clauseId)
            return [clause ? `${clause.clauseNumber} ${clause.title}` : '', c.question, c.riskLevel, c.status]
          })
        }
      },
      {
        heading: 'Evidence plan',
        table: {
          title: 'Evidence plan',
          columns: ['Clause', 'Evidence', 'Category', 'Status'],
          rows: evidence.map((e) => {
            const clause = getClauseById(e.clauseId)
            return [clause ? `${clause.clauseNumber} ${clause.title}` : '', e.description, e.category, e.status]
          })
        }
      }
    ]
  }
}

export function buildGapReportDoc(project: AuditProject, gapAssessments: GapAssessment[]): ExportDocument {
  const clauses = project.standards.flatMap((s) => getAuditableClauses(s))
  const readiness = computeReadiness(clauses, gapAssessments)
  const byClause = new Map(gapAssessments.map((g) => [g.clauseId, g]))
  return {
    title: `Gap Assessment Report — ${project.name}`,
    subtitle: `Overall readiness: ${readiness.overallPct}%`,
    generatedAt: nowIso(),
    sections: [
      {
        heading: 'High-risk gaps',
        paragraphs: readiness.highRiskGaps.length ? readiness.highRiskGaps.map((g) => g.reason) : ['None recorded.']
      },
      {
        heading: 'Recommended actions',
        paragraphs: readiness.recommendedActions.length ? readiness.recommendedActions : ['None recorded.']
      },
      {
        heading: 'Full clause assessment',
        table: {
          title: 'Gap assessment',
          columns: ['Clause', 'Rating', 'Narrative', 'Recommended action', 'Risk'],
          rows: clauses.map((c) => {
            const ga = byClause.get(c.id)
            return [
              `${c.clauseNumber} ${c.title}`,
              ga?.rating ?? 'not_assessed',
              ga?.narrative ?? '',
              ga?.recommendedAction ?? '',
              ga?.riskRating ?? ''
            ]
          })
        }
      }
    ]
  }
}
