import { useMemo } from 'react'
import { newId } from '@shared/id'
import { getAuditableClauses } from '@shared/knowledge-base'
import { computeReadiness } from '@shared/engine/scoring'
import { AuditProjectPicker, RatingBadge, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

export default function ReadinessPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const addReadinessSnapshot = useWorkspaceStore((s) => s.addReadinessSnapshot)

  const gapAssessments = useMemo(
    () => (workspace?.gapAssessments ?? []).filter((g) => g.auditProjectId === project?.id),
    [workspace, project]
  )
  const snapshots = useMemo(
    () =>
      (workspace?.readinessSnapshots ?? [])
        .filter((s) => s.auditProjectId === project?.id)
        .sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    [workspace, project]
  )

  if (!project) return <AuditProjectPicker />

  const clauses = project.standards.flatMap((s) => getAuditableClauses(s))
  const readiness = computeReadiness(clauses, gapAssessments)
  const sorted = [...readiness.byClause].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))

  async function takeSnapshot(): Promise<void> {
    await addReadinessSnapshot({
      id: newId(),
      auditProjectId: project!.id,
      takenAt: new Date().toISOString(),
      overallPct: readiness.overallPct,
      byClause: readiness.byClause.map((c) => ({ clauseId: c.clauseId, score: c.score ?? 0 })),
      highRiskGaps: readiness.highRiskGaps,
      recommendedActions: readiness.recommendedActions
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Readiness Assessment</h1>
        <button className="btn-primary" onClick={takeSnapshot}>
          Take snapshot
        </button>
      </div>
      <AuditProjectPicker />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center">
          <p className="text-sm text-slate-500">Overall readiness</p>
          <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{readiness.overallPct}%</p>
        </div>
        <div className="card lg:col-span-2">
          <p className="mb-2 text-sm text-slate-500">Readiness trend ({snapshots.length} snapshot(s))</p>
          <Sparkline values={snapshots.map((s) => s.overallPct)} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Clause compliance scores (worst first)</h2>
        <div className="space-y-1">
          {sorted.map((c) => (
            <div key={c.clauseId} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-xs">
                §{c.clauseNumber} {c.title}
              </span>
              <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className={`h-3 rounded-full ${
                    (c.score ?? 0) >= 80 ? 'bg-status-conforms' : (c.score ?? 0) >= 40 ? 'bg-status-ofi' : 'bg-status-major'
                  }`}
                  style={{ width: `${c.score ?? 0}%` }}
                />
              </div>
              <RatingBadge rating={c.rating} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 text-lg font-semibold">High-risk gaps</h2>
          {readiness.highRiskGaps.length === 0 ? (
            <p className="text-sm text-slate-500">None currently — assess clauses in the Gap Assessment Tool.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {readiness.highRiskGaps.map((g, i) => (
                <li key={i} className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                  {g.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="mb-2 text-lg font-semibold">Recommended actions</h2>
          {readiness.recommendedActions.length === 0 ? (
            <p className="text-sm text-slate-500">No outstanding actions.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {readiness.recommendedActions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Sparkline({ values }: { values: number[] }): JSX.Element {
  if (values.length === 0) return <p className="text-sm text-slate-400">No snapshots yet.</p>
  const width = 400
  const height = 60
  const max = 100
  const points = values
    .map((v, i) => `${(i / Math.max(1, values.length - 1)) * width},${height - (v / max) * height}`)
    .join(' ')
  return (
    <svg width={width} height={height} className="w-full">
      <polyline points={points} fill="none" stroke="#0f766e" strokeWidth={2} />
    </svg>
  )
}
