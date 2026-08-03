import { describe, it, expect } from 'vitest'
import {
  isFindingOpen,
  getOverdueActions,
  computeFindingsSummary,
  getRecurringFindings,
  computeClosureEffectiveness
} from '../src/shared/engine/findings'
import type { AuditFinding, CorrectiveAction } from '../src/shared/types'

const now = new Date('2026-08-03T00:00:00.000Z')

const findings: AuditFinding[] = [
  { id: 'f1', auditProjectId: 'p1', clauseId: 'iso14001-8.1', category: 'major_nc', description: 'Spill response equipment expired', raisedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'f2', auditProjectId: 'p1', clauseId: 'iso14001-8.1', category: 'minor_nc', description: 'Spill kit inspection overdue', raisedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'f3', auditProjectId: 'p1', processId: 'proc-1', category: 'ofi', description: 'Training records slightly out of date', raisedAt: '2026-03-01T00:00:00.000Z' },
  { id: 'f4', auditProjectId: 'p1', category: 'observation', description: 'Minor housekeeping', raisedAt: '2026-03-15T00:00:00.000Z' }
]

const actions: CorrectiveAction[] = [
  { id: 'a1', findingId: 'f1', description: 'Replace spill kit', owner: 'J. Smith', dueDate: '2026-01-15T00:00:00.000Z', status: 'in_progress' }, // overdue
  { id: 'a2', findingId: 'f2', description: 'Reinstate inspection schedule', owner: 'J. Smith', dueDate: '2026-07-01T00:00:00.000Z', status: 'closed', closedAt: '2026-06-20T00:00:00.000Z' } // closed on time
  // f3 and f4 have no corrective actions yet
]

describe('isFindingOpen', () => {
  it('is open when a finding has no corrective actions yet', () => {
    expect(isFindingOpen(findings[2], actions)).toBe(true)
  })

  it('is open when at least one action is not closed', () => {
    expect(isFindingOpen(findings[0], actions)).toBe(true)
  })

  it('is closed only once every action is closed', () => {
    expect(isFindingOpen(findings[1], actions)).toBe(false)
  })
})

describe('getOverdueActions', () => {
  it('flags only non-closed actions whose due date has passed', () => {
    const overdue = getOverdueActions(actions, now)
    expect(overdue).toHaveLength(1)
    expect(overdue[0].actionId).toBe('a1')
  })

  it('does not flag a closed action even if it was closed after its due date would otherwise look overdue', () => {
    const overdue = getOverdueActions(actions, now)
    expect(overdue.find((a) => a.actionId === 'a2')).toBeUndefined()
  })
})

describe('computeFindingsSummary', () => {
  it('counts findings by category and open findings, and surfaces overdue actions', () => {
    const summary = computeFindingsSummary(findings, actions, now)
    expect(summary.totalByCategory).toEqual({ observation: 1, ofi: 1, minor_nc: 1, major_nc: 1 })
    expect(summary.openCount).toBe(3) // f1 (action in progress), f3 and f4 (no actions) are open; f2 is closed
    expect(summary.overdueActions).toHaveLength(1)
  })
})

describe('getRecurringFindings', () => {
  it('flags a clause with 2+ findings as recurring', () => {
    const recurring = getRecurringFindings(findings)
    expect(recurring).toEqual([{ kind: 'clause', id: 'iso14001-8.1', count: 2, findingIds: ['f1', 'f2'] }])
  })

  it('does not flag a process or clause with only one finding', () => {
    const recurring = getRecurringFindings(findings)
    expect(recurring.find((r) => r.id === 'proc-1')).toBeUndefined()
  })

  it('ignores findings with neither a clause nor a process reference', () => {
    const recurring = getRecurringFindings(findings)
    expect(recurring.every((r) => r.findingIds.every((id) => id !== 'f4'))).toBe(true)
  })
})

describe('computeClosureEffectiveness', () => {
  it('computes closure rate and on-time rate from real action data', () => {
    const result = computeClosureEffectiveness(actions)
    expect(result.totalActions).toBe(2)
    expect(result.closedActions).toBe(1)
    expect(result.closureRatePct).toBe(50)
    expect(result.closedOnTimePct).toBe(100)
  })

  it('reports 0%s (not NaN) when there are no actions at all', () => {
    const result = computeClosureEffectiveness([])
    expect(result.closureRatePct).toBe(0)
    expect(result.closedOnTimePct).toBe(0)
  })
})
