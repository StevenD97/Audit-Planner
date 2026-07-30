import { useMemo } from 'react'
import { AuditProjectPicker, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { buildAuditPlanDoc, buildScheduleDoc, buildPrepPackDoc, buildGapReportDoc } from './buildReports'
import type { ExportDocument } from '@shared/export'
import { getPlatformApi } from '../../platform'

export default function ReportingPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)

  const slots = useMemo(() => (workspace?.programmeSlots ?? []).filter((s) => s.auditProjectId === project?.id), [workspace, project])
  const checklist = useMemo(() => (workspace?.checklistItems ?? []).filter((c) => c.auditProjectId === project?.id), [workspace, project])
  const evidence = useMemo(() => (workspace?.evidencePlanItems ?? []).filter((e) => e.auditProjectId === project?.id), [workspace, project])
  const gapAssessments = useMemo(() => (workspace?.gapAssessments ?? []).filter((g) => g.auditProjectId === project?.id), [workspace, project])

  if (!project) return <AuditProjectPicker />

  const reports: { title: string; description: string; build: () => ExportDocument; fileBase: string }[] = [
    {
      title: 'Audit Plan',
      description: 'Scope, sites, departments, dates and audit team.',
      build: () => buildAuditPlanDoc(project),
      fileBase: `${project.name}-Audit-Plan`
    },
    {
      title: 'Audit Schedule',
      description: 'The full day-by-day programme.',
      build: () => buildScheduleDoc(project, slots),
      fileBase: `${project.name}-Schedule`
    },
    {
      title: 'Audit Preparation Pack',
      description: 'Plan + schedule + checklist + evidence plan bundled together.',
      build: () => buildPrepPackDoc(project, slots, checklist, evidence),
      fileBase: `${project.name}-Prep-Pack`
    },
    {
      title: 'Gap Assessment Report',
      description: 'Readiness %, high-risk gaps, recommended actions and full clause ratings.',
      build: () => buildGapReportDoc(project, gapAssessments),
      fileBase: `${project.name}-Gap-Report`
    }
  ]

  async function exportAs(format: 'xlsx' | 'pdf', build: () => ExportDocument, fileBase: string): Promise<void> {
    const doc = build()
    await getPlatformApi().exportDocument(format, doc, fileBase.replace(/[^a-z0-9-_ ]/gi, ''))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reporting</h1>
      <AuditProjectPicker />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <div key={r.title} className="card">
            <h2 className="text-lg font-semibold">{r.title}</h2>
            <p className="mb-4 text-sm text-slate-500">{r.description}</p>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => exportAs('xlsx', r.build, r.fileBase)}>
                Export to Excel
              </button>
              <button className="btn-secondary" onClick={() => exportAs('pdf', r.build, r.fileBase)}>
                Export to PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
