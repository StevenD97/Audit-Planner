import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getClausesByStandard,
  getClause,
  searchClauses,
  resolveRelatedClauses,
  resolveCrossStandardEquivalents
} from '@shared/knowledge-base'
import type { Clause, StandardId } from '@shared/types'
import { ClauseChip, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { newId } from '@shared/id'

const TABS = ['Requirement', 'Explanation', 'Audit intent', 'Evidence', 'Questions', 'Findings', 'Related'] as const

export default function ClauseExplorerPage(): JSX.Element {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const standardFilter = (params.get('standard') as StandardId) || 'iso14001'
  const selectedClauseNumber = params.get('clause')

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Requirement')
  const [onlyInScope, setOnlyInScope] = useState(false)

  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const bulkUpsertChecklistItems = useWorkspaceStore((s) => s.bulkUpsertChecklistItems)

  const clauses: Clause[] = useMemo(() => {
    let list = q ? searchClauses(q) : getClausesByStandard(standardFilter)
    if (onlyInScope && project) {
      list = list.filter((c) => project.standards.includes(c.standardId))
    }
    return list
  }, [q, standardFilter, onlyInScope, project])

  const selected = selectedClauseNumber ? getClause(standardFilter, selectedClauseNumber) : clauses.find((c) => !c.isContainer)

  function selectClause(c: Clause): void {
    setParams({ standard: c.standardId, clause: c.clauseNumber })
  }

  async function addToChecklist(): Promise<void> {
    if (!selected || !project) return
    const items = selected.interviewQuestions.map((q) => ({
      id: newId(),
      auditProjectId: project.id,
      clauseId: selected.id,
      question: q.question,
      riskLevel: 'medium' as const,
      status: 'pending' as const
    }))
    if (items.length === 0) return
    await bulkUpsertChecklistItems(items)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card max-h-[80vh] overflow-y-auto">
        <div className="mb-3 flex gap-2">
          <select
            className="input"
            value={standardFilter}
            onChange={(e) => setParams({ standard: e.target.value })}
          >
            <option value="iso14001">ISO 14001</option>
            <option value="iso45001">ISO 45001</option>
          </select>
        </div>
        {project && (
          <label className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={onlyInScope} onChange={(e) => setOnlyInScope(e.target.checked)} />
            Only show clauses in current audit scope
          </label>
        )}
        <ul className="space-y-0.5">
          {clauses.map((c) => {
            const depth = c.clauseNumber.split('.').length - 1
            return (
              <li key={c.id}>
                <button
                  onClick={() => selectClause(c)}
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                  className={`w-full rounded-lg py-1.5 pr-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    selected?.id === c.id ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : ''
                  } ${c.isContainer ? 'text-slate-500' : ''}`}
                >
                  §{c.clauseNumber} {c.title}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="card">
        {!selected ? (
          <p className="text-sm text-slate-500">Select a clause to view details.</p>
        ) : (
          <>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {selected.standardId === 'iso14001' ? 'ISO 14001' : 'ISO 45001'}
                </p>
                <h1 className="text-xl font-bold">
                  §{selected.clauseNumber} {selected.title}
                </h1>
              </div>
              {project && !selected.isContainer && (
                <button className="btn-secondary" onClick={addToChecklist}>
                  + Add questions to checklist
                </button>
              )}
            </div>

            {selected.assumptions && selected.assumptions.length > 0 && (
              <div className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <strong>Assumption:</strong> {selected.assumptions.join(' ')}
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200 pb-2 dark:border-slate-700">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="text-sm leading-relaxed">
              {activeTab === 'Requirement' && <p>{selected.requirementSummary}</p>}
              {activeTab === 'Explanation' && <p>{selected.explanation}</p>}
              {activeTab === 'Audit intent' && (
                <div className="space-y-3">
                  <p>{selected.auditIntent}</p>
                  {selected.processOwnerRoles.length > 0 && (
                    <p className="text-slate-500">
                      Typical process owners: {selected.processOwnerRoles.join(', ')}
                    </p>
                  )}
                  {selected.riskPrompts.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium">Risk-based audit prompts</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {selected.riskPrompts.map((r, i) => (
                          <li key={i}>
                            {r.prompt} <span className="text-xs text-slate-400">(weight {r.riskWeight}/5)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selected.auditTests.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium">Suggested audit tests</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {selected.auditTests.map((t, i) => (
                          <li key={i}>{t.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'Evidence' && (
                <div className="space-y-2">
                  {selected.mandatoryDocumentedInfo.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium">Mandatory documented information</p>
                      <ul className="list-disc space-y-1 pl-5">
                        {selected.mandatoryDocumentedInfo.map((m, i) => (
                          <li key={i}>
                            {m.description} <span className="chip bg-slate-100 dark:bg-slate-700">{m.kind}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 font-medium">Evidence required</p>
                    {selected.evidenceRequired.length === 0 ? (
                      <p className="text-slate-400">None specific beyond general documented information.</p>
                    ) : (
                      <ul className="list-disc space-y-1 pl-5">
                        {selected.evidenceRequired.map((e, i) => (
                          <li key={i}>
                            {e.description}{' '}
                            <span className="chip bg-slate-100 dark:bg-slate-700">{e.category.replace('_', ' ')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'Questions' && (
                <ul className="space-y-2">
                  {selected.interviewQuestions.map((q, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-700/50">
                      <span className="chip mr-2 bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        {q.audienceRole}
                      </span>
                      {q.question}
                    </li>
                  ))}
                  {selected.interviewQuestions.length === 0 && <p className="text-slate-400">No specific questions authored.</p>}
                </ul>
              )}
              {activeTab === 'Findings' && (
                <ul className="space-y-2">
                  {selected.potentialFindings.map((f, i) => (
                    <li key={i}>
                      <span
                        className={`chip mr-2 ${
                          f.severityHint === 'Major'
                            ? 'bg-status-major/10 text-status-major'
                            : f.severityHint === 'Minor'
                              ? 'bg-status-minor/10 text-status-minor'
                              : 'bg-status-ofi/10 text-status-ofi'
                        }`}
                      >
                        {f.severityHint}
                      </span>
                      {f.description}
                    </li>
                  ))}
                  {selected.potentialFindings.length === 0 && <p className="text-slate-400">No typical findings authored.</p>}
                </ul>
              )}
              {activeTab === 'Related' && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 font-medium">Related clauses (same standard)</p>
                    <div className="flex flex-wrap gap-2">
                      {resolveRelatedClauses(selected).map((c) => (
                        <ClauseChip key={c.id} standardId={c.standardId} clauseNumber={c.clauseNumber} title={c.title} />
                      ))}
                      {resolveRelatedClauses(selected).length === 0 && <p className="text-slate-400">None recorded.</p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-medium">Cross-standard equivalents</p>
                    <div className="flex flex-wrap gap-2">
                      {resolveCrossStandardEquivalents(selected).map((c) => (
                        <ClauseChip key={c.id} standardId={c.standardId} clauseNumber={c.clauseNumber} title={c.title} />
                      ))}
                      {resolveCrossStandardEquivalents(selected).length === 0 && <p className="text-slate-400">None recorded.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
