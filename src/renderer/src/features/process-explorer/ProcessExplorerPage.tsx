import { useEffect, useState } from 'react'
import { newId } from '@shared/id'
import { PROCESS_LIBRARY, type LibraryProcess } from '@shared/process-library'
import type { Organisation, OrgSite, OrgDepartment, OrgFunction, Process, Risk, Control, RiskCategory } from '@shared/types'
import { EmptyState, TagListEditor, ClausePicker, ClauseLinkList } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  environmental_aspect: 'Environmental aspect',
  ohs_hazard: 'OH&S hazard',
  compliance: 'Compliance',
  business: 'Business'
}

/** Click to reveal a small text input + confirm — the one "add a child" interaction, reused at every hierarchy level. */
function AddInline({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string) => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  if (!open) {
    return (
      <button className="btn-ghost text-xs" onClick={() => setOpen(true)}>
        + Add
      </button>
    )
  }

  function submit(): void {
    if (value.trim()) onAdd(value.trim())
    setValue('')
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        className="input py-1 text-xs"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <button className="btn-primary px-2 py-1 text-xs" onClick={submit}>
        Add
      </button>
    </div>
  )
}

function TreeLevel<T extends { id: string }>({
  label,
  items,
  selectedId,
  getName,
  onSelect,
  onAdd,
  addPlaceholder
}: {
  label: string
  items: T[]
  selectedId: string | null
  getName: (item: T) => string
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  addPlaceholder: string
}): JSX.Element {
  return (
    <div className="border-b border-slate-100 py-2 dark:border-slate-700">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
        <AddInline placeholder={addPlaceholder} onAdd={onAdd} />
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">None yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full rounded px-2 py-1 text-left text-sm ${
                  selectedId === item.id
                    ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                onClick={() => onSelect(item.id)}
              >
                {getName(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ProcessExplorerPage(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)
  const removeEntity = useWorkspaceStore((s) => s.removeEntity)

  const organisations = workspace?.organisations ?? []
  const [orgId, setOrgId] = useState<string | null>(null)
  const [siteId, setSiteId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [functionId, setFunctionId] = useState<string | null>(null)
  const [processId, setProcessId] = useState<string | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)

  // Auto-select the first item at each level once data arrives, so the
  // screen is never a dead end after "New workspace" or after migration.
  useEffect(() => {
    if (!orgId && organisations.length > 0) setOrgId(organisations[0].id)
  }, [orgId, organisations])

  const sites = (workspace?.orgSites ?? []).filter((s) => s.organisationId === orgId)
  useEffect(() => {
    if ((!siteId || !sites.some((s) => s.id === siteId)) && sites.length > 0) setSiteId(sites[0].id)
  }, [siteId, sites])

  const departments = (workspace?.orgDepartments ?? []).filter((d) => d.siteId === siteId)
  useEffect(() => {
    if ((!departmentId || !departments.some((d) => d.id === departmentId)) && departments.length > 0) {
      setDepartmentId(departments[0].id)
    } else if (departments.length === 0) {
      setDepartmentId(null)
    }
  }, [departmentId, departments])

  const functions = (workspace?.orgFunctions ?? []).filter((f) => f.departmentId === departmentId)
  useEffect(() => {
    if (functions.length === 0) setFunctionId(null)
  }, [departmentId, functions.length])

  const processes = (workspace?.processes ?? []).filter((p) => p.functionId === functionId)
  const process = processes.find((p) => p.id === processId) ?? null
  const risks = (workspace?.risks ?? []).filter((r) => r.processId === processId)
  const controlsByRisk = new Map<string, Control[]>()
  for (const c of workspace?.controls ?? []) {
    controlsByRisk.set(c.riskId, [...(controlsByRisk.get(c.riskId) ?? []), c])
  }

  async function addOrganisation(name: string): Promise<void> {
    const org: Organisation = { id: newId(), name }
    await upsertEntity('organisations', {}, org)
    setOrgId(org.id)
  }
  async function addSite(name: string): Promise<void> {
    if (!orgId) return
    const site: OrgSite = { id: newId(), organisationId: orgId, name }
    await upsertEntity('org_sites', { organisationId: orgId }, site)
    setSiteId(site.id)
  }
  async function addDepartment(name: string): Promise<void> {
    if (!siteId) return
    const dept: OrgDepartment = { id: newId(), siteId, name }
    await upsertEntity('org_departments', { siteId }, dept)
    setDepartmentId(dept.id)
  }
  async function addFunction(name: string): Promise<void> {
    if (!departmentId) return
    const fn: OrgFunction = { id: newId(), departmentId, name }
    await upsertEntity('org_functions', { departmentId }, fn)
    setFunctionId(fn.id)
  }
  async function addProcess(name: string): Promise<void> {
    if (!functionId) return
    const proc: Process = { id: newId(), functionId, name, inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [] }
    await upsertEntity('processes', { functionId }, proc)
    setProcessId(proc.id)
  }

  async function adoptFromLibrary(lib: LibraryProcess): Promise<void> {
    if (!functionId) return
    const proc: Process = {
      id: newId(),
      functionId,
      name: lib.name,
      description: lib.description,
      inputs: lib.inputs,
      activities: lib.activities,
      outputs: lib.outputs,
      kpis: lib.kpis,
      clauseIds: lib.clauseIds
    }
    await upsertEntity('processes', { functionId }, proc)
    for (const libRisk of lib.risks) {
      const risk: Risk = {
        id: newId(),
        processId: proc.id,
        category: libRisk.category,
        description: libRisk.description,
        likelihood: libRisk.likelihood,
        severity: libRisk.severity
      }
      await upsertEntity('risks', { processId: proc.id }, risk)
      for (const libControl of libRisk.controls) {
        const control: Control = {
          id: newId(),
          riskId: risk.id,
          description: libControl.description,
          controlType: libControl.controlType,
          clauseIds: libControl.clauseIds
        }
        await upsertEntity('controls', { riskId: risk.id }, control)
      }
    }
    setProcessId(proc.id)
    setShowLibrary(false)
  }

  async function updateProcess(patch: Partial<Process>): Promise<void> {
    if (!process) return
    await upsertEntity('processes', { functionId: process.functionId }, { ...process, ...patch })
  }

  async function addRisk(): Promise<void> {
    if (!process) return
    const risk: Risk = { id: newId(), processId: process.id, category: 'business', description: 'New risk', likelihood: 3, severity: 3 }
    await upsertEntity('risks', { processId: process.id }, risk)
  }

  async function updateRisk(risk: Risk, patch: Partial<Risk>): Promise<void> {
    await upsertEntity('risks', { processId: risk.processId }, { ...risk, ...patch })
  }

  async function addControl(risk: Risk): Promise<void> {
    const control: Control = { id: newId(), riskId: risk.id, description: 'New control', clauseIds: [] }
    await upsertEntity('controls', { riskId: risk.id }, control)
  }

  async function updateControl(control: Control, patch: Partial<Control>): Promise<void> {
    await upsertEntity('controls', { riskId: control.riskId }, { ...control, ...patch })
  }

  if (!workspace) return <EmptyState title="Loading…" />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Process Explorer</h1>
      <p className="text-sm text-slate-500">
        Model your organisation as Site → Department → Function → Process, with each process&apos;s risks, controls and the ISO
        clauses they evidence — the backbone for planning audits by process rather than only by clause.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card max-h-[75vh] overflow-y-auto">
          <TreeLevel
            label="Organisation"
            items={organisations}
            selectedId={orgId}
            getName={(o) => o.name}
            onSelect={setOrgId}
            onAdd={addOrganisation}
            addPlaceholder="Organisation name"
          />
          {orgId && (
            <TreeLevel
              label="Site"
              items={sites}
              selectedId={siteId}
              getName={(s) => s.name}
              onSelect={setSiteId}
              onAdd={addSite}
              addPlaceholder="Site name"
            />
          )}
          {siteId && (
            <TreeLevel
              label="Department"
              items={departments}
              selectedId={departmentId}
              getName={(d) => d.name}
              onSelect={setDepartmentId}
              onAdd={addDepartment}
              addPlaceholder="Department name"
            />
          )}
          {departmentId && (
            <TreeLevel
              label="Function"
              items={functions}
              selectedId={functionId}
              getName={(f) => f.name}
              onSelect={setFunctionId}
              onAdd={addFunction}
              addPlaceholder="Function name"
            />
          )}
          {functionId && (
            <TreeLevel
              label="Process"
              items={processes}
              selectedId={processId}
              getName={(p) => p.name}
              onSelect={setProcessId}
              onAdd={addProcess}
              addPlaceholder="Process name"
            />
          )}
          {functionId && (
            <button className="btn-secondary mt-2 w-full justify-center text-xs" onClick={() => setShowLibrary(true)}>
              📚 Adopt from starter library
            </button>
          )}
        </div>

        <div className="space-y-4">
          {showLibrary && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Starter process library</h2>
                <button className="btn-ghost text-xs" onClick={() => setShowLibrary(false)}>
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PROCESS_LIBRARY.map((lib) => (
                  <button
                    key={lib.libraryId}
                    className="rounded-lg border border-slate-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-900/20"
                    onClick={() => adoptFromLibrary(lib)}
                  >
                    <p className="font-medium">{lib.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{lib.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {lib.risks.length} risk{lib.risks.length === 1 ? '' : 's'} ·{' '}
                      {lib.risks.reduce((n, r) => n + r.controls.length, 0)} control(s)
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!process ? (
            <EmptyState
              title={functionId ? 'No process selected' : 'Build out your organisation on the left'}
              hint={
                functionId
                  ? 'Select a process, add a new one, or adopt one from the starter library.'
                  : 'Add an Organisation, Site, Department and Function, then add or adopt a Process.'
              }
            />
          ) : (
            <>
              <div className="card space-y-3">
                <input
                  className="input text-lg font-semibold"
                  value={process.name}
                  onChange={(e) => updateProcess({ name: e.target.value })}
                />
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Description"
                  value={process.description ?? ''}
                  onChange={(e) => updateProcess({ description: e.target.value })}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TagListEditor label="Inputs" items={process.inputs} onChange={(v) => updateProcess({ inputs: v })} />
                  <TagListEditor label="Activities" items={process.activities} onChange={(v) => updateProcess({ activities: v })} />
                  <TagListEditor label="Outputs" items={process.outputs} onChange={(v) => updateProcess({ outputs: v })} />
                  <TagListEditor label="KPIs" items={process.kpis} onChange={(v) => updateProcess({ kpis: v })} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Relevant ISO clauses</p>
                  <ClauseLinkList
                    clauseIds={process.clauseIds}
                    onRemove={(id) => updateProcess({ clauseIds: process.clauseIds.filter((c) => c !== id) })}
                  />
                  <div className="mt-1 max-w-sm">
                    <ClausePicker
                      onPick={(id) =>
                        !process.clauseIds.includes(id) && updateProcess({ clauseIds: [...process.clauseIds, id] })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Risks &amp; controls</h2>
                  <button className="btn-secondary text-xs" onClick={addRisk}>
                    + Add risk
                  </button>
                </div>
                {risks.length === 0 ? (
                  <p className="text-sm text-slate-400">No risks recorded for this process yet.</p>
                ) : (
                  <div className="space-y-4">
                    {risks.map((risk) => (
                      <div key={risk.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                        <input
                          className="input w-full py-1 text-sm font-medium"
                          value={risk.description}
                          onChange={(e) => updateRisk(risk, { description: e.target.value })}
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            className="input w-auto py-1 text-xs"
                            value={risk.category}
                            onChange={(e) => updateRisk(risk, { category: e.target.value as RiskCategory })}
                          >
                            {Object.entries(RISK_CATEGORY_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <label className="text-xs text-slate-400">
                            Likelihood
                            <select
                              className="input ml-1 w-14 py-1 text-xs"
                              value={risk.likelihood}
                              onChange={(e) => updateRisk(risk, { likelihood: Number(e.target.value) as Risk['likelihood'] })}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-xs text-slate-400">
                            Severity
                            <select
                              className="input ml-1 w-14 py-1 text-xs"
                              value={risk.severity}
                              onChange={(e) => updateRisk(risk, { severity: Number(e.target.value) as Risk['severity'] })}
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            className="btn-ghost ml-auto text-xs text-status-major"
                            onClick={() => removeEntity('risks', risk.id)}
                          >
                            Remove risk
                          </button>
                        </div>

                        <div className="ml-2 mt-3 space-y-2 border-l-2 border-slate-100 pl-3 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase text-slate-400">Controls</p>
                            <button className="btn-ghost text-xs" onClick={() => addControl(risk)}>
                              + Add control
                            </button>
                          </div>
                          {(controlsByRisk.get(risk.id) ?? []).map((control) => (
                            <div key={control.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  className="input flex-1 py-1 text-sm"
                                  value={control.description}
                                  onChange={(e) => updateControl(control, { description: e.target.value })}
                                />
                                <button
                                  className="btn-ghost text-xs text-status-major"
                                  onClick={() => removeEntity('controls', control.id)}
                                >
                                  ✕
                                </button>
                              </div>
                              <ClauseLinkList
                                clauseIds={control.clauseIds}
                                onRemove={(id) => updateControl(control, { clauseIds: control.clauseIds.filter((c) => c !== id) })}
                              />
                              <div className="max-w-sm">
                                <ClausePicker
                                  onPick={(id) =>
                                    !control.clauseIds.includes(id) &&
                                    updateControl(control, { clauseIds: [...control.clauseIds, id] })
                                  }
                                />
                              </div>
                            </div>
                          ))}
                          {(controlsByRisk.get(risk.id) ?? []).length === 0 && (
                            <p className="text-xs text-slate-400">No controls recorded for this risk yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
