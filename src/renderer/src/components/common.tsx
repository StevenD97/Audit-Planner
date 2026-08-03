import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { GapRating, RiskLevel } from '@shared/types'
import { searchClauses, getClauseById } from '@shared/knowledge-base'
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

/** Add/remove editor for a simple string list (process inputs/activities/outputs/kpis, obligation requirements, ...). */
export function TagListEditor({
  label,
  items,
  onChange
}: {
  label: string
  items: string[]
  onChange: (next: string[]) => void
}): JSX.Element {
  const [draft, setDraft] = useState('')
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">{label}</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="chip border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700">
            {item}
            <button className="ml-1 text-slate-400 hover:text-slate-600" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          className="input py-1 text-xs"
          placeholder={`Add ${label.toLowerCase()}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              onChange([...items, draft.trim()])
              setDraft('')
            }
          }}
        />
      </div>
    </div>
  )
}

/** Live-search input for linking an ISO clause by number/keyword — used anywhere a process, control or legal obligation links to clauses. */
export function ClausePicker({ onPick }: { onPick: (clauseId: string) => void }): JSX.Element {
  const [q, setQ] = useState('')
  const results = useMemo(() => (q.trim().length >= 2 ? searchClauses(q).slice(0, 8) : []), [q])
  return (
    <div className="relative">
      <input
        className="input py-1 text-xs"
        placeholder="Link a clause… (search by number or keyword)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {results.map((c) => (
            <li key={c.id}>
              <button
                className="w-full px-2 py-1 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => {
                  onPick(c.id)
                  setQ('')
                }}
              >
                {c.standardId === 'iso14001' ? '14001' : '45001'} §{c.clauseNumber} — {c.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Renders a set of linked clause ids as removable chips (via ClauseChip). */
export function ClauseLinkList({ clauseIds, onRemove }: { clauseIds: string[]; onRemove: (clauseId: string) => void }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {clauseIds.map((id) => {
        const clause = getClauseById(id)
        return (
          <span key={id} className="inline-flex items-center gap-1">
            <ClauseChip standardId={id.split('-')[0]} clauseNumber={clause?.clauseNumber ?? id} title={clause?.title} />
            <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => onRemove(id)}>
              ✕
            </button>
          </span>
        )
      })}
    </div>
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
        hint="Start an audit plan to unlock this module."
        action={
          <Link to="/wizard" className="btn-primary">
            Start Audit Plan
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
