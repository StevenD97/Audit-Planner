import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BuildingOwnership, GapRating, RiskLevel } from '@shared/types'
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

/** Small "?" button that reveals a text hint on hover — used for evidence
 * examples next to a question, without needing a modal or extra click. */
export function HelpTooltip({ text, label = 'Evidence example' }: { text: string; label?: string }): JSX.Element {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500 hover:border-brand-500 hover:text-brand-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-brand-400 dark:hover:text-brand-400"
        aria-label={label}
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 p-2 text-left text-xs font-normal normal-case leading-relaxed text-white shadow-lg group-hover:block dark:bg-slate-700"
      >
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        {text}
      </span>
    </span>
  )
}

const OWNERSHIP_LABELS: Record<BuildingOwnership, string> = {
  owned: 'Owned outright',
  leased: 'Leased',
  multi_tenant: 'Multi-tenant / shared building'
}

/** Compact reference card showing the organisation's own facts (set once on
 * the Organisation Profile page) — shown alongside generic evidence
 * examples and recommendations so they can be read against what's actually
 * true here, not a generic office. Self-contained: reads the workspace
 * directly, so it can be dropped into any screen with no props. */
export function OrganisationContextSummary(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const context = workspace?.organisationContext[0]

  const hasContent =
    context &&
    (context.organisationName ||
      context.sector ||
      context.buildingOwnership ||
      context.approximateHeadcount ||
      context.numberOfFloors ||
      context.notableFacilities.length > 0 ||
      context.keyContractors.length > 0 ||
      context.additionalContext)

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
        <Link to="/organisation" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Add your organisation profile
        </Link>{' '}
        to see your own facts alongside these examples and recommendations.
      </div>
    )
  }

  const headline = [
    context.organisationName,
    context.sector,
    context.buildingOwnership && OWNERSHIP_LABELS[context.buildingOwnership],
    context.approximateHeadcount && `~${context.approximateHeadcount} staff`,
    context.numberOfFloors && `${context.numberOfFloors} floor(s)/site(s)`
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3 text-xs dark:border-brand-800 dark:bg-brand-900/10">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">Your organisation</p>
        <Link to="/organisation" className="text-brand-600 hover:underline dark:text-brand-400">
          Edit →
        </Link>
      </div>
      {headline && <p className="text-slate-600 dark:text-slate-300">{headline}</p>}
      {context.notableFacilities.length > 0 && (
        <p className="mt-1 text-slate-500 dark:text-slate-400">Facilities: {context.notableFacilities.join(', ')}</p>
      )}
      {context.keyContractors.length > 0 && (
        <p className="mt-1 text-slate-500 dark:text-slate-400">Contractors: {context.keyContractors.join(', ')}</p>
      )}
      {context.additionalContext && <p className="mt-1 italic text-slate-500 dark:text-slate-400">{context.additionalContext}</p>}
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
