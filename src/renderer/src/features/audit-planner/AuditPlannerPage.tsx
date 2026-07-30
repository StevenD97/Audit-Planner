import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { newId } from '@shared/id'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { AuditType, Department, Site, StandardId } from '@shared/types'

const STANDARD_OPTIONS: { id: StandardId; label: string; description: string }[] = [
  { id: 'iso14001', label: 'ISO 14001', description: 'Environmental Management Systems (BS EN ISO 14001:2026)' },
  { id: 'iso45001', label: 'ISO 45001', description: 'Occupational Health & Safety Management Systems (2018+A1:2024)' }
]

const AUDIT_TYPES: { id: AuditType; label: string }[] = [
  { id: 'internal', label: 'Internal audit' },
  { id: 'external_stage1', label: 'External — Stage 1' },
  { id: 'external_stage2', label: 'External — Stage 2' },
  { id: 'surveillance', label: 'Surveillance' },
  { id: 'certification', label: 'Certification / recertification' }
]

export default function AuditPlannerPage(): JSX.Element {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const createAuditProject = useWorkspaceStore((s) => s.createAuditProject)
  const updateAuditProject = useWorkspaceStore((s) => s.updateAuditProject)

  const editingId = params.get('project')
  const editing = workspace?.auditProjects.find((p) => p.id === editingId)

  const [name, setName] = useState('')
  const [standards, setStandards] = useState<StandardId[]>(['iso14001'])
  const [scopeStatement, setScopeStatement] = useState('')
  const [sites, setSites] = useState<Site[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [auditType, setAuditType] = useState<AuditType>('internal')
  const [startDate, setStartDate] = useState('')
  const [durationDays, setDurationDays] = useState(2)
  const [leadAuditor, setLeadAuditor] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setStandards(editing.standards)
      setScopeStatement(editing.scopeStatement)
      setSites(editing.sites)
      setDepartments(editing.departments)
      setAuditType(editing.auditType)
      setStartDate(editing.startDate ?? '')
      setDurationDays(editing.durationDays ?? 2)
      setLeadAuditor(editing.leadAuditor ?? '')
    }
  }, [editing?.id])

  function toggleStandard(id: StandardId): void {
    setStandards((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  function addSite(): void {
    setSites((prev) => [...prev, { id: newId(), name: `Site ${prev.length + 1}` }])
  }

  function addDepartment(): void {
    if (sites.length === 0) return
    setDepartments((prev) => [...prev, { id: newId(), name: `Department ${prev.length + 1}`, siteId: sites[0].id }])
  }

  async function onSave(): Promise<void> {
    const payload = {
      name: name || 'Untitled Audit',
      standards: standards.length ? standards : (['iso14001'] as StandardId[]),
      scopeStatement,
      sites,
      departments,
      auditType,
      startDate: startDate || undefined,
      durationDays,
      leadAuditor: leadAuditor || undefined
    }
    if (editing) {
      await updateAuditProject(editing.id, payload)
      navigate(`/programme?project=${editing.id}`)
    } else {
      const project = await createAuditProject(payload)
      navigate(`/programme?project=${project.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{editing ? 'Edit Audit' : 'Audit Planner'}</h1>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">1. Standard(s)</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {STANDARD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => toggleStandard(opt.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                standards.includes(opt.id)
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
              }`}
            >
              <p className="font-semibold">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.description}</p>
            </button>
          ))}
        </div>
        {standards.length === 2 && (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Combined audit selected. ISO 14001 and ISO 45001 share the Annex SL structure but not identical
            sub-clause numbering (e.g. 45001 has no 14001 equivalent for worker participation, 5.4). The app maps
            these via conceptual equivalence, not identical numbers — see each clause&apos;s cross-standard link.
          </p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">2. Name &amp; scope</h2>
        <input className="input" placeholder="Audit name (e.g. Site A — Annual Internal Audit 2026)" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="input min-h-[80px]"
          placeholder="Scope statement — boundaries, activities, products/services covered…"
          value={scopeStatement}
          onChange={(e) => setScopeStatement(e.target.value)}
        />
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">3. Sites &amp; departments</h2>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Sites</p>
            <button className="btn-secondary" onClick={addSite}>
              + Add site
            </button>
          </div>
          <div className="space-y-2">
            {sites.map((site) => (
              <input
                key={site.id}
                className="input"
                value={site.name}
                onChange={(e) => setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, name: e.target.value } : s)))}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Departments</p>
            <button className="btn-secondary" onClick={addDepartment} disabled={sites.length === 0}>
              + Add department
            </button>
          </div>
          <div className="space-y-2">
            {departments.map((dept) => (
              <div key={dept.id} className="flex gap-2">
                <input
                  className="input"
                  value={dept.name}
                  onChange={(e) =>
                    setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, name: e.target.value } : d)))
                  }
                />
                <select
                  className="input max-w-[160px]"
                  value={dept.siteId}
                  onChange={(e) =>
                    setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, siteId: e.target.value } : d)))
                  }
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input max-w-[180px]"
                  placeholder="Process owner"
                  value={dept.processOwner ?? ''}
                  onChange={(e) =>
                    setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, processOwner: e.target.value } : d)))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">4. Type, dates &amp; team</h2>
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={auditType} onChange={(e) => setAuditType(e.target.value as AuditType)}>
            {AUDIT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Lead auditor" value={leadAuditor} onChange={(e) => setLeadAuditor(e.target.value)} />
          <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input
            className="input"
            type="number"
            min={0.5}
            step={0.5}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            placeholder="Duration (days)"
          />
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold">5. Review &amp; create</h2>
        <p className="mb-4 text-sm text-slate-500">
          {name || 'Untitled Audit'} — {standards.join(' + ')} — {sites.length} site(s), {departments.length} department(s) —{' '}
          {durationDays} day(s)
        </p>
        <button className="btn-primary" onClick={onSave}>
          {editing ? 'Save changes' : 'Create audit project'}
        </button>
      </section>
    </div>
  )
}
