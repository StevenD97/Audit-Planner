import { useMemo } from 'react'
import { newId } from '@shared/id'
import { getAuditableClauses, getClauseById } from '@shared/knowledge-base'
import {
  computeOverallReadinessV2,
  computeProcessScoreV2,
  computeDepartmentScoreV2,
  computeSiteScoreV2,
  type ScoringV2Context,
  type ScoredEntity
} from '@shared/engine/scoringV2'
import { getRecurringFindings } from '@shared/engine/findings'
import { AuditProjectPicker, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

function scoreBarColor(score: number): string {
  return score >= 80 ? 'bg-status-conforms' : score >= 40 ? 'bg-status-ofi' : 'bg-status-major'
}

function ScoreRow({ label, entity, badge }: { label: string; entity: ScoredEntity; badge?: string }): JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="w-48 shrink-0 truncate text-xs" title={label}>
          {label}
          {badge && <span className="ml-1 chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{badge}</span>}
        </span>
        <div className="h-3 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
          <div className={`h-3 rounded-full ${scoreBarColor(entity.score)}`} style={{ width: `${entity.score}%` }} />
        </div>
        <span className="w-10 shrink-0 text-right text-xs font-semibold">{entity.score}%</span>
      </div>
      {entity.drivers.length > 0 && (
        <p className="pl-[13.5rem] text-xs text-slate-400">{entity.drivers.map((d) => d.label).join(' · ')}</p>
      )}
    </div>
  )
}

export default function ReadinessPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const addReadinessSnapshot = useWorkspaceStore((s) => s.addReadinessSnapshot)

  const snapshots = useMemo(
    () =>
      (workspace?.readinessSnapshots ?? [])
        .filter((s) => s.auditProjectId === project?.id)
        .sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    [workspace, project]
  )

  if (!project || !workspace) return <AuditProjectPicker />

  const ctx: ScoringV2Context = {
    gapAssessments: workspace.gapAssessments,
    auditFindings: workspace.auditFindings,
    correctiveActions: workspace.correctiveActions,
    complianceObligations: workspace.complianceObligations,
    complianceEvaluations: workspace.complianceEvaluations,
    evidencePlanItems: workspace.evidencePlanItems,
    risks: workspace.risks,
    controls: workspace.controls,
    processes: workspace.processes
  }

  const clauseTitleFor = (clauseId: string): string => {
    const c = getClauseById(clauseId)
    return c ? `§${c.clauseNumber} ${c.title}` : clauseId
  }
  const processNameFor = (processId: string): string => workspace.processes.find((p) => p.id === processId)?.name ?? processId
  const departmentNameFor = (departmentId: string): string =>
    workspace.orgDepartments.find((d) => d.id === departmentId)?.name ?? departmentId
  const siteNameFor = (siteId: string): string => workspace.orgSites.find((s) => s.id === siteId)?.name ?? siteId

  const clauses = project.standards.flatMap((s) => getAuditableClauses(s))
  const overall = computeOverallReadinessV2(clauses.map((c) => c.id), clauseTitleFor, project.id, ctx)
  const worstFirst = [...(overall.children ?? [])].sort((a, b) => a.score - b.score)

  const byProcess = workspace.processes
    .map((p) => computeProcessScoreV2(p, clauseTitleFor, project.id, ctx))
    .filter((e) => (e.children?.length ?? 0) > 0)
    .sort((a, b) => a.score - b.score)

  const byDepartment = workspace.orgDepartments
    .map((d) => computeDepartmentScoreV2(d.id, workspace.orgFunctions, processNameFor, clauseTitleFor, project.id, ctx))
    .filter((e) => (e.children?.length ?? 0) > 0)
    .sort((a, b) => a.score - b.score)

  const bySite = workspace.orgSites
    .map((s) =>
      computeSiteScoreV2(s.id, workspace.orgDepartments, workspace.orgFunctions, departmentNameFor, processNameFor, clauseTitleFor, project.id, ctx)
    )
    .filter((e) => (e.children?.length ?? 0) > 0)
    .sort((a, b) => a.score - b.score)

  const recurringFindings = getRecurringFindings(workspace.auditFindings)

  async function takeSnapshot(): Promise<void> {
    await addReadinessSnapshot({
      id: newId(),
      auditProjectId: project!.id,
      takenAt: new Date().toISOString(),
      overallPct: overall.score,
      byClause: (overall.children ?? []).map((c) => ({ clauseId: c.id, score: c.score })),
      highRiskGaps: worstFirst
        .filter((c) => c.score < 50)
        .map((c) => ({ clauseId: c.id, reason: `${clauseTitleFor(c.id)}: ${c.drivers.map((d) => d.label).join('; ') || 'low score'}` })),
      recommendedActions: worstFirst.filter((c) => c.score < 80).map((c) => `${clauseTitleFor(c.id)}: address ${c.drivers[0]?.label ?? 'outstanding gaps'}`)
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
      <p className="text-sm text-slate-500">
        Every score below is explainable — the text under each bar is exactly why it isn&apos;t 100%, combining gap
        assessment ratings, open findings and their closure history, compliance evaluations, evidence completeness,
        and linked risk levels.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center justify-center">
          <p className="text-sm text-slate-500">Overall readiness</p>
          <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{overall.score}%</p>
        </div>
        <div className="card lg:col-span-2">
          <p className="mb-2 text-sm text-slate-500">Readiness trend ({snapshots.length} snapshot(s))</p>
          <Sparkline values={snapshots.map((s) => s.overallPct)} />
        </div>
      </div>

      {bySite.length > 0 && (
        <div className="card space-y-2">
          <h2 className="mb-1 text-lg font-semibold">Readiness by site</h2>
          {bySite.length > 1 && (
            <p className="mb-2 text-xs text-slate-400">
              Compared within this audit&apos;s scope — {siteNameFor(bySite[bySite.length - 1].id)} is currently
              strongest, {siteNameFor(bySite[0].id)} weakest.
            </p>
          )}
          {bySite.map((s, i) => (
            <ScoreRow
              key={s.id}
              label={siteNameFor(s.id)}
              entity={s}
              badge={bySite.length > 1 ? (i === 0 ? 'Weakest' : i === bySite.length - 1 ? 'Strongest' : undefined) : undefined}
            />
          ))}
        </div>
      )}

      {recurringFindings.length > 0 && (
        <div className="card space-y-2">
          <h2 className="mb-1 text-lg font-semibold">Top recurring findings (across all audits in this workspace)</h2>
          {recurringFindings.slice(0, 10).map((r) => {
            const label =
              r.kind === 'clause'
                ? clauseTitleFor(r.id)
                : processNameFor(r.id)
            return (
              <div key={`${r.kind}:${r.id}`} className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="chip bg-status-major/10 text-status-major">{r.count} findings</span>
              </div>
            )
          })}
        </div>
      )}

      {byDepartment.length > 0 && (
        <div className="card space-y-2">
          <h2 className="mb-1 text-lg font-semibold">Readiness by department</h2>
          {byDepartment.map((d) => (
            <ScoreRow key={d.id} label={departmentNameFor(d.id)} entity={d} />
          ))}
        </div>
      )}

      {byProcess.length > 0 && (
        <div className="card space-y-2">
          <h2 className="mb-1 text-lg font-semibold">Readiness by process</h2>
          {byProcess.map((p) => (
            <ScoreRow key={p.id} label={processNameFor(p.id)} entity={p} />
          ))}
        </div>
      )}

      <div className="card space-y-2">
        <h2 className="mb-1 text-lg font-semibold">Clause readiness (worst first)</h2>
        {worstFirst.map((c) => (
          <ScoreRow key={c.id} label={clauseTitleFor(c.id)} entity={c} />
        ))}
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
      <polyline points={points} fill="none" stroke="#1F5FA8" strokeWidth={2} />
    </svg>
  )
}
