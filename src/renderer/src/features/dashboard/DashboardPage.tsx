import { Link, useNavigate } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { getAuditableClauses } from '@shared/knowledge-base'
import { computeReadiness } from '@shared/engine/scoring'
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
  const navigate = useNavigate()

  const projects = workspace?.auditProjects ?? []
  const gapAssessments = workspace?.gapAssessments ?? []
  const checklistItems = workspace?.checklistItems ?? []
  const evidenceItems = workspace?.evidencePlanItems ?? []

  const upcoming = [...projects]
    .filter((p) => p.status !== 'closed')
    .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))
    .slice(0, 3)

  const mostImminent = upcoming[0]
  const imminentReadiness = mostImminent ? readinessFor(mostImminent, gapAssessments) : null

  async function quickNewAudit(): Promise<void> {
    const project = await createAuditProject({ name: 'Untitled Audit' })
    navigate(`/planner?project=${project.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={quickNewAudit}>
            + New Audit
          </button>
          <Link to="/reporting" className="btn-secondary">
            Generate Prep Pack
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Upcoming audits</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming audits. Create one from the Audit Planner.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((p) => {
                const r = readinessFor(p, gapAssessments)
                return (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-700">
                    <div>
                      <p className="font-medium">{p.name}</p>
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
        background: `conic-gradient(#0f766e ${angle}deg, #e2e8f0 ${angle}deg)`
      }}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-xl font-bold dark:bg-slate-800">
        {pct}%
      </div>
    </div>
  )
}
