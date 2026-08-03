import { useState } from 'react'
import { newId } from '@shared/id'
import { recommendSampleSize, ARTEFACT_LABELS, ARTEFACT_GUIDANCE } from '@shared/engine/sampling'
import type { SamplingPlan, SamplingArtefactTypeValue, SamplingMethodType, RiskLevel } from '@shared/types'
import { AuditProjectPicker, useCurrentAuditProject, TagListEditor } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const METHOD_LABELS: Record<SamplingMethodType, string> = {
  judgment: 'Judgment',
  risk_based: 'Risk-based',
  random: 'Random',
  stratified: 'Stratified'
}

export default function SamplingPlansPage(): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)
  const removeEntity = useWorkspaceStore((s) => s.removeEntity)

  const [artefactType, setArtefactType] = useState<SamplingArtefactTypeValue>('training_records')
  const [method, setMethod] = useState<SamplingMethodType>('risk_based')
  const [populationSize, setPopulationSize] = useState(20)
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium')

  if (!project) return <AuditProjectPicker />

  const plans = (workspace?.samplingPlans ?? []).filter((p) => p.auditProjectId === project.id)
  const recommendation = recommendSampleSize(populationSize, method, riskLevel)

  async function savePlan(): Promise<void> {
    const plan: SamplingPlan = {
      id: newId(),
      auditProjectId: project!.id,
      artefactType,
      method,
      populationSize,
      sampleSize: recommendation.sampleSize,
      rationale: recommendation.rationale,
      selectedItems: []
    }
    await upsertEntity('sampling_plans', { auditProjectId: project!.id }, plan)
  }

  async function updateSelectedItems(plan: SamplingPlan, items: string[]): Promise<void> {
    const updated: SamplingPlan = { ...plan, selectedItems: items }
    await upsertEntity('sampling_plans', { auditProjectId: plan.auditProjectId }, updated)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sampling Plans</h1>
      <AuditProjectPicker />

      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">New sampling plan</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="text-xs text-slate-400">
            Artefact type
            <select
              className="input mt-1"
              value={artefactType}
              onChange={(e) => setArtefactType(e.target.value as SamplingArtefactTypeValue)}
            >
              {Object.entries(ARTEFACT_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Method
            <select className="input mt-1" value={method} onChange={(e) => setMethod(e.target.value as SamplingMethodType)}>
              {Object.entries(METHOD_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Population size
            <input
              type="number"
              min={0}
              className="input mt-1"
              value={populationSize}
              onChange={(e) => setPopulationSize(Number(e.target.value) || 0)}
            />
          </label>
          {method === 'risk_based' && (
            <label className="text-xs text-slate-400">
              Risk level
              <select className="input mt-1" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          )}
        </div>

        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
          <p className="text-sm font-semibold">
            Recommended sample size: <span className="text-brand-600 dark:text-brand-400">{recommendation.sampleSize}</span> of{' '}
            {populationSize}
          </p>
          <p className="mt-1 text-xs text-slate-500">{recommendation.rationale}</p>
          <p className="mt-1 text-xs text-slate-500">{ARTEFACT_GUIDANCE[artefactType]}</p>
        </div>

        <button className="btn-primary" onClick={savePlan}>
          Save sampling plan
        </button>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-slate-500">No sampling plans saved for this audit yet.</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {ARTEFACT_LABELS[plan.artefactType]} — {METHOD_LABELS[plan.method]}
                </p>
                <button className="btn-ghost text-xs text-status-major" onClick={() => removeEntity('sampling_plans', plan.id)}>
                  Remove
                </button>
              </div>
              <p className="text-sm">
                Sample <strong>{plan.sampleSize}</strong> of <strong>{plan.populationSize}</strong>
              </p>
              <p className="text-xs text-slate-500">{plan.rationale}</p>
              <TagListEditor
                label="Selected items"
                items={plan.selectedItems}
                onChange={(v) => updateSelectedItems(plan, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
