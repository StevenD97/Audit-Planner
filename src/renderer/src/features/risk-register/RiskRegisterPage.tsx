import { useState } from 'react'
import { buildRiskHeatmap, riskScore, riskScoreLevel, computeCoveragePriority } from '@shared/engine/riskHeatmap'
import type { RiskLevel } from '@shared/types'
import { EmptyState } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const LEVEL_STYLES: Record<RiskLevel, string> = {
  low: 'bg-status-conforms/20 text-status-conforms',
  medium: 'bg-status-ofi/20 text-status-ofi',
  high: 'bg-status-major/20 text-status-major'
}

const LEVEL_CELL_STYLES: Record<RiskLevel, string> = {
  low: 'bg-status-conforms/10 hover:bg-status-conforms/20',
  medium: 'bg-status-ofi/10 hover:bg-status-ofi/20',
  high: 'bg-status-major/10 hover:bg-status-major/20'
}

export default function RiskRegisterPage(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const [selectedCell, setSelectedCell] = useState<{ likelihood: number; severity: number } | null>(null)

  const risks = workspace?.risks ?? []
  const processes = workspace?.processes ?? []
  const controls = workspace?.controls ?? []
  const findings = workspace?.auditFindings ?? []
  const obligations = workspace?.complianceObligations ?? []
  const evaluations = workspace?.complianceEvaluations ?? []

  if (!workspace) return <EmptyState title="Loading…" />

  if (risks.length === 0) {
    return (
      <EmptyState
        title="No risks recorded yet"
        hint="Add risks to a process in the Process Explorer (or adopt a starter process, which comes with risks already defined) to populate the heat map and coverage priorities here."
      />
    )
  }

  const heatmap = buildRiskHeatmap(risks)
  const priorities = computeCoveragePriority(processes, risks, controls, findings, obligations, evaluations)

  const cellRisks = selectedCell
    ? risks.filter((r) => r.likelihood === selectedCell.likelihood && r.severity === selectedCell.severity)
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Risk Register</h1>
      <p className="text-sm text-slate-500">
        Every risk recorded against a process, plotted by likelihood x severity, and a ranked coverage priority so
        audit depth follows where risk, findings and compliance failures actually concentrate.
      </p>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Risk heat map</h2>
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-1 text-xs text-slate-400">
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} className="flex h-16 items-center">
                {l}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-1">
              {[5, 4, 3, 2, 1].map((likelihood) =>
                [1, 2, 3, 4, 5].map((severity) => {
                  const cell = heatmap[likelihood - 1][severity - 1]
                  const isSelected = selectedCell?.likelihood === likelihood && selectedCell?.severity === severity
                  return (
                    <button
                      key={`${likelihood}-${severity}`}
                      onClick={() => setSelectedCell(cell.riskIds.length ? { likelihood, severity } : null)}
                      className={`flex h-16 flex-col items-center justify-center rounded-lg text-sm font-semibold ${LEVEL_CELL_STYLES[cell.level]} ${
                        isSelected ? 'ring-2 ring-brand-500' : ''
                      }`}
                    >
                      {cell.riskIds.length > 0 ? cell.riskIds.length : ''}
                    </button>
                  )
                })
              )}
            </div>
            <div className="mt-1 grid grid-cols-5 gap-1 text-center text-xs text-slate-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s}>{s}</div>
              ))}
            </div>
            <p className="mt-1 text-center text-xs text-slate-400">Severity →  (rows: Likelihood ↑)</p>
          </div>
        </div>

        {selectedCell && (
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Risks at likelihood {selectedCell.likelihood} / severity {selectedCell.severity}
            </p>
            <ul className="space-y-1 text-sm">
              {cellRisks.map((r) => (
                <li key={r.id}>
                  {r.description}{' '}
                  <span className="text-xs text-slate-400">
                    ({processes.find((p) => p.id === r.processId)?.name ?? 'Unknown process'})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">All risks</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
              <th className="py-2">Risk</th>
              <th>Process</th>
              <th>Category</th>
              <th>Likelihood</th>
              <th>Severity</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {risks
              .slice()
              .sort((a, b) => riskScore(b) - riskScore(a))
              .map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="py-2 pr-3">{r.description}</td>
                  <td className="pr-3 text-slate-500">{processes.find((p) => p.id === r.processId)?.name ?? '—'}</td>
                  <td className="pr-3 capitalize text-slate-500">{r.category.replace('_', ' ')}</td>
                  <td className="pr-3">{r.likelihood}</td>
                  <td className="pr-3">{r.severity}</td>
                  <td>
                    <span className={`chip ${LEVEL_STYLES[riskScoreLevel(riskScore(r))]}`}>{riskScoreLevel(riskScore(r))}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Coverage priority (audit depth by process)</h2>
        <div className="space-y-2">
          {priorities.map((p) => {
            const process = processes.find((proc) => proc.id === p.processId)
            return (
              <div key={p.processId} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{process?.name ?? p.processId}</p>
                  <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    Priority {p.score}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{p.drivers.map((d) => d.label).join(' · ')}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
