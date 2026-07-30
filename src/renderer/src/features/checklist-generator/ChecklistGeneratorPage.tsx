import { useMemo, useState } from 'react'
import { newId } from '@shared/id'
import { getAuditableClauses, getClauseById } from '@shared/knowledge-base'
import { riskWeightToLevel } from '@shared/engine/scoring'
import type { ChecklistStatus, RiskLevel, StandardId } from '@shared/types'
import { AuditProjectPicker, ClauseChip, RiskBadge, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function ChecklistGeneratorPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const bulkUpsertChecklistItems = useWorkspaceStore((s) => s.bulkUpsertChecklistItems)
  const upsertChecklistItem = useWorkspaceStore((s) => s.upsertChecklistItem)
  const removeChecklistItem = useWorkspaceStore((s) => s.removeChecklistItem)

  const [standardFilter, setStandardFilter] = useState<StandardId | 'all'>('all')
  const [processFilter, setProcessFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [groupBy, setGroupBy] = useState<'clause' | 'process'>('clause')

  const items = useMemo(
    () => (workspace?.checklistItems ?? []).filter((c) => c.auditProjectId === project?.id),
    [workspace, project]
  )

  if (!project) return <AuditProjectPicker />

  const candidateClauses = project.standards
    .filter((s) => standardFilter === 'all' || s === standardFilter)
    .flatMap((s) => getAuditableClauses(s))
    .filter((c) => !processFilter || c.processOwnerRoles.some((r) => r.toLowerCase().includes(processFilter.toLowerCase())))
    .filter((c) => {
      if (riskFilter === 'all') return true
      const maxWeight = Math.max(0, ...c.riskPrompts.map((r) => r.riskWeight))
      return riskWeightToLevel(maxWeight) === riskFilter
    })

  async function generate(): Promise<void> {
    const newItems = candidateClauses.flatMap((c) => {
      const maxWeight = Math.max(1, ...c.riskPrompts.map((r) => r.riskWeight))
      return c.interviewQuestions.map((q) => ({
        id: newId(),
        auditProjectId: project!.id,
        clauseId: c.id,
        question: q.question,
        riskLevel: riskWeightToLevel(maxWeight),
        process: c.processOwnerRoles[0],
        status: 'pending' as ChecklistStatus
      }))
    })
    if (newItems.length) await bulkUpsertChecklistItems(newItems)
  }

  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const clause = getClauseById(item.clauseId)
    const key = groupBy === 'clause' ? `${clause?.clauseNumber ?? '?'} ${clause?.title ?? ''}` : item.process ?? 'Unassigned'
    grouped.set(key, [...(grouped.get(key) ?? []), item])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Checklist Generator</h1>
      <AuditProjectPicker />

      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-slate-500">Standard</label>
          <select className="input" value={standardFilter} onChange={(e) => setStandardFilter(e.target.value as StandardId | 'all')}>
            <option value="all">All in scope</option>
            {project.standards.map((s) => (
              <option key={s} value={s}>
                {s === 'iso14001' ? 'ISO 14001' : 'ISO 45001'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Process (owner role contains)</label>
          <input className="input" value={processFilter} onChange={(e) => setProcessFilter(e.target.value)} placeholder="e.g. Operations" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Risk level</label>
          <select className="input" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}>
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button className="btn-primary" onClick={generate}>
          Generate checklist ({candidateClauses.reduce((n, c) => n + c.interviewQuestions.length, 0)} questions)
        </button>
        <div className="ml-auto">
          <label className="text-xs text-slate-500">Group by</label>
          <select className="input" value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'clause' | 'process')}>
            <option value="clause">Clause</option>
            <option value="process">Process</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No checklist items yet — set filters above and click Generate.</p>
      ) : (
        Array.from(grouped.entries()).map(([group, groupItems]) => (
          <div key={group} className="card">
            <h2 className="mb-3 text-lg font-semibold">{group}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                  <th className="py-2">Question</th>
                  <th>Clause</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Response / evidence notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map((item) => {
                  const clause = getClauseById(item.clauseId)
                  return (
                    <tr key={item.id} className="border-b border-slate-100 align-top dark:border-slate-700">
                      <td className="max-w-xs py-2">{item.question}</td>
                      <td>{clause && <ClauseChip standardId={clause.standardId} clauseNumber={clause.clauseNumber} />}</td>
                      <td>
                        <RiskBadge level={item.riskLevel} />
                      </td>
                      <td>
                        <select
                          className="input"
                          value={item.status}
                          onChange={(e) => upsertChecklistItem({ ...item, status: e.target.value as ChecklistStatus })}
                        >
                          <option value="pending">Pending</option>
                          <option value="answered">Answered</option>
                          <option value="na">N/A</option>
                        </select>
                      </td>
                      <td>
                        <textarea
                          className="input min-h-[40px]"
                          value={item.response ?? ''}
                          onChange={(e) => upsertChecklistItem({ ...item, response: e.target.value })}
                        />
                      </td>
                      <td>
                        <button className="btn-ghost text-red-600" onClick={() => removeChecklistItem(item.id)}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
