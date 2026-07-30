import { useMemo } from 'react'
import { newId } from '@shared/id'
import { getAuditableClauses } from '@shared/knowledge-base'
import type { GapRating, RiskLevel } from '@shared/types'
import { AuditProjectPicker, RatingBadge, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const RATINGS: { key: GapRating; label: string }[] = [
  { key: 'conforms', label: 'Conforms' },
  { key: 'ofi', label: 'OFI' },
  { key: 'minor_nc', label: 'Minor NC' },
  { key: 'major_nc', label: 'Major NC' }
]

export default function GapAssessmentPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertGapAssessment = useWorkspaceStore((s) => s.upsertGapAssessment)

  const gapAssessments = useMemo(
    () => (workspace?.gapAssessments ?? []).filter((g) => g.auditProjectId === project?.id),
    [workspace, project]
  )

  if (!project) return <AuditProjectPicker />

  const clauses = project.standards.flatMap((s) => getAuditableClauses(s))
  const byClause = new Map(gapAssessments.map((g) => [g.clauseId, g]))

  const distribution: Record<GapRating, number> = {
    conforms: 0,
    ofi: 0,
    minor_nc: 0,
    major_nc: 0,
    not_assessed: 0
  }
  for (const c of clauses) {
    const rating = byClause.get(c.id)?.rating ?? 'not_assessed'
    distribution[rating]++
  }

  async function setRating(clauseId: string, rating: GapRating): Promise<void> {
    const existing = byClause.get(clauseId)
    await upsertGapAssessment({
      id: existing?.id ?? newId(),
      auditProjectId: project!.id,
      clauseId,
      rating,
      narrative: existing?.narrative,
      recommendedAction: existing?.recommendedAction,
      riskRating: existing?.riskRating,
      assessedBy: existing?.assessedBy,
      assessedAt: new Date().toISOString()
    })
  }

  async function updateField(clauseId: string, patch: Partial<{ narrative: string; recommendedAction: string; riskRating: RiskLevel }>): Promise<void> {
    const existing = byClause.get(clauseId)
    await upsertGapAssessment({
      id: existing?.id ?? newId(),
      auditProjectId: project!.id,
      clauseId,
      rating: existing?.rating ?? 'not_assessed',
      narrative: patch.narrative ?? existing?.narrative,
      recommendedAction: patch.recommendedAction ?? existing?.recommendedAction,
      riskRating: patch.riskRating ?? existing?.riskRating,
      assessedBy: existing?.assessedBy,
      assessedAt: new Date().toISOString()
    })
  }

  const total = clauses.length || 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gap Assessment Tool</h1>
      <AuditProjectPicker />

      <div className="card">
        <h2 className="mb-2 text-lg font-semibold">Rating distribution</h2>
        <div className="flex h-4 overflow-hidden rounded-full">
          <div className="bg-status-conforms" style={{ width: `${(distribution.conforms / total) * 100}%` }} />
          <div className="bg-status-ofi" style={{ width: `${(distribution.ofi / total) * 100}%` }} />
          <div className="bg-status-minor" style={{ width: `${(distribution.minor_nc / total) * 100}%` }} />
          <div className="bg-status-major" style={{ width: `${(distribution.major_nc / total) * 100}%` }} />
          <div className="bg-status-pending" style={{ width: `${(distribution.not_assessed / total) * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
          {RATINGS.map((r) => (
            <span key={r.key}>
              {r.label}: {distribution[r.key]}
            </span>
          ))}
          <span>Not assessed: {distribution.not_assessed}</span>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
              <th className="py-2">Clause</th>
              <th>Rating</th>
              <th>Narrative</th>
              <th>Recommended action</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {clauses.map((c) => {
              const ga = byClause.get(c.id)
              return (
                <tr key={c.id} className="border-b border-slate-100 align-top dark:border-slate-700">
                  <td className="py-2 pr-3 font-medium">
                    §{c.clauseNumber} {c.title}
                  </td>
                  <td className="pr-3">
                    <div className="flex flex-wrap gap-1">
                      {RATINGS.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => setRating(c.id, r.key)}
                          className={ga?.rating === r.key ? '' : 'opacity-40 hover:opacity-100'}
                        >
                          <RatingBadge rating={r.key} />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="pr-3">
                    <textarea
                      className="input min-h-[40px]"
                      value={ga?.narrative ?? ''}
                      onChange={(e) => updateField(c.id, { narrative: e.target.value })}
                    />
                  </td>
                  <td className="pr-3">
                    <textarea
                      className="input min-h-[40px]"
                      value={ga?.recommendedAction ?? ''}
                      onChange={(e) => updateField(c.id, { recommendedAction: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      value={ga?.riskRating ?? ''}
                      onChange={(e) => updateField(c.id, { riskRating: (e.target.value || undefined) as RiskLevel })}
                    >
                      <option value="">—</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
