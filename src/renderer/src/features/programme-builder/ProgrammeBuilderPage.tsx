import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { AuditProjectPicker, useCurrentAuditProject, ClauseChip } from '../../components/common'
import { getAuditableClauses, getClauseById } from '@shared/knowledge-base'
import { generateProgramme, findSchedulingConflicts } from '@shared/engine/scheduler'
import { collectProcessClauseIds } from '@shared/engine/processClauses'
import { collectObligationClauseIds } from '@shared/engine/compliance'
import { prioritiseClausesForScheduling } from '@shared/engine/riskHeatmap'
import type { ProgrammeActivityType, ProgrammeSlot } from '@shared/types'

const ACTIVITY_LABELS: Record<ProgrammeActivityType, string> = {
  opening_meeting: 'Opening meeting',
  interview: 'Interview',
  document_review: 'Document review',
  site_inspection: 'Site inspection',
  closing_meeting: 'Closing meeting',
  break: 'Break'
}

export default function ProgrammeBuilderPage(): JSX.Element {
  const [params] = useSearchParams()
  const projectIdFromUrl = params.get('project')
  const setCurrentAuditProject = useWorkspaceStore((s) => s.setCurrentAuditProject)
  useEffect(() => {
    if (projectIdFromUrl) setCurrentAuditProject(projectIdFromUrl)
  }, [projectIdFromUrl, setCurrentAuditProject])

  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const replaceProgrammeSlots = useWorkspaceStore((s) => s.replaceProgrammeSlots)
  const upsertProgrammeSlot = useWorkspaceStore((s) => s.upsertProgrammeSlot)
  const removeProgrammeSlot = useWorkspaceStore((s) => s.removeProgrammeSlot)
  const updateAuditProject = useWorkspaceStore((s) => s.updateAuditProject)

  const slots = useMemo(
    () => (workspace?.programmeSlots ?? []).filter((s) => s.auditProjectId === project?.id),
    [workspace, project]
  )

  if (!project) return <AuditProjectPicker />

  const allProcesses = workspace?.processes ?? []
  const allObligations = workspace?.complianceObligations ?? []
  const processIdsInScope = project.processIds ?? []
  const obligationIdsInScope = project.obligationIds ?? []

  const standardClauses = project.standards.flatMap((s) => getAuditableClauses(s))
  const standardClauseIds = new Set(standardClauses.map((c) => c.id))

  const processClauseIds = collectProcessClauseIds(processIdsInScope, allProcesses, workspace?.risks ?? [], workspace?.controls ?? [])
  const obligationClauseIds = collectObligationClauseIds(obligationIdsInScope, allObligations)
  const extraClauseIds = new Set([...processClauseIds, ...obligationClauseIds].filter((id) => !standardClauseIds.has(id)))
  const extraClauses = Array.from(extraClauseIds)
    .map((id) => getClauseById(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
  const clauses = [...standardClauses, ...extraClauses]

  const conflicts = findSchedulingConflicts(slots)
  const conflictSlotIds = new Set(conflicts.flatMap((c) => [c.slotA, c.slotB]))

  async function toggleProcessInScope(processId: string): Promise<void> {
    const next = processIdsInScope.includes(processId)
      ? processIdsInScope.filter((id) => id !== processId)
      : [...processIdsInScope, processId]
    await updateAuditProject(project!.id, { processIds: next })
  }

  async function toggleObligationInScope(obligationId: string): Promise<void> {
    const next = obligationIdsInScope.includes(obligationId)
      ? obligationIdsInScope.filter((id) => id !== obligationId)
      : [...obligationIdsInScope, obligationId]
    await updateAuditProject(project!.id, { obligationIds: next })
  }

  async function togglePrioritiseByRisk(): Promise<void> {
    await updateAuditProject(project!.id, { prioritiseByRisk: !project!.prioritiseByRisk })
  }

  async function autoGenerate(): Promise<void> {
    const orderedClauses = project!.prioritiseByRisk
      ? prioritiseClausesForScheduling(
          clauses,
          allProcesses,
          workspace?.risks ?? [],
          workspace?.controls ?? [],
          workspace?.auditFindings ?? [],
          allObligations,
          workspace?.complianceEvaluations ?? []
        )
      : clauses
    const generated = generateProgramme({
      auditProjectId: project!.id,
      durationDays: project!.durationDays ?? 1,
      clauses: orderedClauses,
      departments: project!.departments
    })
    await replaceProgrammeSlots(project!.id, generated)
  }

  const byDay = new Map<number, ProgrammeSlot[]>()
  for (const slot of slots) {
    byDay.set(slot.dayNumber, [...(byDay.get(slot.dayNumber) ?? []), slot])
  }
  const days = Array.from(byDay.keys()).sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Programme Builder</h1>
        <button className="btn-primary" onClick={autoGenerate}>
          {slots.length ? 'Regenerate schedule' : 'Auto-generate schedule'}
        </button>
      </div>
      <AuditProjectPicker />

      {(allProcesses.length > 0 || allObligations.length > 0) && (
        <div className="card space-y-4">
          {allProcesses.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">
                Plan by process <span className="font-normal text-slate-400">(optional — adds each process&apos;s linked clauses to scope)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allProcesses.map((p) => (
                  <label
                    key={p.id}
                    className={`chip cursor-pointer border ${
                      processIdsInScope.includes(p.id)
                        ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-1"
                      checked={processIdsInScope.includes(p.id)}
                      onChange={() => toggleProcessInScope(p.id)}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {allObligations.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">
                Plan by legal obligation{' '}
                <span className="font-normal text-slate-400">(optional — adds each obligation&apos;s linked clauses to scope)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allObligations.map((o) => (
                  <label
                    key={o.id}
                    className={`chip cursor-pointer border ${
                      obligationIdsInScope.includes(o.id)
                        ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-1"
                      checked={obligationIdsInScope.includes(o.id)}
                      onChange={() => toggleObligationInScope(o.id)}
                    />
                    {o.description}
                  </label>
                ))}
              </div>
            </div>
          )}
          {extraClauses.length > 0 && (
            <p className="text-xs text-slate-500">
              +{extraClauses.length} clause(s) added to scope from selected processes/obligations.
            </p>
          )}
          {(workspace?.risks ?? []).length > 0 && (
            <label className="flex items-center gap-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-700">
              <input type="checkbox" checked={project.prioritiseByRisk ?? false} onChange={togglePrioritiseByRisk} />
              Prioritise by risk
              <span className="font-normal text-slate-400">
                (increase audit depth where risk, findings and compliance failures concentrate — see Risk Register)
              </span>
            </label>
          )}
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {conflicts.length} scheduling conflict(s) detected — the same process owner is double-booked. Highlighted
          rows below.
        </div>
      )}

      {slots.length === 0 ? (
        <p className="text-sm text-slate-500">No programme yet — click &quot;Auto-generate schedule&quot; to create a first draft from the audit scope.</p>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day} className="card">
              <h2 className="mb-3 text-lg font-semibold">Day {day}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                    <th className="py-2">Time</th>
                    <th>Activity</th>
                    <th>Clauses</th>
                    <th>Process owner</th>
                    <th>Location</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(byDay.get(day) ?? [])
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <tr
                        key={slot.id}
                        className={`border-b border-slate-100 dark:border-slate-700 ${
                          conflictSlotIds.has(slot.id) ? 'bg-red-50 dark:bg-red-900/20' : ''
                        }`}
                      >
                        <td className="py-2 whitespace-nowrap">
                          {slot.startTime}–{slot.endTime}
                        </td>
                        <td>
                          <select
                            className="input"
                            value={slot.activityType}
                            onChange={(e) => upsertProgrammeSlot({ ...slot, activityType: e.target.value as ProgrammeActivityType })}
                          >
                            {Object.entries(ACTIVITY_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="flex flex-wrap gap-1 py-2">
                          {slot.clauseIds.map((id) => {
                            const c = getClauseById(id)
                            return c ? <ClauseChip key={id} standardId={c.standardId} clauseNumber={c.clauseNumber} title={c.title} /> : null
                          })}
                        </td>
                        <td>
                          <input
                            className="input"
                            value={slot.processOwner ?? ''}
                            onChange={(e) => upsertProgrammeSlot({ ...slot, processOwner: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={slot.location ?? ''}
                            onChange={(e) => upsertProgrammeSlot({ ...slot, location: e.target.value })}
                          />
                        </td>
                        <td>
                          <button className="btn-ghost text-red-600" onClick={() => removeProgrammeSlot(slot.id)}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
