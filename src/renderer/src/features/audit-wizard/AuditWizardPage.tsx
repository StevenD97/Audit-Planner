import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { newId } from '@shared/id'
import { getAuditableClauses } from '@shared/knowledge-base'
import { computeOverallReadinessV2, type ScoringV2Context } from '@shared/engine/scoringV2'
import { riskWeightToLevel } from '@shared/engine/scoring'
import type {
  AuditFinding,
  AuditProject,
  AuditType,
  ChecklistItem,
  Clause,
  Department,
  EvidenceStatus,
  GapRating,
  RiskLevel,
  Site,
  StandardId
} from '@shared/types'
import { RatingBadge } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

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

const RATINGS: { key: GapRating; label: string }[] = [
  { key: 'conforms', label: 'Conforms' },
  { key: 'ofi', label: 'OFI' },
  { key: 'minor_nc', label: 'Minor NC' },
  { key: 'major_nc', label: 'Major NC' }
]

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  requested: 'Requested',
  obtained: 'Obtained',
  not_available: 'Not available',
  not_applicable: 'N/A'
}

function nowIso(): string {
  return new Date().toISOString()
}

export default function AuditWizardPage(): JSX.Element {
  const [params, setParams] = useSearchParams()
  const workspace = useWorkspaceStore((s) => s.workspace)

  const projectId = params.get('project')
  const step = params.get('step') ?? 'context'
  const project = workspace?.auditProjects.find((p) => p.id === projectId) ?? null

  const clauses = useMemo(
    () => (project ? project.standards.flatMap((s) => getAuditableClauses(s)) : []),
    [project?.standards.join(',')]
  )

  function goTo(nextStep: string, projId: string): void {
    setParams({ project: projId, step: nextStep })
  }

  if (!project || step === 'context') {
    return <ContextStep project={project} onSaved={(p, freshClauses) => goTo(freshClauses[0]?.id ?? 'complete', p.id)} />
  }

  if (step === 'complete') {
    return <CompleteStep project={project} clauses={clauses} onEditContext={() => goTo('context', project.id)} />
  }

  const idx = Math.max(
    0,
    clauses.findIndex((c) => c.id === step)
  )
  const clause = clauses[idx] ?? clauses[0]
  if (!clause) {
    return <CompleteStep project={project} clauses={clauses} onEditContext={() => goTo('context', project.id)} />
  }

  return (
    <ClauseStep
      project={project}
      clauses={clauses}
      clause={clause}
      index={idx}
      onJump={(clauseId) => goTo(clauseId, project.id)}
      onPrevious={() => goTo(idx > 0 ? clauses[idx - 1].id : 'context', project.id)}
      onNext={() => goTo(idx < clauses.length - 1 ? clauses[idx + 1].id : 'complete', project.id)}
    />
  )
}

// ---- Step 1: context + standards ----

function ContextStep({
  project,
  onSaved
}: {
  project: AuditProject | null
  onSaved: (project: AuditProject, clauses: Clause[]) => void
}): JSX.Element {
  const createAuditProject = useWorkspaceStore((s) => s.createAuditProject)
  const updateAuditProject = useWorkspaceStore((s) => s.updateAuditProject)

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
    if (project) {
      setName(project.name)
      setStandards(project.standards)
      setScopeStatement(project.scopeStatement)
      setSites(project.sites)
      setDepartments(project.departments)
      setAuditType(project.auditType)
      setStartDate(project.startDate ?? '')
      setDurationDays(project.durationDays ?? 2)
      setLeadAuditor(project.leadAuditor ?? '')
    }
  }, [project?.id])

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

  async function onNext(): Promise<void> {
    const resolvedStandards = standards.length ? standards : (['iso14001'] as StandardId[])
    const payload = {
      name: name || 'Untitled Audit',
      standards: resolvedStandards,
      scopeStatement,
      sites,
      departments,
      auditType,
      startDate: startDate || undefined,
      durationDays,
      leadAuditor: leadAuditor || undefined
    }
    let saved: AuditProject
    if (project) {
      await updateAuditProject(project.id, payload)
      saved = { ...project, ...payload }
    } else {
      saved = await createAuditProject(payload)
    }
    const freshClauses = resolvedStandards.flatMap((s) => getAuditableClauses(s))
    onSaved(saved, freshClauses)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WizardProgress label="Step 1 — Context &amp; standards" />
      <h1 className="text-2xl font-bold">{project ? 'Edit audit context' : 'Start Audit Plan'}</h1>
      <p className="text-sm text-slate-500">
        Set the scope once here, then work through every in-scope clause to get audit-ready — what the auditor will be
        checking for, the evidence to have on hand, and your own honest self-assessment — building your readiness
        score and action plan as you go.
      </p>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Standard(s)</h2>
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
            sub-clause numbering — the app maps these via conceptual equivalence, not identical numbers.
          </p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Name &amp; scope</h2>
        <input className="input" placeholder="Audit name (e.g. Site A — Annual Internal Audit 2026)" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="input min-h-[80px]"
          placeholder="Scope statement — boundaries, activities, products/services covered…"
          value={scopeStatement}
          onChange={(e) => setScopeStatement(e.target.value)}
        />
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Sites &amp; departments</h2>
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
                  onChange={(e) => setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, name: e.target.value } : d)))}
                />
                <select
                  className="input max-w-[160px]"
                  value={dept.siteId}
                  onChange={(e) => setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, siteId: e.target.value } : d)))}
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
                  onChange={(e) => setDepartments((prev) => prev.map((d) => (d.id === dept.id ? { ...d, processOwner: e.target.value } : d)))}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Type, dates &amp; team</h2>
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={auditType} onChange={(e) => setAuditType(e.target.value as AuditType)}>
            {AUDIT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Lead auditor (visiting)"
            value={leadAuditor}
            onChange={(e) => setLeadAuditor(e.target.value)}
          />
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

      <div className="flex justify-end">
        <button className="btn-primary" onClick={onNext}>
          Next: start self-assessment →
        </button>
      </div>
    </div>
  )
}

// ---- Steps 2..N: one per in-scope clause ----

function ClauseStep({
  project,
  clauses,
  clause,
  index,
  onJump,
  onPrevious,
  onNext
}: {
  project: AuditProject
  clauses: Clause[]
  clause: Clause
  index: number
  onJump: (clauseId: string) => void
  onPrevious: () => void
  onNext: () => void
}): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertGapAssessment = useWorkspaceStore((s) => s.upsertGapAssessment)
  const upsertEvidenceItem = useWorkspaceStore((s) => s.upsertEvidenceItem)
  const bulkUpsertEvidenceItems = useWorkspaceStore((s) => s.bulkUpsertEvidenceItems)
  const upsertChecklistItem = useWorkspaceStore((s) => s.upsertChecklistItem)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)

  const gapAssessments = workspace?.gapAssessments ?? []
  const evidenceItems = workspace?.evidencePlanItems ?? []
  const auditFindings = workspace?.auditFindings ?? []
  const checklistItems = workspace?.checklistItems ?? []

  const ga = gapAssessments.find((g) => g.auditProjectId === project.id && g.clauseId === clause.id)
  const clauseEvidence = useMemo(
    () => evidenceItems.filter((e) => e.auditProjectId === project.id && e.clauseId === clause.id),
    [evidenceItems, project.id, clause.id]
  )
  const clauseChecklist = useMemo(
    () => checklistItems.filter((c) => c.auditProjectId === project.id && c.clauseId === clause.id),
    [checklistItems, project.id, clause.id]
  )

  // Question -> checklist item id, resolved once and reused for every edit to
  // that question. Without this, two edits fired close together (e.g. a
  // clear-then-set from a form-fill, or just fast typing before the store's
  // async refresh lands) would each compute "no existing item yet" from the
  // same stale clauseChecklist and mint two different ids for one question.
  const checklistIdsRef = useRef<Map<string, string>>(new Map())

  function resolveChecklistId(question: string): string {
    const key = `${clause.id}:${question}`
    const cached = checklistIdsRef.current.get(key)
    if (cached) return cached
    const id = clauseChecklist.find((c) => c.question === question)?.id ?? newId()
    checklistIdsRef.current.set(key, id)
    return id
  }

  async function saveAnswer(question: string, patch: Partial<{ response: string; evidenceLocation: string }>): Promise<void> {
    const id = resolveChecklistId(question)
    const existing = clauseChecklist.find((c) => c.id === id)
    const response = patch.response ?? existing?.response ?? ''
    const maxWeight = Math.max(1, ...clause.riskPrompts.map((r) => r.riskWeight))
    const item: ChecklistItem = {
      id,
      auditProjectId: project.id,
      clauseId: clause.id,
      question,
      riskLevel: existing?.riskLevel ?? riskWeightToLevel(maxWeight),
      process: existing?.process ?? clause.processOwnerRoles[0],
      status: response.trim() ? 'answered' : 'pending',
      response: patch.response ?? existing?.response,
      evidenceLocation: patch.evidenceLocation ?? existing?.evidenceLocation
    }
    await upsertChecklistItem(item)
  }

  // Auto-generate evidence rows for this clause the first time it's visited.
  // Guarded synchronously (not via the async clauseEvidence read) so a
  // double-invoke (React StrictMode, or fast Previous/Next navigation before
  // the write lands) can't create duplicate rows for the same clause.
  const evidenceEnsuredRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const key = `${project.id}:${clause.id}`
    if (evidenceEnsuredRef.current.has(key)) return
    evidenceEnsuredRef.current.add(key)
    const existingDescriptions = new Set(clauseEvidence.map((e) => e.description))
    const missing = clause.evidenceRequired.filter((e) => !existingDescriptions.has(e.description))
    if (missing.length === 0) return
    void bulkUpsertEvidenceItems(
      missing.map((e) => ({
        id: newId(),
        auditProjectId: project.id,
        clauseId: clause.id,
        category: e.category,
        description: e.description,
        status: 'requested' as EvidenceStatus,
        locationOwner: e.typicalSource
      }))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clause.id, project.id])

  const ctx: ScoringV2Context = {
    gapAssessments,
    auditFindings,
    correctiveActions: workspace?.correctiveActions ?? [],
    complianceObligations: workspace?.complianceObligations ?? [],
    complianceEvaluations: workspace?.complianceEvaluations ?? [],
    evidencePlanItems: evidenceItems,
    risks: workspace?.risks ?? [],
    controls: workspace?.controls ?? [],
    processes: workspace?.processes ?? []
  }
  const liveScore = computeOverallReadinessV2(
    clauses.map((c) => c.id),
    (id) => id,
    project.id,
    ctx
  ).score

  const ratedCount = clauses.filter((c) => gapAssessments.some((g) => g.auditProjectId === project.id && g.clauseId === c.id)).length

  async function setRating(rating: GapRating): Promise<void> {
    await upsertGapAssessment({
      id: ga?.id ?? newId(),
      auditProjectId: project.id,
      clauseId: clause.id,
      rating,
      narrative: ga?.narrative,
      recommendedAction: ga?.recommendedAction,
      riskRating: ga?.riskRating,
      assessedBy: ga?.assessedBy,
      assessedAt: nowIso()
    })
    if (rating === 'minor_nc' || rating === 'major_nc') {
      const alreadyRaised = auditFindings.some((f) => f.auditProjectId === project.id && f.clauseId === clause.id)
      if (!alreadyRaised) {
        const finding: AuditFinding = {
          id: newId(),
          auditProjectId: project.id,
          clauseId: clause.id,
          category: rating,
          description: ga?.narrative?.trim() || 'Gap self-identified during audit preparation — close before the audit.',
          raisedAt: nowIso()
        }
        await upsertEntity('audit_findings', { auditProjectId: project.id }, finding)
      }
    }
  }

  async function updateField(patch: Partial<{ narrative: string; recommendedAction: string; riskRating: RiskLevel }>): Promise<void> {
    await upsertGapAssessment({
      id: ga?.id ?? newId(),
      auditProjectId: project.id,
      clauseId: clause.id,
      rating: ga?.rating ?? 'not_assessed',
      narrative: patch.narrative ?? ga?.narrative,
      recommendedAction: patch.recommendedAction ?? ga?.recommendedAction,
      riskRating: patch.riskRating ?? ga?.riskRating,
      assessedBy: ga?.assessedBy,
      assessedAt: nowIso()
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <div className="card max-h-[80vh] space-y-0.5 overflow-y-auto">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {ratedCount} of {clauses.length} clauses assessed
        </p>
        {clauses.map((c, i) => {
          const cga = gapAssessments.find((g) => g.auditProjectId === project.id && g.clauseId === c.id)
          return (
            <button
              key={c.id}
              onClick={() => onJump(c.id)}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                i === index ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  !cga || cga.rating === 'not_assessed' ? 'bg-status-pending/40' : 'bg-status-conforms'
                }`}
              />
              §{c.clauseNumber} {c.title}
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <WizardProgress label={`Clause ${index + 1} of ${clauses.length}`} />
          <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            Readiness so far: {liveScore}%
          </span>
        </div>

        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {clause.standardId === 'iso14001' ? 'ISO 14001' : 'ISO 45001'}
          </p>
          <h1 className="text-xl font-bold">
            §{clause.clauseNumber} {clause.title}
          </h1>
        </div>

        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Context</h2>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Requirement</p>
            <p className="text-sm">{clause.requirementSummary}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Explanation</p>
            <p className="text-sm">{clause.explanation}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">What the auditor checks for</p>
            <p className="text-sm">{clause.auditIntent}</p>
          </div>
          {clause.processOwnerRoles.length > 0 && (
            <p className="text-xs text-slate-500">Who usually owns this: {clause.processOwnerRoles.join(', ')}</p>
          )}
          {clause.mandatoryDocumentedInfo.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Mandatory documented information</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {clause.mandatoryDocumentedInfo.map((m, i) => (
                  <li key={i}>
                    {m.description} <span className="chip bg-slate-100 dark:bg-slate-700">{m.kind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {clause.interviewQuestions.length > 0 && (
          <section className="card space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Questions you may be asked</h2>
              <p className="text-xs text-slate-500">Answer each one now, and note where the evidence backing it lives.</p>
            </div>
            <div className="space-y-3">
              {clause.interviewQuestions.map((q, i) => {
                const item = clauseChecklist.find((c) => c.question === q.question)
                return (
                  <div key={i} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                    <p className="text-sm">
                      <span className="chip mr-2 bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{q.audienceRole}</span>
                      {q.question}
                    </p>
                    <textarea
                      className="input mt-2 min-h-[50px]"
                      placeholder="Your answer…"
                      value={item?.response ?? ''}
                      onChange={(e) => saveAnswer(q.question, { response: e.target.value })}
                    />
                    <input
                      className="input mt-2"
                      placeholder="Evidence file location (e.g. a file path, folder, or link)"
                      value={item?.evidenceLocation ?? ''}
                      onChange={(e) => saveAnswer(q.question, { evidenceLocation: e.target.value })}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="card space-y-2">
          <h2 className="text-lg font-semibold">Evidence</h2>
          {clauseEvidence.length === 0 ? (
            <p className="text-sm text-slate-400">No specific evidence beyond general documented information.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                  <th className="py-2">Evidence</th>
                  <th>Status</th>
                  <th>Owner / location</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {clauseEvidence.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top dark:border-slate-700">
                    <td className="max-w-xs py-2">{item.description}</td>
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
          )}
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Self-assessment</h2>
          <p className="text-xs text-slate-500">
            Rate this honestly against what the auditor would actually find today — this is how you find the gaps
            before they do.
          </p>
          <div className="flex flex-wrap gap-2">
            {RATINGS.map((r) => (
              <button key={r.key} onClick={() => setRating(r.key)} className={ga?.rating === r.key ? '' : 'opacity-40 hover:opacity-100'}>
                <RatingBadge rating={r.key} />
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Notes</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="What's the current state here? Why does this rating apply?"
              value={ga?.narrative ?? ''}
              onChange={(e) => updateField({ narrative: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Recommended action</label>
            <textarea
              className="input min-h-[60px]"
              placeholder="What needs to happen before the audit to close this gap? (feeds the action plan)"
              value={ga?.recommendedAction ?? ''}
              onChange={(e) => updateField({ recommendedAction: e.target.value })}
            />
          </div>
          <div className="max-w-xs">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">Risk</label>
            <select
              className="input"
              value={ga?.riskRating ?? ''}
              onChange={(e) => updateField({ riskRating: (e.target.value || undefined) as RiskLevel })}
            >
              <option value="">—</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </section>

        <div className="flex justify-between">
          <button className="btn-secondary" onClick={onPrevious}>
            ← Previous
          </button>
          <button className="btn-primary" onClick={onNext}>
            {index < clauses.length - 1 ? 'Next clause →' : 'Finish self-assessment →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Final step: readiness + auto-assembled action plan ----

function CompleteStep({
  project,
  clauses,
  onEditContext
}: {
  project: AuditProject
  clauses: Clause[]
  onEditContext: () => void
}): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const addReadinessSnapshot = useWorkspaceStore((s) => s.addReadinessSnapshot)
  const [snapshotTaken, setSnapshotTaken] = useState(false)

  const gapAssessments = workspace?.gapAssessments ?? []
  const auditFindings = workspace?.auditFindings ?? []

  const ctx: ScoringV2Context = {
    gapAssessments,
    auditFindings,
    correctiveActions: workspace?.correctiveActions ?? [],
    complianceObligations: workspace?.complianceObligations ?? [],
    complianceEvaluations: workspace?.complianceEvaluations ?? [],
    evidencePlanItems: workspace?.evidencePlanItems ?? [],
    risks: workspace?.risks ?? [],
    controls: workspace?.controls ?? [],
    processes: workspace?.processes ?? []
  }
  const overall = computeOverallReadinessV2(
    clauses.map((c) => c.id),
    (id) => id,
    project.id,
    ctx
  )

  const actionPlan = clauses
    .map((c) => ({ clause: c, ga: gapAssessments.find((g) => g.auditProjectId === project.id && g.clauseId === c.id) }))
    .filter((row) => row.ga && row.ga.rating !== 'conforms' && row.ga.rating !== 'not_assessed')

  async function takeSnapshot(): Promise<void> {
    const worst = [...(overall.children ?? [])].sort((a, b) => a.score - b.score)
    await addReadinessSnapshot({
      id: newId(),
      auditProjectId: project.id,
      takenAt: nowIso(),
      overallPct: overall.score,
      byClause: (overall.children ?? []).map((c) => ({ clauseId: c.id, score: c.score })),
      highRiskGaps: worst.filter((c) => c.score < 50).map((c) => ({ clauseId: c.id, reason: c.drivers.map((d) => d.label).join('; ') || 'low score' })),
      recommendedActions: worst.filter((c) => c.score < 80).map((c) => `${c.id}: address ${c.drivers[0]?.label ?? 'outstanding gaps'}`)
    })
    setSnapshotTaken(true)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WizardProgress label="Self-assessment complete" />
      <h1 className="text-2xl font-bold">{project.name} — your audit-readiness summary</h1>

      <div className="card flex flex-col items-center py-8">
        <p className="text-sm text-slate-500">Overall readiness</p>
        <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{overall.score}%</p>
        <button className="btn-secondary mt-4" onClick={takeSnapshot} disabled={snapshotTaken}>
          {snapshotTaken ? 'Snapshot saved' : 'Take readiness snapshot'}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-1 text-lg font-semibold">Action plan</h2>
        <p className="mb-3 text-sm text-slate-500">
          Assembled automatically from your self-assessment — every clause rated below &quot;Conforms&quot;, with the
          action needed to close it before the audit and whether it's being tracked as a finding.
        </p>
        {actionPlan.length === 0 ? (
          <p className="text-sm text-slate-400">Every assessed clause conforms — you're in good shape here.</p>
        ) : (
          <div className="space-y-2">
            {actionPlan.map(({ clause, ga }) => {
              const hasFinding = auditFindings.some((f) => f.auditProjectId === project.id && f.clauseId === clause.id)
              return (
                <div key={clause.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      §{clause.clauseNumber} {clause.title}
                    </p>
                    <RatingBadge rating={ga!.rating} />
                  </div>
                  {ga?.recommendedAction && <p className="mt-1 text-sm">{ga.recommendedAction}</p>}
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    {ga?.riskRating && <span>Risk: {ga.riskRating}</span>}
                    {hasFinding && (
                      <Link to="/findings" className="text-brand-600 hover:underline dark:text-brand-400">
                        View finding →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={onEditContext}>
          ← Edit context
        </button>
        <Link to={`/programme?project=${project.id}`} className="btn-primary">
          Go to Programme Builder
        </Link>
        <Link to="/findings" className="btn-secondary">
          View Findings &amp; Actions
        </Link>
        <Link to="/dashboard" className="btn-ghost">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

function WizardProgress({ label }: { label: string }): JSX.Element {
  return <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{label}</p>
}
