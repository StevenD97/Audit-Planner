import { Link, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { getAuditableClauses } from '@shared/knowledge-base'
import { computeReadiness } from '@shared/engine/scoring'
import { buildAuditDerivedEvents, getUpcomingEvents, mergeCalendarEvents, toIsoDate } from '@shared/engine/calendar'
import type { AuditProject, AuditProjectStatus, GapAssessment } from '@shared/types'

const STATUS_COLUMNS: { key: AuditProjectStatus; label: string }[] = [
  { key: 'planning', label: 'Planning' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'closed', label: 'Closed' }
]

function readinessFor(project: AuditProject, gapAssessments: GapAssessment[]) {
  const clauses = project.standards.flatMap((s) => getAuditableClauses(s))
  const gaps = gapAssessments.filter((g) => g.auditProjectId === project.id)
  return computeReadiness(clauses, gaps)
}

export default function DashboardPage(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const createAuditProject = useWorkspaceStore((s) => s.createAuditProject)
  const deleteAuditProject = useWorkspaceStore((s) => s.deleteAuditProject)
  const navigate = useNavigate()

  const projects = workspace?.auditProjects ?? []
  const gapAssessments = workspace?.gapAssessments ?? []
  const checklistItems = workspace?.checklistItems ?? []
  const evidenceItems = workspace?.evidencePlanItems ?? []

  const allAudits = [...projects].sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))
  const upcoming = allAudits.filter((p) => p.status !== 'closed')

  const mostImminent = upcoming[0]
  const imminentReadiness = mostImminent ? readinessFor(mostImminent, gapAssessments) : null

  const upcomingEvents = getUpcomingEvents(
    mergeCalendarEvents(workspace?.calendarEvents ?? [], buildAuditDerivedEvents(projects, workspace?.programmeSlots ?? [])),
    toIsoDate(new Date()),
    5
  )

  async function startAuditPlan(): Promise<void> {
    const project = await createAuditProject({ name: 'Untitled Audit' })
    navigate(`/wizard?project=${project.id}&step=context`)
  }

  async function deleteAudit(project: AuditProject): Promise<void> {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This permanently removes its findings, evidence, gap assessments, checklist items, and readiness snapshots. This can't be undone.`
    )
    if (confirmed) await deleteAuditProject(project.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={startAuditPlan}>
            Start Audit Plan
          </button>
          <Link to="/reporting" className="btn-secondary">
            Generate Prep Pack
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Your audits</h2>
          {allAudits.length === 0 ? (
            <p className="text-sm text-slate-500">No audits yet. Click &quot;Start Audit Plan&quot; above to begin.</p>
          ) : (
            <div className="space-y-3">
              {allAudits.map((p) => {
                const r = readinessFor(p, gapAssessments)
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-700">
                    <div>
                      <p className="font-medium">
                        {p.name}
                        {p.status === 'closed' && (
                          <span className="chip ml-2 bg-status-pending/10 text-status-pending">Closed</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.standards.join(' + ')} · {p.sites.map((s) => s.name).join(', ') || 'No sites set'} ·{' '}
                        {p.startDate ?? 'No date set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{r.overallPct}% ready</span>
                      <Link to={`/programme?project=${p.id}`} className="btn-secondary">
                        Open
                      </Link>
                      <button className="btn-ghost text-status-major hover:bg-status-major/10" onClick={() => deleteAudit(p)}>
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Readiness score</h2>
          {mostImminent && imminentReadiness ? (
            <div className="flex flex-col items-center">
              <ReadinessGauge pct={imminentReadiness.overallPct} />
              <p className="mt-2 text-sm text-slate-500">{mostImminent.name}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No active audit to score yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Audit status board</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {STATUS_COLUMNS.map((col) => {
            const count = projects.filter((p) => p.status === col.key).length
            return (
              <div key={col.key} className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-700">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{col.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming events</h2>
          <Link to="/calendar" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
            Open calendar →
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing on the calendar yet.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((e) => (
              <Link
                key={e.id}
                to={`/calendar?date=${e.date}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <span className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-slate-500">
                    {new Date(`${e.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span>{e.title}</span>
                </span>
                {!e.allDay && <span className="text-xs text-slate-400">{e.startTime}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard
          label="Checklist completion"
          value={pct(checklistItems.filter((c) => c.status !== 'pending').length, checklistItems.length)}
        />
        <MetricCard
          label="Evidence obtained"
          value={pct(evidenceItems.filter((e) => e.status === 'obtained').length, evidenceItems.length)}
        />
        <MetricCard
          label="Gap assessment coverage"
          value={pct(gapAssessments.filter((g) => g.rating !== 'not_assessed').length, gapAssessments.length)}
        />
      </div>
    </div>
  )
}

function pct(num: number, den: number): number {
  if (den === 0) return 0
  return Math.round((num / den) * 100)
}

function MetricCard({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-right text-sm font-semibold">{value}%</p>
    </div>
  )
}

function ReadinessGauge({ pct }: { pct: number }): JSX.Element {
  const angle = (pct / 100) * 360
  return (
    <div
      className="flex h-32 w-32 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#1F5FA8 ${angle}deg, #e2e8f0 ${angle}deg)`
      }}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-xl font-bold dark:bg-slate-800">
        {pct}%
      </div>
    </div>
  )
}
