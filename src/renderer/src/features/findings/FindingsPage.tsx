import { useMemo, useState } from 'react'
import { newId } from '@shared/id'
import { getClauseById } from '@shared/knowledge-base'
import {
  computeFindingsSummary,
  getRecurringFindings,
  computeClosureEffectiveness,
  isFindingOpen
} from '@shared/engine/findings'
import type {
  AuditFinding,
  FindingCategory,
  RootCauseAnalysis,
  RootCauseMethod,
  CorrectiveAction,
  CorrectiveActionStatus
} from '@shared/types'
import { AuditProjectPicker, useCurrentAuditProject, ClauseChip, ClausePicker, TagListEditor, EmptyState } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const CATEGORY_LABELS: Record<FindingCategory, string> = {
  observation: 'Observation',
  ofi: 'Opportunity for Improvement',
  minor_nc: 'Minor NC',
  major_nc: 'Major NC'
}

const CATEGORY_STYLES: Record<FindingCategory, string> = {
  observation: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  ofi: 'bg-status-ofi/10 text-status-ofi',
  minor_nc: 'bg-status-minor/10 text-status-minor',
  major_nc: 'bg-status-major/10 text-status-major'
}

const ACTION_STATUS_LABELS: Record<CorrectiveActionStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  verification_pending: 'Verification pending',
  closed: 'Closed'
}

const FISHBONE_CATEGORIES = ['People', 'Process', 'Equipment', 'Environment', 'Materials', 'Management']

function nowIso(): string {
  return new Date().toISOString()
}

export default function FindingsPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)
  const removeEntity = useWorkspaceStore((s) => s.removeEntity)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const allFindings = workspace?.auditFindings ?? []
  const allActions = workspace?.correctiveActions ?? []
  const allRootCauses = workspace?.rootCauseAnalyses ?? []
  const allProcesses = workspace?.processes ?? []

  const findings = useMemo(
    () => allFindings.filter((f) => f.auditProjectId === project?.id),
    [allFindings, project]
  )
  const findingIds = new Set(findings.map((f) => f.id))
  const actionsForProject = allActions.filter((a) => findingIds.has(a.findingId))

  if (!project) return <AuditProjectPicker />

  const summary = computeFindingsSummary(findings, actionsForProject)
  const closure = computeClosureEffectiveness(actionsForProject)
  const recurring = getRecurringFindings(allFindings) // across the whole workspace, deliberately not scoped to this audit

  async function addFinding(): Promise<void> {
    const finding: AuditFinding = {
      id: newId(),
      auditProjectId: project!.id,
      category: 'observation',
      description: 'New finding',
      raisedAt: nowIso()
    }
    await upsertEntity('audit_findings', { auditProjectId: project!.id }, finding)
    setExpandedId(finding.id)
  }

  async function updateFinding(finding: AuditFinding, patch: Partial<AuditFinding>): Promise<void> {
    await upsertEntity('audit_findings', { auditProjectId: finding.auditProjectId }, { ...finding, ...patch })
  }

  function rootCauseFor(findingId: string): RootCauseAnalysis | undefined {
    return allRootCauses.find((r) => r.findingId === findingId)
  }

  async function setRootCauseMethod(findingId: string, method: RootCauseMethod): Promise<void> {
    const existing = rootCauseFor(findingId)
    const rca: RootCauseAnalysis = existing
      ? { ...existing, method }
      : { id: newId(), findingId, method, whys: [], fishboneCategories: [], causalFactors: [], rootCauses: [] }
    await upsertEntity('root_cause_analyses', { findingId }, rca)
  }

  async function updateRootCause(rca: RootCauseAnalysis, patch: Partial<RootCauseAnalysis>): Promise<void> {
    await upsertEntity('root_cause_analyses', { findingId: rca.findingId }, { ...rca, ...patch })
  }

  function actionsFor(findingId: string): CorrectiveAction[] {
    return allActions.filter((a) => a.findingId === findingId)
  }

  async function addAction(findingId: string): Promise<void> {
    const action: CorrectiveAction = {
      id: newId(),
      findingId,
      description: 'New corrective action',
      owner: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'open'
    }
    await upsertEntity('corrective_actions', { findingId }, action)
  }

  async function updateAction(action: CorrectiveAction, patch: Partial<CorrectiveAction>): Promise<void> {
    const next = { ...action, ...patch }
    if (next.status === 'closed' && !next.closedAt) next.closedAt = nowIso()
    if (next.status !== 'closed') next.closedAt = undefined
    await upsertEntity('corrective_actions', { findingId: action.findingId }, next)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Findings &amp; Corrective Actions</h1>
        <button className="btn-primary" onClick={addFinding}>
          + Raise finding
        </button>
      </div>
      <AuditProjectPicker />

      <div className="card flex flex-wrap items-center gap-6">
        <div>
          <p className="text-sm text-slate-500">Open findings</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{summary.openCount}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Overdue actions</p>
          <p className="text-2xl font-bold text-status-major">{summary.overdueActions.length}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Closure rate</p>
          <p className="text-2xl font-bold">{closure.closureRatePct}%</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Closed on time</p>
          <p className="text-2xl font-bold">{closure.closedOnTimePct}%</p>
        </div>
      </div>

      {recurring.length > 0 && (
        <div className="card">
          <h2 className="mb-2 text-lg font-semibold">Recurring findings (across all audits in this workspace)</h2>
          <ul className="space-y-1 text-sm">
            {recurring.map((r) => {
              const label =
                r.kind === 'clause' ? (() => {
                  const c = getClauseById(r.id)
                  return c ? `§${c.clauseNumber} ${c.title}` : r.id
                })() : allProcesses.find((p) => p.id === r.id)?.name ?? r.id
              return (
                <li key={`${r.kind}:${r.id}`}>
                  <span className="font-medium">{label}</span> — {r.count} findings
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {findings.length === 0 ? (
        <EmptyState title="No findings raised yet" hint="Click &quot;Raise finding&quot; to start tracking one." />
      ) : (
        <div className="space-y-4">
          {findings.map((finding) => {
            const isOpen = isFindingOpen(finding, actionsForProject)
            const rca = rootCauseFor(finding.id)
            const expanded = expandedId === finding.id
            return (
              <div key={finding.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      className="input font-medium"
                      value={finding.description}
                      onChange={(e) => updateFinding(finding, { description: e.target.value })}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="input w-auto py-1 text-xs"
                        value={finding.category}
                        onChange={(e) => updateFinding(finding, { category: e.target.value as FindingCategory })}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <span className={`chip ${CATEGORY_STYLES[finding.category]}`}>{CATEGORY_LABELS[finding.category]}</span>
                      <span className={`chip ${isOpen ? 'bg-status-pending/10 text-status-pending' : 'bg-status-conforms/10 text-status-conforms'}`}>
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                      {finding.clauseId &&
                        (() => {
                          const c = getClauseById(finding.clauseId!)
                          return c ? <ClauseChip standardId={c.standardId} clauseNumber={c.clauseNumber} title={c.title} /> : null
                        })()}
                      <select
                        className="input w-auto py-1 text-xs"
                        value={finding.processId ?? ''}
                        onChange={(e) => updateFinding(finding, { processId: e.target.value || undefined })}
                      >
                        <option value="">No process linked</option>
                        {allProcesses.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!finding.clauseId && (
                      <div className="max-w-sm">
                        <ClausePicker onPick={(id) => updateFinding(finding, { clauseId: id })} />
                      </div>
                    )}
                  </div>
                  <button className="btn-ghost text-xs" onClick={() => setExpandedId(expanded ? null : finding.id)}>
                    {expanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {expanded && (
                  <>
                    <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Root cause analysis</p>
                      <select
                        className="input mb-2 w-auto py-1 text-xs"
                        value={rca?.method ?? ''}
                        onChange={(e) => setRootCauseMethod(finding.id, e.target.value as RootCauseMethod)}
                      >
                        <option value="">Choose a method…</option>
                        <option value="5_why">5 Why</option>
                        <option value="fishbone">Fishbone</option>
                        <option value="taproot">TapRooT-style</option>
                      </select>

                      {rca?.method === '5_why' && (
                        <TagListEditor label="Whys (in order)" items={rca.whys} onChange={(v) => updateRootCause(rca, { whys: v })} />
                      )}

                      {rca?.method === 'fishbone' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {FISHBONE_CATEGORIES.map((category) => {
                            const entry = rca.fishboneCategories.find((f) => f.category === category)
                            return (
                              <TagListEditor
                                key={category}
                                label={category}
                                items={entry?.causes ?? []}
                                onChange={(v) => {
                                  const next = rca.fishboneCategories.filter((f) => f.category !== category)
                                  next.push({ category, causes: v })
                                  updateRootCause(rca, { fishboneCategories: next })
                                }}
                              />
                            )
                          })}
                        </div>
                      )}

                      {rca?.method === 'taproot' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <TagListEditor
                            label="Causal factors"
                            items={rca.causalFactors}
                            onChange={(v) => updateRootCause(rca, { causalFactors: v })}
                          />
                          <TagListEditor
                            label="Root causes"
                            items={rca.rootCauses}
                            onChange={(v) => updateRootCause(rca, { rootCauses: v })}
                          />
                        </div>
                      )}

                      {rca && (
                        <textarea
                          className="input mt-2"
                          rows={2}
                          placeholder="Conclusion / summary"
                          value={rca.summary ?? ''}
                          onChange={(e) => updateRootCause(rca, { summary: e.target.value })}
                        />
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase text-slate-400">Corrective actions</p>
                        <button className="btn-ghost text-xs" onClick={() => addAction(finding.id)}>
                          + Add action
                        </button>
                      </div>
                      <div className="space-y-2">
                        {actionsFor(finding.id).map((action) => (
                          <div key={action.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-2 dark:border-slate-700 sm:grid-cols-[1fr_auto_auto_auto]">
                            <input
                              className="input py-1 text-sm"
                              value={action.description}
                              onChange={(e) => updateAction(action, { description: e.target.value })}
                            />
                            <input
                              className="input py-1 text-xs"
                              placeholder="Owner"
                              value={action.owner}
                              onChange={(e) => updateAction(action, { owner: e.target.value })}
                            />
                            <input
                              type="date"
                              className="input py-1 text-xs"
                              value={action.dueDate.slice(0, 10)}
                              onChange={(e) => updateAction(action, { dueDate: new Date(e.target.value).toISOString() })}
                            />
                            <select
                              className="input py-1 text-xs"
                              value={action.status}
                              onChange={(e) => updateAction(action, { status: e.target.value as CorrectiveActionStatus })}
                            >
                              {Object.entries(ACTION_STATUS_LABELS).map(([k, label]) => (
                                <option key={k} value={k}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <input
                              className="input py-1 text-xs sm:col-span-4"
                              placeholder="Verification notes"
                              value={action.verificationNotes ?? ''}
                              onChange={(e) => updateAction(action, { verificationNotes: e.target.value })}
                            />
                          </div>
                        ))}
                        {actionsFor(finding.id).length === 0 && (
                          <p className="text-xs text-slate-400">No corrective actions logged yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end border-t border-slate-100 pt-2 dark:border-slate-700">
                  <button className="btn-ghost text-xs text-status-major" onClick={() => removeEntity('audit_findings', finding.id)}>
                    Remove finding
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
