import { describe, it, expect } from 'vitest'
import { getAuditableClauses } from '@shared/knowledge-base'
import {
  recommendQuestions,
  identifyWeakAreas,
  highlightMissingEvidence,
  generateInterviewPlan,
  suggestAuditTrails,
  analysePatterns,
  type RecommenderContext
} from '@shared/engine/recommender'
import type { GapAssessment, AuditFinding, CorrectiveAction, Process, Risk, Control, ComplianceObligation, ComplianceEvaluation } from '@shared/types'

const PROJECT = 'p1'

describe('recommender engine', () => {
  const clauses = getAuditableClauses('iso45001').slice(0, 5)

  function baseCtx(overrides: Partial<RecommenderContext> = {}): RecommenderContext {
    return {
      auditProjectId: PROJECT,
      standardIds: ['iso45001'],
      scopeClauses: clauses,
      gapAssessments: [],
      evidencePlanItems: [],
      auditFindings: [],
      correctiveActions: [],
      complianceObligations: [],
      complianceEvaluations: [],
      risks: [],
      controls: [],
      processes: [],
      ...overrides
    }
  }

  it('ranks a clause with a prior Major NC above one with no history', () => {
    const gaps: GapAssessment[] = [
      { id: '1', auditProjectId: PROJECT, clauseId: clauses[0].id, rating: 'major_nc', assessedAt: '2026-01-01' }
    ]
    const ranked = recommendQuestions(baseCtx({ gapAssessments: gaps }))
    expect(ranked[0].clauseId).toBe(clauses[0].id)
    expect(ranked[0].reasons.some((r) => r.includes('Major NC'))).toBe(true)
  })

  it('identifies weak areas sorted worst-first', () => {
    const gaps: GapAssessment[] = [
      { id: '1', auditProjectId: PROJECT, clauseId: clauses[0].id, rating: 'conforms', assessedAt: '2026-01-01' },
      { id: '2', auditProjectId: PROJECT, clauseId: clauses[1].id, rating: 'major_nc', assessedAt: '2026-01-01' }
    ]
    const weak = identifyWeakAreas(baseCtx({ gapAssessments: gaps }))
    expect(weak[0].clauseId).toBe(clauses[1].id)
  })

  it('flags evidence required by the knowledge base but absent from the evidence plan', () => {
    const missing = highlightMissingEvidence(baseCtx())
    expect(missing.length).toBeGreaterThan(0)
  })

  it('does not flag evidence already marked obtained', () => {
    const ev = clauses[0].evidenceRequired[0]
    const missing = highlightMissingEvidence(
      baseCtx({
        evidencePlanItems: [
          {
            id: 'e1',
            auditProjectId: PROJECT,
            clauseId: clauses[0].id,
            category: ev.category,
            description: ev.description,
            status: 'obtained'
          }
        ]
      })
    )
    expect(missing.some((m) => m.clauseId === clauses[0].id && m.description === ev.description)).toBe(false)
  })

  it('groups the interview plan by process owner role', () => {
    const plan = generateInterviewPlan(baseCtx())
    expect(plan.length).toBeGreaterThan(0)
    for (const block of plan) expect(block.questions.length).toBeGreaterThan(0)
  })

  it('suggests a process trail from the highest coverage-priority process', () => {
    const processes: Process[] = [
      { id: 'p1', functionId: 'f1', name: 'Permit to Work', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [clauses[0].id] }
    ]
    const risks: Risk[] = [{ id: 'r1', processId: 'p1', category: 'ohs_hazard', description: 'x', likelihood: 5, severity: 5 }]
    const controls: Control[] = [{ id: 'c1', riskId: 'r1', description: 'LOTO procedure', clauseIds: [clauses[0].id] }]
    const { processTrail } = suggestAuditTrails(baseCtx({ processes, risks, controls }))
    expect(processTrail?.process.id).toBe('p1')
    expect(processTrail?.controls[0].description).toBe('LOTO procedure')
  })

  it('suggests no process trail when no process has an elevated priority score', () => {
    const { processTrail } = suggestAuditTrails(baseCtx())
    expect(processTrail).toBeUndefined()
  })

  it('analysePatterns finds recurring findings, weak controls and poor closure areas', () => {
    const auditFindings: AuditFinding[] = [
      { id: 'f1', auditProjectId: PROJECT, clauseId: clauses[0].id, category: 'major_nc', description: 'x', raisedAt: '2026-01-01' },
      { id: 'f2', auditProjectId: PROJECT, clauseId: clauses[0].id, category: 'minor_nc', description: 'y', raisedAt: '2026-02-01' }
    ]
    const processes: Process[] = [
      { id: 'p1', functionId: 'f1', name: 'Permit to Work', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: [] }
    ]
    const controls: Control[] = [{ id: 'c1', riskId: 'r1', description: 'LOTO procedure', clauseIds: [clauses[0].id] }]
    const correctiveActions: CorrectiveAction[] = [
      { id: 'a1', findingId: 'f1', description: 'x', owner: 'x', dueDate: '2026-01-01', status: 'open' }
    ]
    const complianceObligations: ComplianceObligation[] = [
      { id: 'ob1', legislationId: 'l1', description: 'x', requirements: [], clauseIds: [clauses[0].id] }
    ]
    const complianceEvaluations: ComplianceEvaluation[] = [
      { id: 'ev1', obligationId: 'ob1', status: 'non_compliant', evaluatedAt: '2026-01-01' }
    ]
    const result = analysePatterns(
      baseCtx({ auditFindings, processes, controls, correctiveActions, complianceObligations, complianceEvaluations })
    )
    expect(result.recurringFindings).toEqual([{ kind: 'clause', id: clauses[0].id, count: 2, findingIds: ['f1', 'f2'] }])
    expect(result.weakControls.some((c) => c.controlId === 'c1')).toBe(true)
  })
})
