import type { Process, Risk, Control } from '../types'

/**
 * Resolves the set of clause ids relevant to a given set of in-scope
 * processes — both clauses the process links to directly, and clauses
 * evidenced by controls on that process's risks. Used to widen an audit's
 * clause scope beyond "every clause in the selected standard(s)" to
 * "the standard(s)' clauses, plus whatever this specific set of processes
 * actually touches" — the mechanism behind planning an audit by process
 * (docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §6, M1).
 */
export function collectProcessClauseIds(
  processIds: string[],
  processes: Process[],
  risks: Risk[],
  controls: Control[]
): string[] {
  const scopeSet = new Set(processIds)
  const ids = new Set<string>()

  for (const process of processes) {
    if (!scopeSet.has(process.id)) continue
    for (const clauseId of process.clauseIds) ids.add(clauseId)
  }

  const inScopeRiskIds = new Set(risks.filter((r) => scopeSet.has(r.processId)).map((r) => r.id))
  for (const control of controls) {
    if (!inScopeRiskIds.has(control.riskId)) continue
    for (const clauseId of control.clauseIds) ids.add(clauseId)
  }

  return Array.from(ids)
}
