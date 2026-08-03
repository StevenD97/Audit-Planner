import { describe, it, expect } from 'vitest'
import {
  computeClauseScoreV2,
  computeProcessScoreV2,
  computeDepartmentScoreV2,
  computeSiteScoreV2,
  computeOverallReadinessV2,
  type ScoringV2Context
} from '../src/shared/engine/scoringV2'
import type {
  GapAssessment,
  AuditFinding,
  CorrectiveAction,
  ComplianceObligation,
  ComplianceEvaluation,
  EvidencePlanItem,
  Risk,
  Control,
  Process,
  OrgFunction,
  OrgDepartment
} from '../src/shared/types'

function emptyContext(): ScoringV2Context {
  return {
    gapAssessments: [],
    auditFindings: [],
    correctiveActions: [],
    complianceObligations: [],
    complianceEvaluations: [],
    evidencePlanItems: [],
    risks: [],
    controls: [],
    processes: []
  }
}

const PROJECT = 'proj-1'
const CLAUSE = 'iso14001-8.1'

describe('computeClauseScoreV2', () => {
  it('scores a clause with no data at all as not-yet-assessed (80%)', () => {
    const result = computeClauseScoreV2(CLAUSE, PROJECT, emptyContext())
    expect(result.score).toBe(80)
    expect(result.drivers).toEqual([{ label: 'Not yet gap-assessed', weight: -20, sourceType: 'gap_assessment' }])
  })

  it('applies no gap-assessment penalty, and no driver, when conforms', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'conforms', assessedAt: '2026-01-01' }]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.score).toBe(100)
    expect(result.drivers).toEqual([])
  })

  it('applies the major NC penalty and driver', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'major_nc', assessedAt: '2026-01-01' }]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.score).toBe(40)
    expect(result.drivers).toContainEqual({ label: 'Major NC on record', weight: -60, sourceType: 'gap_assessment' })
  })

  it('uses the latest gap assessment when several exist for the same clause', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [
      { id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'major_nc', assessedAt: '2026-01-01' },
      { id: 'g2', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'conforms', assessedAt: '2026-06-01' }
    ]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.score).toBe(100)
  })

  it('penalises open findings, capped at two, but not closed ones', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'conforms', assessedAt: '2026-01-01' }]
    ctx.auditFindings = [
      { id: 'f1', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'minor_nc', description: 'x', raisedAt: '2026-01-01' },
      { id: 'f2', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'minor_nc', description: 'y', raisedAt: '2026-01-01' },
      { id: 'f3', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'observation', description: 'z', raisedAt: '2026-01-01' }
    ]
    ctx.correctiveActions = [
      { id: 'a3', findingId: 'f3', description: 'x', owner: 'x', dueDate: '2026-01-01', status: 'closed', closedAt: '2026-01-01' }
    ]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    // f1, f2 open (no actions at all); f3 closed -> excluded. Penalty capped at 2*15=30.
    expect(result.score).toBe(70)
    expect(result.drivers).toContainEqual({ label: '2 open finding(s) against this clause', weight: -30, sourceType: 'finding' })
  })

  it('penalises a history of late-closed corrective actions for this clause', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'conforms', assessedAt: '2026-01-01' }]
    ctx.auditFindings = [{ id: 'f1', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'minor_nc', description: 'x', raisedAt: '2026-01-01' }]
    ctx.correctiveActions = [
      { id: 'a1', findingId: 'f1', description: 'x', owner: 'x', dueDate: '2026-01-01', status: 'closed', closedAt: '2026-02-01' }
    ]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.drivers).toContainEqual({
      label: 'History of corrective actions closed late for this clause',
      weight: -10,
      sourceType: 'finding'
    })
  })

  it('penalises a non-compliant linked legal obligation more than a partial one', () => {
    const ctxNonCompliant = emptyContext()
    ctxNonCompliant.complianceObligations = [{ id: 'ob1', legislationId: 'l1', description: 'x', requirements: [], clauseIds: [CLAUSE] }]
    ctxNonCompliant.complianceEvaluations = [{ id: 'ev1', obligationId: 'ob1', status: 'non_compliant', evaluatedAt: '2026-01-01' }]
    const resultNonCompliant = computeClauseScoreV2(CLAUSE, PROJECT, ctxNonCompliant)
    expect(resultNonCompliant.drivers).toContainEqual({
      label: 'Linked legal obligation currently non-compliant',
      weight: -20,
      sourceType: 'compliance'
    })

    const ctxPartial = emptyContext()
    ctxPartial.complianceObligations = ctxNonCompliant.complianceObligations
    ctxPartial.complianceEvaluations = [{ id: 'ev1', obligationId: 'ob1', status: 'partial', evaluatedAt: '2026-01-01' }]
    const resultPartial = computeClauseScoreV2(CLAUSE, PROJECT, ctxPartial)
    expect(resultPartial.score).toBeGreaterThan(resultNonCompliant.score)
  })

  it('penalises incomplete evidence proportionally, capped at 15', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'conforms', assessedAt: '2026-01-01' }]
    ctx.evidencePlanItems = [
      { id: 'e1', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'record', description: 'x', status: 'obtained' },
      { id: 'e2', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'record', description: 'y', status: 'requested' }
    ] as EvidencePlanItem[]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.score).toBeLessThan(100)
    expect(result.drivers.some((d) => d.label.includes('evidence not yet obtained'))).toBe(true)
  })

  it('penalises linkage to a high risk via a process', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'conforms', assessedAt: '2026-01-01' }]
    ctx.processes = [{ id: 'p1', functionId: 'f1', name: 'X', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [CLAUSE] }]
    ctx.risks = [{ id: 'r1', processId: 'p1', category: 'ohs_hazard', description: 'x', likelihood: 5, severity: 5 }]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.drivers).toContainEqual({
      label: 'Linked to a high risk (likelihood x severity >= 15)',
      weight: -10,
      sourceType: 'risk'
    })
  })

  it('never drops below 0 even when every penalty stacks', () => {
    const ctx = emptyContext()
    ctx.gapAssessments = [{ id: 'g1', auditProjectId: PROJECT, clauseId: CLAUSE, rating: 'major_nc', assessedAt: '2026-01-01' }]
    ctx.auditFindings = [
      { id: 'f1', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'major_nc', description: 'x', raisedAt: '2026-01-01' },
      { id: 'f2', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'major_nc', description: 'y', raisedAt: '2026-01-01' }
    ]
    ctx.complianceObligations = [{ id: 'ob1', legislationId: 'l1', description: 'x', requirements: [], clauseIds: [CLAUSE] }]
    ctx.complianceEvaluations = [{ id: 'ev1', obligationId: 'ob1', status: 'non_compliant', evaluatedAt: '2026-01-01' }]
    ctx.evidencePlanItems = [{ id: 'e1', auditProjectId: PROJECT, clauseId: CLAUSE, category: 'record', description: 'x', status: 'requested' }]
    ctx.processes = [{ id: 'p1', functionId: 'f1', name: 'X', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [CLAUSE] }]
    ctx.risks = [{ id: 'r1', processId: 'p1', category: 'ohs_hazard', description: 'x', likelihood: 5, severity: 5 }]
    const result = computeClauseScoreV2(CLAUSE, PROJECT, ctx)
    expect(result.score).toBe(0)
  })
})

describe('multi-level rollups', () => {
  const clauseA = 'iso14001-7.2'
  const clauseB = 'iso14001-8.1'
  const processes: Process[] = [
    { id: 'p1', functionId: 'fn1', name: 'Process One', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [clauseA] },
    { id: 'p2', functionId: 'fn1', name: 'Process Two', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [clauseB] }
  ]
  const functions: OrgFunction[] = [{ id: 'fn1', departmentId: 'dept1', name: 'Function One' }]
  const departments: OrgDepartment[] = [{ id: 'dept1', siteId: 'site1', name: 'Department One' }]

  function buildCtx(): ScoringV2Context {
    const ctx = emptyContext()
    ctx.processes = processes
    ctx.gapAssessments = [
      { id: 'g1', auditProjectId: PROJECT, clauseId: clauseA, rating: 'conforms', assessedAt: '2026-01-01' },
      { id: 'g2', auditProjectId: PROJECT, clauseId: clauseB, rating: 'major_nc', assessedAt: '2026-01-01' }
    ]
    return ctx
  }

  it('computeProcessScoreV2 averages the clauses a process links to and exposes them as children', () => {
    const ctx = buildCtx()
    const result = computeProcessScoreV2(processes[1], (id) => id, PROJECT, ctx)
    expect(result.score).toBe(40) // major_nc clause only
    expect(result.children).toHaveLength(1)
    expect(result.children![0].id).toBe(clauseB)
  })

  it('computeDepartmentScoreV2 averages its processes, which averages their clauses', () => {
    const ctx = buildCtx()
    const result = computeDepartmentScoreV2('dept1', functions, (id) => id, (id) => id, PROJECT, ctx)
    // p1 (conforms, 100) and p2 (major_nc, 40) -> average 70
    expect(result.score).toBe(70)
    expect(result.children).toHaveLength(2)
  })

  it('computeSiteScoreV2 averages its departments', () => {
    const ctx = buildCtx()
    const result = computeSiteScoreV2('site1', departments, functions, (id) => id, (id) => id, (id) => id, PROJECT, ctx)
    expect(result.score).toBe(70)
    expect(result.children).toHaveLength(1)
    expect(result.children![0].id).toBe('dept1')
  })

  it('surfaces the worst-scoring children as drivers, not just the number', () => {
    const ctx = buildCtx()
    const result = computeDepartmentScoreV2('dept1', functions, (id) => id, (id) => id, PROJECT, ctx)
    expect(result.drivers.some((d) => d.label.includes('p2') && d.label.includes('40%'))).toBe(true)
  })

  it('computeOverallReadinessV2 averages an arbitrary clause scope directly', () => {
    const ctx = buildCtx()
    const result = computeOverallReadinessV2([clauseA, clauseB], (id) => id, PROJECT, ctx)
    expect(result.score).toBe(70)
  })

  it('returns a neutral 100 with an explanatory driver when a rollup has nothing linked yet', () => {
    const ctx = emptyContext()
    const result = computeProcessScoreV2(
      { id: 'lonely', functionId: 'fn1', name: 'Lonely', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [] },
      (id) => id,
      PROJECT,
      ctx
    )
    expect(result.score).toBe(100)
    expect(result.drivers).toEqual([{ label: 'No clauses linked yet', weight: 0, sourceType: 'rollup' }])
  })
})
