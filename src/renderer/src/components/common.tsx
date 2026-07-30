import { Link } from 'react-router-dom'
import type { GapRating, RiskLevel } from '@shared/types'
import { useWorkspaceStore } from '../store/workspaceStore'

const RATING_STYLES: Record<GapRating, string> = {
  conforms: 'bg-status-conforms/10 text-status-conforms',
  ofi: 'bg-status-ofi/10 text-status-ofi',
  minor_nc: 'bg-status-minor/10 text-status-minor',
  major_nc: 'bg-status-major/10 text-status-major',
  not_assessed: 'bg-status-pending/10 text-status-pending'
}
const RATING_LABELS: Record<GapRating, string> = {
  conforms: 'Conforms',
  ofi: 'OFI',
  minor_nc: 'Minor NC',
  major_nc: 'Major NC',
  not_assessed: 'Not assessed'
}

export function RatingBadge({ rating }: { rating: GapRating }): JSX.Element {
  return <span className={`chip ${RATING_STYLES[rating]}`}>{RATING_LABELS[rating]}</span>
}

const RISK_STYLES: Record<RiskLevel, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  medium: 'bg-status-ofi/10 text-status-ofi',
  high: 'bg-status-major/10 text-status-major'
}

export function RiskBadge({ level }: { level: RiskLevel }): JSX.Element {
  return <span className={`chip ${RISK_STYLES[level]}`}>{level.toUpperCase()} risk</span>
}

export function ClauseChip({
  standardId,
  clauseNumber,
  title
}: {
  standardId: string
  clauseNumber: string
  title?: string
}): JSX.Element {
  return (
    <Link
      to={`/clauses?standard=${standardId}&clause=${encodeURIComponent(clauseNumber)}`}
      className="chip border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300"
      title={title}
    >
      {standardId === 'iso14001' ? '14001' : '45001'} §{clauseNumber}
    </Link>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: JSX.Element }): JSX.Element {
  return (
    <div className="card flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {hint && <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      {action}
    </div>
  )
}

export function useCurrentAuditProject() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const currentAuditProjectId = useWorkspaceStore((s) => s.currentAuditProjectId)
  const project = workspace?.auditProjects.find((p) => p.id === currentAuditProjectId) ?? null
  return project
}

export function AuditProjectPicker(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const currentAuditProjectId = useWorkspaceStore((s) => s.currentAuditProjectId)
  const setCurrentAuditProject = useWorkspaceStore((s) => s.setCurrentAuditProject)

  if (!workspace || workspace.auditProjects.length === 0) {
    return (
      <EmptyState
        title="No audit projects yet"
        hint="Create your first audit in the Audit Planner to unlock this module."
        action={
          <Link to="/planner" className="btn-primary">
            Go to Audit Planner
          </Link>
        }
      />
    )
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Audit project:</label>
      <select
        className="input max-w-sm"
        value={currentAuditProjectId ?? ''}
        onChange={(e) => setCurrentAuditProject(e.target.value || null)}
      >
        <option value="">Select an audit…</option>
        {workspace.auditProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.standards.join(' + ')}) — {p.status}
          </option>
        ))}
      </select>
    </div>
  )
}
