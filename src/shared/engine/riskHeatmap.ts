import type { Risk, Control, Process, AuditFinding, ComplianceObligation, ComplianceEvaluation, RiskLevel, Clause } from '../types'
import { collectProcessClauseIds } from './processClauses'

export function riskScore(risk: Risk): number {
  return risk.likelihood * risk.severity
}

export function riskScoreLevel(score: number): RiskLevel {
  if (score >= 15) return 'high'
  if (score >= 7) return 'medium'
  return 'low'
}

export interface HeatmapCell {
  likelihood: number
  severity: number
  level: RiskLevel
  riskIds: string[]
}

/** A 5x5 likelihood x severity grid (rows = likelihood 1-5, columns = severity 1-5), each cell holding the risks that fall in it. */
export function buildRiskHeatmap(risks: Risk[]): HeatmapCell[][] {
  const grid: HeatmapCell[][] = []
  for (let likelihood = 1; likelihood <= 5; likelihood++) {
    const row: HeatmapCell[] = []
    for (let severity = 1; severity <= 5; severity++) {
      row.push({ likelihood, severity, level: riskScoreLevel(likelihood * severity), riskIds: [] })
    }
    grid.push(row)
  }
  for (const risk of risks) {
    grid[risk.likelihood - 1][risk.severity - 1].riskIds.push(risk.id)
  }
  return grid
}

export interface PriorityDriver {
  label: string
  weight: number
}

export interface ProcessPriority {
  processId: string
  score: number
  drivers: PriorityDriver[]
}

/**
 * Ranks processes by how much audit depth/coverage they should get, combining
 * three real signals already tracked in this build: the process's own risk
 * register, findings raised against it (directly, or against a clause it
 * links to), and non-compliant compliance evaluations for obligations linked
 * to its clauses.
 *
 * "Incident history" and "KPI trend" from the brief are deliberately not
 * inputs here — there is no Incident or KPI-value-over-time entity in this
 * build (see docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md's M4 status note).
 * Adding them later means adding a parameter and a driver here, not a
 * rewrite — the same additive pattern every engine module in this codebase
 * follows.
 */
export function computeCoveragePriority(
  processes: Process[],
  risks: Risk[],
  controls: Control[],
  findings: AuditFinding[],
  obligations: ComplianceObligation[],
  evaluations: ComplianceEvaluation[]
): ProcessPriority[] {
  const latestEvalByObligation = new Map<string, ComplianceEvaluation>()
  for (const ev of evaluations) {
    const existing = latestEvalByObligation.get(ev.obligationId)
    if (!existing || ev.evaluatedAt > existing.evaluatedAt) latestEvalByObligation.set(ev.obligationId, ev)
  }

  return processes
    .map((process) => {
      const drivers: PriorityDriver[] = []
      let score = 0

      const processRisks = risks.filter((r) => r.processId === process.id)
      const maxRiskScore = Math.max(0, ...processRisks.map(riskScore))
      if (maxRiskScore >= 15) {
        score += 40
        drivers.push({ label: 'Contains a high risk (likelihood x severity >= 15)', weight: 40 })
      } else if (maxRiskScore >= 7) {
        score += 20
        drivers.push({ label: 'Contains a medium risk', weight: 20 })
      }

      const processClauseIds = new Set(collectProcessClauseIds([process.id], processes, risks, controls))
      const findingCount = findings.filter(
        (f) => f.processId === process.id || (f.clauseId !== undefined && processClauseIds.has(f.clauseId))
      ).length
      if (findingCount > 0) {
        const weight = Math.min(30, findingCount * 15)
        score += weight
        drivers.push({ label: `${findingCount} finding(s) raised against this process`, weight })
      }

      const linkedObligations = obligations.filter((o) => o.clauseIds.some((id) => processClauseIds.has(id)))
      const nonCompliantCount = linkedObligations.filter(
        (o) => latestEvalByObligation.get(o.id)?.status === 'non_compliant'
      ).length
      if (nonCompliantCount > 0) {
        const weight = Math.min(30, nonCompliantCount * 15)
        score += weight
        drivers.push({ label: `${nonCompliantCount} non-compliant obligation(s) linked to this process`, weight })
      }

      if (drivers.length === 0) drivers.push({ label: 'No elevated risk/finding/compliance signals', weight: 0 })

      return { processId: process.id, score, drivers }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Reorders (and, for the highest-priority clauses, duplicates) a clause
 * scope so a generated audit programme naturally schedules high-risk /
 * high-finding / non-compliant areas earlier and with more depth — the
 * "automatically increase audit coverage where high-risk activities exist"
 * requirement, implemented as a real reordering of scheduler.ts's input
 * rather than a cosmetic label. Clauses with no linked process are left in
 * their original relative order at the back.
 */
export function prioritiseClausesForScheduling(
  clauses: Clause[],
  processes: Process[],
  risks: Risk[],
  controls: Control[],
  findings: AuditFinding[],
  obligations: ComplianceObligation[],
  evaluations: ComplianceEvaluation[]
): Clause[] {
  const priorities = computeCoveragePriority(processes, risks, controls, findings, obligations, evaluations)
  const clauseIdToScore = new Map<string, number>()
  for (const priority of priorities) {
    const clauseIds = collectProcessClauseIds([priority.processId], processes, risks, controls)
    for (const id of clauseIds) {
      clauseIdToScore.set(id, Math.max(clauseIdToScore.get(id) ?? 0, priority.score))
    }
  }

  const sorted = [...clauses].sort((a, b) => (clauseIdToScore.get(b.id) ?? 0) - (clauseIdToScore.get(a.id) ?? 0))
  const highPriorityDuplicates = sorted.filter((c) => (clauseIdToScore.get(c.id) ?? 0) >= 40).slice(0, 5)
  return [...sorted, ...highPriorityDuplicates]
}
