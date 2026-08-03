import { describe, it, expect } from 'vitest'
import { collectProcessClauseIds } from '../src/shared/engine/processClauses'
import type { Process, Risk, Control } from '../src/shared/types'

const processes: Process[] = [
  { id: 'p1', functionId: 'f1', name: 'Permit to Work', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: ['iso45001-8.1.2'] },
  { id: 'p2', functionId: 'f1', name: 'Waste Management', inputs: [], activities: [], outputs: [], kpis: [], clauseIds: ['iso14001-8.1'] }
]
const risks: Risk[] = [
  { id: 'r1', processId: 'p1', category: 'ohs_hazard', description: 'x', likelihood: 2, severity: 4 },
  { id: 'r2', processId: 'p2', category: 'environmental_aspect', description: 'y', likelihood: 2, severity: 3 }
]
const controls: Control[] = [
  { id: 'c1', riskId: 'r1', description: 'LOTO', clauseIds: ['iso45001-7.2'] },
  { id: 'c2', riskId: 'r2', description: 'Segregation', clauseIds: ['iso14001-7.2', 'iso14001-9.1.2'] }
]

describe('collectProcessClauseIds', () => {
  it('collects both process-level and control-level clause links for in-scope processes', () => {
    const ids = collectProcessClauseIds(['p1'], processes, risks, controls)
    expect(new Set(ids)).toEqual(new Set(['iso45001-8.1.2', 'iso45001-7.2']))
  })

  it('excludes out-of-scope processes entirely', () => {
    const ids = collectProcessClauseIds(['p1'], processes, risks, controls)
    expect(ids).not.toContain('iso14001-8.1')
    expect(ids).not.toContain('iso14001-7.2')
  })

  it('unions clauses across multiple in-scope processes with no duplicates', () => {
    const ids = collectProcessClauseIds(['p1', 'p2'], processes, risks, controls)
    expect(new Set(ids)).toEqual(new Set(['iso45001-8.1.2', 'iso45001-7.2', 'iso14001-8.1', 'iso14001-7.2', 'iso14001-9.1.2']))
  })

  it('returns an empty array when no processes are in scope', () => {
    expect(collectProcessClauseIds([], processes, risks, controls)).toEqual([])
  })
})
