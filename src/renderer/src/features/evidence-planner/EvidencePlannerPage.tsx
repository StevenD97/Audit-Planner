import { useMemo, useState } from 'react'
import { newId } from '@shared/id'
import { getAuditableClauses, getClauseById } from '@shared/knowledge-base'
import type { EvidenceStatus } from '@shared/types'
import { AuditProjectPicker, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  requested: 'Requested',
  obtained: 'Obtained',
  not_available: 'Not available',
  not_applicable: 'N/A'
}

export default function EvidencePlannerPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const bulkUpsertEvidenceItems = useWorkspaceStore((s) => s.bulkUpsertEvidenceItems)
  const upsertEvidenceItem = useWorkspaceStore((s) => s.upsertEvidenceItem)
  const [onlyMissing, setOnlyMissing] = useState(false)

  const items = useMemo(
    () => (workspace?.evidencePlanItems ?? []).filter((e) => e.auditProjectId === project?.id),
    [workspace, project]
  )

  if (!project) return <AuditProjectPicker />

  async function generateFromScope(): Promise<void> {
    const clauses = project!.standards.flatMap((s) => getAuditableClauses(s))
    const existingKeys = new Set(items.map((i) => `${i.clauseId}::${i.description}`))
    const newItems = clauses.flatMap((c) =>
      c.evidenceRequired
        .filter((e) => !existingKeys.has(`${c.id}::${e.description}`))
        .map((e) => ({
          id: newId(),
          auditProjectId: project!.id,
          clauseId: c.id,
          category: e.category,
          description: e.description,
          status: 'requested' as EvidenceStatus,
          locationOwner: e.typicalSource
        }))
    )
    if (newItems.length) await bulkUpsertEvidenceItems(newItems)
  }

  const obtainedCount = items.filter((i) => i.status === 'obtained').length
  const pctObtained = items.length ? Math.round((obtainedCount / items.length) * 100) : 0
  const outstanding = items.filter((i) => i.status !== 'obtained' && i.status !== 'not_applicable').length

  const visibleItems = onlyMissing ? items.filter((i) => i.status !== 'obtained' && i.status !== 'not_applicable') : items
  const grouped = new Map<string, typeof items>()
  for (const item of visibleItems) {
    const clause = getClauseById(item.clauseId)
    const key = `${clause?.clauseNumber ?? '?'} ${clause?.title ?? ''}`
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Evidence Planner</h1>
        <button className="btn-primary" onClick={generateFromScope}>
          Generate from scope
        </button>
      </div>
      <AuditProjectPicker />

      <div className="card flex items-center gap-6">
        <div>
          <p className="text-sm text-slate-500">Evidence obtained</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{pctObtained}%</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Outstanding items</p>
          <p className="text-2xl font-bold">{outstanding}</p>
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Show only missing evidence
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No evidence items yet — click &quot;Generate from scope&quot;.</p>
      ) : (
        Array.from(grouped.entries()).map(([group, groupItems]) => (
          <div key={group} className="card">
            <h2 className="mb-3 text-lg font-semibold">{group}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                  <th className="py-2">Evidence</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Owner / location</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top dark:border-slate-700">
                    <td className="max-w-xs py-2">{item.description}</td>
                    <td className="capitalize">{item.category.replace('_', ' ')}</td>
                    <td>
                      <select
                        className="input"
                        value={item.status}
                        onChange={(e) => upsertEvidenceItem({ ...item, status: e.target.value as EvidenceStatus })}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="input"
                        value={item.locationOwner ?? ''}
                        onChange={(e) => upsertEvidenceItem({ ...item, locationOwner: e.target.value })}
                      />
                    </td>
                    <td>
                      <input className="input" value={item.notes ?? ''} onChange={(e) => upsertEvidenceItem({ ...item, notes: e.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
