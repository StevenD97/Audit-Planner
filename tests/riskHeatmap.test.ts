import { describe, it, expect } from 'vitest'
import {
  riskScore,
  riskScoreLevel,
  buildRiskHeatmap,
  computeCoveragePriority,
  prioritiseClausesForScheduling
} from '../src/shared/engine/riskHeatmap'
import type { Risk, Control, Process, AuditFinding, ComplianceObligation, ComplianceEvaluation, Clause } from '../src/shared/types'

describe('riskScore / riskScoreLevel', () => {
  it('multiplies likelihood by severity', () => {
    expect(riskScore({ id: 'r1', processId: 'p1', category: 'business', description: 'x', likelihood: 4, severity: 5 })).toBe(20)
  })

  it('buckets scores into low/medium/high', () => {
    expect(riskScoreLevel(4)).toBe('low')
    expect(riskScoreLevel(9)).toBe('medium')
    expect(riskScoreLevel(20)).toBe('high')
  })
})

describe('buildRiskHeatmap', () => {
  it('places each risk into its likelihood x severity cell', () => {
    const risks: Risk[] = [
      { id: 'r1', processId: 'p1', category: 'ohs_hazard', description: 'a', likelihood: 5, severity: 5 },
      { id: 'r2', processId: 'p1', category: 'business', description: 'b', likelihood: 1, severity: 1 }
    ]
    const grid = buildRiskHeatmap(risks)
    expect(grid).toHaveLength(5)
    expect(grid[0]).toHaveLength(5)
    expect(grid[4][4].riskIds).toEqual(['r1']) // likelihood 5, severity 5 -> grid[4][4]
    expect(grid[4][4].level).toBe('high')
    expect(grid[0][0].riskIds).toEqual(['r2'])
    expect(grid[0][0].level).toBe('low')
  })

  it('returns empty cells (not undefined) where no risk falls', () => {
    const grid = buildRiskHeatmap([])
    expect(grid[2][2].riskIds).toEqual([])
  })
})

describe('computeCoveragePriority', () => {
  const processes: Process[] = [
    { id: 'p-high', functionId: 'f1', name: 'High risk process', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: ['iso45001-8.1.2'] },
    { id: 'p-quiet', functionId: 'f1', name: 'Quiet process', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: ['iso14001-7.2'] }
  ]
  const risks: Risk[] = [
    { id: 'r1', processId: 'p-high', category: 'ohs_hazard', description: 'x', likelihood: 5, severity: 5 } // score 25, high
  ]
  const controls: Control[] = []
  const findings: AuditFinding[] = [
    { id: 'f1', auditProjectId: 'proj', clauseId: 'iso45001-8.1.2', category: 'major_nc', description: 'x', raisedAt: '2026-01-01T00:00:00.000Z' }
  ]
  const obligations: ComplianceObligation[] = [
    { id: 'ob1', legislationId: 'leg1', description: 'x', requirements: [], clauseIds: ['iso45001-8.1.2'] }
  ]
  const evaluations: ComplianceEvaluation[] = [
    { id: 'ev1', obligationId: 'ob1', status: 'non_compliant', evaluatedAt: '2026-01-01T00:00:00.000Z' }
  ]

  it('ranks the process with high risk, findings and non-compliance above a quiet one', () => {
    const ranked = computeCoveragePriority(processes, risks, controls, findings, obligations, evaluations)
    expect(ranked[0].processId).toBe('p-high')
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score)
  })

  it('produces driver explanations for the elevated process', () => {
    const ranked = computeCoveragePriority(processes, risks, controls, findings, obligations, evaluations)
    const high = ranked.find((r) => r.processId === 'p-high')!
    expect(high.drivers.some((d) => d.label.includes('high risk'))).toBe(true)
    expect(high.drivers.some((d) => d.label.includes('finding'))).toBe(true)
    expect(high.drivers.some((d) => d.label.includes('non-compliant'))).toBe(true)
  })

  it('gives a quiet process a zero score with an explanatory driver, not an empty list', () => {
    const ranked = computeCoveragePriority(processes, risks, controls, findings, obligations, evaluations)
    const quiet = ranked.find((r) => r.processId === 'p-quiet')!
    expect(quiet.score).toBe(0)
    expect(quiet.drivers).toEqual([{ label: 'No elevated risk/finding/compliance signals', weight: 0 }])
  })

  function makeClause(id: string, clauseNumber: string): Clause {
    return {
      id,
      standardId: 'iso45001',
      clauseNumber,
      title: id,
      sortOrder: 0,
      isContainer: false,
      requirementSummary: '',
      explanation: '',
      auditIntent: '',
      processOwnerRoles: [],
      mandatoryDocumentedInfo: [],
      evidenceRequired: [],
      interviewQuestions: [],
      auditTests: [],
      potentialFindings: [],
      relatedClauses: [],
      crossStandardEquivalents: [],
      riskPrompts: []
    }
  }

  describe('prioritiseClausesForScheduling', () => {
    it('moves the high-priority process clause ahead of the quiet one, and schedules it twice', () => {
      const clauses = [makeClause('iso14001-7.2', '7.2'), makeClause('iso45001-8.1.2', '8.1.2')]
      const reordered = prioritiseClausesForScheduling(clauses, processes, risks, controls, findings, obligations, evaluations)
      expect(reordered[0].id).toBe('iso45001-8.1.2')
      expect(reordered.filter((c) => c.id === 'iso45001-8.1.2')).toHaveLength(2)
      expect(reordered.filter((c) => c.id === 'iso14001-7.2')).toHaveLength(1)
    })

    it('leaves clause order unchanged when nothing is elevated', () => {
      const clauses = [makeClause('iso14001-7.2', '7.2'), makeClause('iso14001-9.1.1', '9.1.1')]
      const reordered = prioritiseClausesForScheduling(clauses, [], [], [], [], [], [])
      expect(reordered.map((c) => c.id)).toEqual(['iso14001-7.2', 'iso14001-9.1.1'])
    })
  })
})
