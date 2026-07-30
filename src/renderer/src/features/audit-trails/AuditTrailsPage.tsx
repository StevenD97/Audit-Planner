import { useState } from 'react'
import { newId } from '@shared/id'
import { auditTrails } from '@shared/knowledge-base'
import { resolveTrailClauses } from '@shared/engine/trailBuilder'
import type { AuditTrailDefinition, ProgrammeSlot } from '@shared/types'
import { ClauseChip, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function AuditTrailsPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertProgrammeSlot = useWorkspaceStore((s) => s.upsertProgrammeSlot)
  const [selected, setSelected] = useState<AuditTrailDefinition | null>(null)

  const applicable = auditTrails.filter(
    (t) => !project || t.standardIds === 'combined' || t.standardIds.some((s) => project.standards.includes(s))
  )

  async function addTrailToProgramme(trail: AuditTrailDefinition): Promise<void> {
    if (!project) return
    const existingSlots = (workspace?.programmeSlots ?? []).filter((s) => s.auditProjectId === project.id)
    const lastDay = existingSlots.reduce((max, s) => Math.max(max, s.dayNumber), 0)
    const day = lastDay + 1
    const clauses = resolveTrailClauses(trail)
    let hour = 9
    for (const clause of clauses) {
      const start = `${String(hour).padStart(2, '0')}:00`
      const end = `${String(hour + 1).padStart(2, '0')}:00`
      const slot: ProgrammeSlot = {
        id: newId(),
        auditProjectId: project.id,
        dayNumber: day,
        startTime: start,
        endTime: end,
        activityType: 'interview',
        clauseIds: [clause.id],
        notes: `Audit trail: ${trail.name}`
      }
      await upsertProgrammeSlot(slot)
      hour++
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Trail Generator</h1>
      {!project && <p className="text-sm text-slate-500">Browsing all trails. Select an audit project to add trails to its programme.</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {applicable.map((trail) => (
          <button key={trail.id} onClick={() => setSelected(trail)} className="card text-left transition hover:border-brand-400 hover:shadow-md">
            <h2 className="font-semibold text-brand-700 dark:text-brand-400">{trail.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{trail.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            {project && (
              <button className="btn-primary" onClick={() => addTrailToProgramme(selected)}>
                Add trail to programme
              </button>
            )}
          </div>
          <p className="mb-4 text-sm text-slate-500">{selected.description}</p>
          <ol className="space-y-3">
            {selected.steps.map((step, i) => {
              const clause = resolveTrailClauses(selected)[i]
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <ClauseChip standardId={step.standardId} clauseNumber={step.clauseNumber} title={clause?.title} />
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.note}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
