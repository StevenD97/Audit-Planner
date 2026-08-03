import { useMemo, useState } from 'react'
import { newId } from '@shared/id'
import { getAuditableClauses } from '@shared/knowledge-base'
import { getActiveProvider } from '@shared/engine/ai'
import type { RecommenderContext } from '@shared/engine/recommender'
import { ClauseChip, useCurrentAuditProject } from '../../components/common'
import { useWorkspaceStore } from '../../store/workspaceStore'

const ai = getActiveProvider()

type ActionKey = 'questions' | 'trails' | 'weak' | 'interviewPlan' | 'missingEvidence' | 'agenda'

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: 'questions', label: 'Recommend audit questions' },
  { key: 'trails', label: 'Suggest audit trails' },
  { key: 'weak', label: 'Identify likely weak areas' },
  { key: 'interviewPlan', label: 'Generate an interview plan' },
  { key: 'missingEvidence', label: 'What evidence is missing?' },
  { key: 'agenda', label: "Generate today's agenda" }
]

export default function AiAssistantPanel({ onClose }: { onClose: () => void }): JSX.Element {
  const project = useCurrentAuditProject()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const bulkUpsertChecklistItems = useWorkspaceStore((s) => s.bulkUpsertChecklistItems)
  const bulkUpsertEvidenceItems = useWorkspaceStore((s) => s.bulkUpsertEvidenceItems)
  const [active, setActive] = useState<ActionKey | null>(null)

  const ctx: RecommenderContext | null = useMemo(() => {
    if (!project || !workspace) return null
    return {
      standardIds: project.standards,
      scopeClauses: project.standards.flatMap((s) => getAuditableClauses(s)),
      gapAssessments: workspace.gapAssessments.filter((g) => g.auditProjectId === project.id),
      evidencePlanItems: workspace.evidencePlanItems.filter((e) => e.auditProjectId === project.id),
      programmeSlots: workspace.programmeSlots.filter((s) => s.auditProjectId === project.id)
    }
  }, [project, workspace])

  return (
    <div className="fixed inset-y-0 right-0 z-30 flex w-96 flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
        <h2 className="font-semibold">🤖 Audit Intelligence Engine</h2>
        <button className="btn-ghost" onClick={onClose}>
          ✕
        </button>
      </div>

      {!ctx ? (
        <div className="p-4 text-sm text-slate-500">Select an audit project elsewhere in the app to use the assistant.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 p-3">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => setActive(a.key)}
                className={`rounded-lg border p-2 text-left text-xs font-medium ${
                  active === a.key ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 text-sm">
            {active === 'questions' && <QuestionsView ctx={ctx} onInsert={bulkUpsertChecklistItems} auditProjectId={project!.id} />}
            {active === 'trails' && <TrailsView ctx={ctx} />}
            {active === 'weak' && <WeakAreasView ctx={ctx} />}
            {active === 'interviewPlan' && <InterviewPlanView ctx={ctx} />}
            {active === 'missingEvidence' && (
              <MissingEvidenceView ctx={ctx} onInsert={bulkUpsertEvidenceItems} auditProjectId={project!.id} />
            )}
            {active === 'agenda' && <AgendaView ctx={ctx} />}
            {!active && <p className="text-slate-400">Pick an action above.</p>}
          </div>
        </>
      )}
    </div>
  )
}

function QuestionsView({
  ctx,
  onInsert,
  auditProjectId
}: {
  ctx: RecommenderContext
  onInsert: (items: any[]) => Promise<void>
  auditProjectId: string
}): JSX.Element {
  const recs = ai.recommendQuestions(ctx).slice(0, 8)
  async function insertAll(): Promise<void> {
    const items = recs.flatMap((r) =>
      r.questions.map((q) => ({
        id: newId(),
        auditProjectId,
        clauseId: r.clauseId,
        question: q.question,
        riskLevel: 'high' as const,
        status: 'pending' as const
      }))
    )
    await onInsert(items)
  }
  return (
    <div className="space-y-3">
      <button className="btn-primary w-full justify-center" onClick={insertAll}>
        Insert top questions into checklist
      </button>
      {recs.map((r) => (
        <div key={r.clauseId} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
          <ClauseChip standardId={r.clauseId.split('-')[0]} clauseNumber={r.clauseNumber} title={r.clauseTitle} />
          <p className="mt-1 text-xs text-slate-500">{r.reasons.join(' · ')}</p>
          <ul className="mt-1 list-disc pl-4 text-xs">
            {r.questions.slice(0, 2).map((q, i) => (
              <li key={i}>{q.question}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TrailsView({ ctx }: { ctx: RecommenderContext }): JSX.Element {
  const { canonical, customSeedClause, customTrail } = ai.suggestAuditTrails(ctx)
  return (
    <div className="space-y-3">
      {canonical.map((t) => (
        <div key={t.id} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
          <p className="font-medium">{t.name}</p>
          <p className="text-xs text-slate-500">{t.description}</p>
        </div>
      ))}
      {customSeedClause && customTrail && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-medium">Custom trail from weakest clause: {customSeedClause.title}</p>
          <ol className="mt-1 list-decimal pl-4 text-xs">
            {customTrail.map((step) => (
              <li key={step.clause.id}>
                §{step.clause.clauseNumber} {step.clause.title}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function WeakAreasView({ ctx }: { ctx: RecommenderContext }): JSX.Element {
  const weak = ai.identifyWeakAreas(ctx)
  return (
    <ul className="space-y-2">
      {weak.map((w) => (
        <li key={w.clauseId} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
          <p className="font-medium">
            §{w.clauseNumber} {w.title} — {w.score}%
          </p>
          <p className="text-xs text-slate-500">{w.reasons.join(' · ') || 'No specific concerns recorded.'}</p>
        </li>
      ))}
    </ul>
  )
}

function InterviewPlanView({ ctx }: { ctx: RecommenderContext }): JSX.Element {
  const plan = ai.generateInterviewPlan(ctx)
  return (
    <div className="space-y-3">
      {plan.map((block) => (
        <div key={block.role} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
          <p className="font-medium">
            {block.role} — ~{block.suggestedDurationMinutes} min
          </p>
          <ul className="mt-1 list-disc pl-4 text-xs">
            {block.clauses.slice(0, 5).map((c) => (
              <li key={c.clauseId}>
                §{c.clauseNumber} {c.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function MissingEvidenceView({
  ctx,
  onInsert,
  auditProjectId
}: {
  ctx: RecommenderContext
  onInsert: (items: any[]) => Promise<void>
  auditProjectId: string
}): JSX.Element {
  const missing = ai.highlightMissingEvidence(ctx)
  async function insertAll(): Promise<void> {
    const items = missing.map((m) => ({
      id: newId(),
      auditProjectId,
      clauseId: m.clauseId,
      category: m.category,
      description: m.description,
      status: 'requested' as const
    }))
    await onInsert(items)
  }
  return (
    <div className="space-y-3">
      {missing.length > 0 && (
        <button className="btn-primary w-full justify-center" onClick={insertAll}>
          Add all to Evidence Planner
        </button>
      )}
      <ul className="space-y-1">
        {missing.map((m, i) => (
          <li key={i} className="rounded-lg border border-slate-100 p-2 text-xs dark:border-slate-700">
            §{m.clauseNumber}: {m.description}
          </li>
        ))}
        {missing.length === 0 && <p className="text-slate-400">No missing evidence detected.</p>}
      </ul>
    </div>
  )
}

function AgendaView({ ctx }: { ctx: RecommenderContext }): JSX.Element {
  const agenda = ai.generateAgenda(ctx)
  return (
    <ul className="space-y-1 text-xs">
      {agenda.map((item, i) => (
        <li key={i} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
          Day {item.day} · {item.startTime}-{item.endTime} · {item.title}
        </li>
      ))}
      {agenda.length === 0 && <p className="text-slate-400">No programme scheduled yet.</p>}
    </ul>
  )
}
