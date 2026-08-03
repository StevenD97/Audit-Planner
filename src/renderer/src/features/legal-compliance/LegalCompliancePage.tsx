import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { newId } from '@shared/id'
import { computeComplianceSummary } from '@shared/engine/compliance'
import type {
  Legislation,
  LegislationCategory,
  ComplianceObligation,
  ComplianceEvaluation,
  ComplianceEvaluationStatus
} from '@shared/types'
import { EmptyState, TagListEditor, ClausePicker, ClauseLinkList } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const CATEGORY_LABELS: Record<LegislationCategory, string> = {
  environmental: 'Environmental',
  ohs: 'Health & Safety',
  permit: 'Permit condition',
  corporate: 'Corporate requirement'
}

const STATUS_LABELS: Record<ComplianceEvaluationStatus, string> = {
  compliant: 'Compliant',
  non_compliant: 'Non-compliant',
  partial: 'Partial',
  not_evaluated: 'Not evaluated'
}

const STATUS_STYLES: Record<ComplianceEvaluationStatus, string> = {
  compliant: 'bg-status-conforms/10 text-status-conforms',
  non_compliant: 'bg-status-major/10 text-status-major',
  partial: 'bg-status-ofi/10 text-status-ofi',
  not_evaluated: 'bg-status-pending/10 text-status-pending'
}

function nowIso(): string {
  return new Date().toISOString()
}

export default function LegalCompliancePage(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)
  const removeEntity = useWorkspaceStore((s) => s.removeEntity)

  const legislationList = workspace?.legislation ?? []
  const obligations = workspace?.complianceObligations ?? []
  const evaluations = workspace?.complianceEvaluations ?? []

  const [params] = useSearchParams()
  const legislationIdFromUrl = params.get('legislation')
  const [selectedLegislationId, setSelectedLegislationId] = useState<string | null>(legislationIdFromUrl)
  const [newLegTitle, setNewLegTitle] = useState('')
  const [newLegCategory, setNewLegCategory] = useState<LegislationCategory>('environmental')

  useEffect(() => {
    if (legislationIdFromUrl) setSelectedLegislationId(legislationIdFromUrl)
  }, [legislationIdFromUrl])

  const summary = computeComplianceSummary(obligations, evaluations)
  const legislationObligations = obligations.filter((o) => o.legislationId === selectedLegislationId)
  const latestEvaluationByObligation = new Map<string, ComplianceEvaluation>()
  for (const ev of evaluations) {
    const existing = latestEvaluationByObligation.get(ev.obligationId)
    if (!existing || ev.evaluatedAt > existing.evaluatedAt) latestEvaluationByObligation.set(ev.obligationId, ev)
  }
  const overdueIds = new Set(summary.overdue.map((o) => o.obligationId))

  async function addLegislation(): Promise<void> {
    if (!newLegTitle.trim()) return
    const leg: Legislation = { id: newId(), title: newLegTitle.trim(), category: newLegCategory }
    await upsertEntity('legislation', {}, leg)
    setSelectedLegislationId(leg.id)
    setNewLegTitle('')
  }

  async function addObligation(): Promise<void> {
    if (!selectedLegislationId) return
    const obligation: ComplianceObligation = {
      id: newId(),
      legislationId: selectedLegislationId,
      description: 'New compliance obligation',
      requirements: [],
      clauseIds: []
    }
    await upsertEntity('compliance_obligations', { legislationId: selectedLegislationId }, obligation)
  }

  async function updateObligation(obligation: ComplianceObligation, patch: Partial<ComplianceObligation>): Promise<void> {
    await upsertEntity('compliance_obligations', { legislationId: obligation.legislationId }, { ...obligation, ...patch })
  }

  async function recordEvaluation(obligation: ComplianceObligation, status: ComplianceEvaluationStatus): Promise<void> {
    const evaluation: ComplianceEvaluation = {
      id: newId(),
      obligationId: obligation.id,
      status,
      evaluatedAt: nowIso()
    }
    await upsertEntity('compliance_evaluations', { obligationId: obligation.id }, evaluation)
  }

  if (!workspace) return <EmptyState title="Loading…" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Legal &amp; Compliance</h1>
      <p className="text-sm text-slate-500">
        Track legislation, compliance obligations and permit conditions, evaluate compliance over time, and link each
        obligation to the ISO clauses it affects.
      </p>

      <div className="card flex flex-wrap items-center gap-6">
        <div>
          <p className="text-sm text-slate-500">Compliant</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{summary.compliantPct}%</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Non-compliant</p>
          <p className="text-2xl font-bold text-status-major">{summary.counts.non_compliant}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Overdue reviews</p>
          <p className="text-2xl font-bold text-status-ofi">{summary.overdue.length}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Not yet evaluated</p>
          <p className="text-2xl font-bold">{summary.counts.not_evaluated}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card max-h-[70vh] overflow-y-auto">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Legislation</p>
          {legislationList.length === 0 ? (
            <p className="text-xs text-slate-400">None yet — add one below.</p>
          ) : (
            <ul className="mb-3 space-y-0.5">
              {legislationList.map((leg) => (
                <li key={leg.id}>
                  <button
                    className={`w-full rounded px-2 py-1 text-left text-sm ${
                      selectedLegislationId === leg.id
                        ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setSelectedLegislationId(leg.id)}
                  >
                    {leg.title}
                    <span className="ml-1 text-xs text-slate-400">({CATEGORY_LABELS[leg.category]})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
            <input
              className="input py-1 text-xs"
              placeholder="New legislation title…"
              value={newLegTitle}
              onChange={(e) => setNewLegTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLegislation()}
            />
            <select
              className="input py-1 text-xs"
              value={newLegCategory}
              onChange={(e) => setNewLegCategory(e.target.value as LegislationCategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn-secondary w-full justify-center text-xs" onClick={addLegislation}>
              + Add legislation
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {!selectedLegislationId ? (
            <EmptyState
              title="No legislation selected"
              hint="Select an item on the left, or add a new piece of legislation to get started."
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Obligations</h2>
                <button className="btn-secondary text-xs" onClick={addObligation}>
                  + Add obligation
                </button>
              </div>
              {legislationObligations.length === 0 ? (
                <p className="text-sm text-slate-400">No obligations recorded under this legislation yet.</p>
              ) : (
                legislationObligations.map((obligation) => {
                  const latest = latestEvaluationByObligation.get(obligation.id)
                  const status = latest?.status ?? 'not_evaluated'
                  const isOverdue = overdueIds.has(obligation.id)
                  return (
                    <div key={obligation.id} className="card space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <input
                          className="input flex-1 font-medium"
                          value={obligation.description}
                          onChange={(e) => updateObligation(obligation, { description: e.target.value })}
                        />
                        <span className={`chip ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
                      </div>

                      <TagListEditor
                        label="Requirements"
                        items={obligation.requirements}
                        onChange={(v) => updateObligation(obligation, { requirements: v })}
                      />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label className="text-xs text-slate-400">
                          Responsible person
                          <input
                            className="input mt-1"
                            value={obligation.responsiblePerson ?? ''}
                            onChange={(e) => updateObligation(obligation, { responsiblePerson: e.target.value })}
                          />
                        </label>
                        <label className="text-xs text-slate-400">
                          Review frequency (months)
                          <input
                            type="number"
                            min={1}
                            className="input mt-1"
                            value={obligation.reviewFrequencyMonths ?? ''}
                            onChange={(e) =>
                              updateObligation(obligation, { reviewFrequencyMonths: Number(e.target.value) || undefined })
                            }
                          />
                        </label>
                        <label className="text-xs text-slate-400">
                          Next review date
                          <input
                            type="date"
                            className={`input mt-1 ${isOverdue ? 'border-status-major text-status-major' : ''}`}
                            value={obligation.nextReviewAt?.slice(0, 10) ?? ''}
                            onChange={(e) =>
                              updateObligation(obligation, {
                                nextReviewAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                              })
                            }
                          />
                          {isOverdue && <span className="mt-1 block text-status-major">Overdue</span>}
                        </label>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Relevant ISO clauses</p>
                        <ClauseLinkList
                          clauseIds={obligation.clauseIds}
                          onRemove={(id) => updateObligation(obligation, { clauseIds: obligation.clauseIds.filter((c) => c !== id) })}
                        />
                        <div className="mt-1 max-w-sm">
                          <ClausePicker
                            onPick={(id) =>
                              !obligation.clauseIds.includes(id) &&
                              updateObligation(obligation, { clauseIds: [...obligation.clauseIds, id] })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                        <p className="text-xs font-semibold uppercase text-slate-400">Record evaluation:</p>
                        {(Object.keys(STATUS_LABELS) as ComplianceEvaluationStatus[])
                          .filter((s) => s !== 'not_evaluated')
                          .map((s) => (
                            <button key={s} className="btn-ghost text-xs" onClick={() => recordEvaluation(obligation, s)}>
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        <button
                          className="btn-ghost ml-auto text-xs text-status-major"
                          onClick={() => removeEntity('compliance_obligations', obligation.id)}
                        >
                          Remove obligation
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
