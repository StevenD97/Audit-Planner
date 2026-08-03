import type { AuditFinding, CorrectiveAction, FindingCategory } from '../types'

/** A finding is open until every one of its corrective actions is closed; no actions at all means it hasn't been actioned yet, so it's open. */
export function isFindingOpen(finding: AuditFinding, actions: CorrectiveAction[]): boolean {
  const findingActions = actions.filter((a) => a.findingId === finding.id)
  if (findingActions.length === 0) return true
  return findingActions.some((a) => a.status !== 'closed')
}

export interface OverdueAction {
  actionId: string
  findingId: string
  description: string
  dueDate: string
  daysOverdue: number
}

/** Non-closed actions whose due date has passed. `now` is injectable for testability. */
export function getOverdueActions(actions: CorrectiveAction[], now: Date = new Date()): OverdueAction[] {
  const nowMs = now.getTime()
  return actions
    .filter((a) => a.status !== 'closed' && new Date(a.dueDate).getTime() < nowMs)
    .map((a) => ({
      actionId: a.id,
      findingId: a.findingId,
      description: a.description,
      dueDate: a.dueDate,
      daysOverdue: Math.floor((nowMs - new Date(a.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}

export interface FindingsSummary {
  openCount: number
  totalByCategory: Record<FindingCategory, number>
  overdueActions: OverdueAction[]
}

export function computeFindingsSummary(
  findings: AuditFinding[],
  actions: CorrectiveAction[],
  now: Date = new Date()
): FindingsSummary {
  const totalByCategory: Record<FindingCategory, number> = { observation: 0, ofi: 0, minor_nc: 0, major_nc: 0 }
  let openCount = 0
  for (const finding of findings) {
    totalByCategory[finding.category]++
    if (isFindingOpen(finding, actions)) openCount++
  }
  return { openCount, totalByCategory, overdueActions: getOverdueActions(actions, now) }
}

export interface RecurringFinding {
  kind: 'clause' | 'process'
  /** The clause id or process id findings recur against — resolve to a display title at the UI layer. */
  id: string
  count: number
  findingIds: string[]
}

/** Groups findings by the clause (preferred) or process they were raised against, surfacing anything occurring at least `minOccurrences` times across the workspace's audit history. Presentation-agnostic — returns ids, not resolved titles, consistent with the rest of engine/ not depending on the knowledge base. */
export function getRecurringFindings(findings: AuditFinding[], minOccurrences = 2): RecurringFinding[] {
  const groups = new Map<string, { kind: 'clause' | 'process'; id: string; findingIds: string[] }>()
  for (const finding of findings) {
    const kind: 'clause' | 'process' | null = finding.clauseId ? 'clause' : finding.processId ? 'process' : null
    if (!kind) continue
    const id = kind === 'clause' ? finding.clauseId! : finding.processId!
    const key = `${kind}:${id}`
    const existing = groups.get(key) ?? { kind, id, findingIds: [] }
    existing.findingIds.push(finding.id)
    groups.set(key, existing)
  }
  return Array.from(groups.values())
    .filter((g) => g.findingIds.length >= minOccurrences)
    .map((g) => ({ kind: g.kind, id: g.id, count: g.findingIds.length, findingIds: g.findingIds }))
    .sort((a, b) => b.count - a.count)
}

export interface ClosureEffectiveness {
  totalActions: number
  closedActions: number
  closureRatePct: number
  /** Of the actions that were closed, what % were closed by their due date. */
  closedOnTimePct: number
}

export function computeClosureEffectiveness(actions: CorrectiveAction[]): ClosureEffectiveness {
  const totalActions = actions.length
  const closed = actions.filter((a) => a.status === 'closed')
  const closedActions = closed.length
  const closureRatePct = totalActions === 0 ? 0 : Math.round((closedActions / totalActions) * 100)
  const onTime = closed.filter((a) => a.closedAt && new Date(a.closedAt).getTime() <= new Date(a.dueDate).getTime())
  const closedOnTimePct = closedActions === 0 ? 0 : Math.round((onTime.length / closedActions) * 100)
  return { totalActions, closedActions, closureRatePct, closedOnTimePct }
}
