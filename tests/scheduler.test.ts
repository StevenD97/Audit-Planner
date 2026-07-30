import { describe, it, expect } from 'vitest'
import { generateProgramme, findSchedulingConflicts } from '@shared/engine/scheduler'
import { getAuditableClauses } from '@shared/knowledge-base'

describe('scheduler engine', () => {
  it('generates an opening meeting on day 1 and a closing meeting on the last day', () => {
    const clauses = getAuditableClauses('iso14001')
    const slots = generateProgramme({ auditProjectId: 'p1', durationDays: 2, clauses, departments: [] })
    expect(slots.some((s) => s.activityType === 'opening_meeting' && s.dayNumber === 1)).toBe(true)
    expect(slots.some((s) => s.activityType === 'closing_meeting' && s.dayNumber === 2)).toBe(true)
  })

  it('covers every clause at least once across the generated programme', () => {
    const clauses = getAuditableClauses('iso14001')
    const slots = generateProgramme({ auditProjectId: 'p1', durationDays: 2, clauses, departments: [] })
    const covered = new Set(slots.flatMap((s) => s.clauseIds))
    for (const c of clauses) expect(covered.has(c.id)).toBe(true)
  })

  it('detects a scheduling conflict when the same owner is double-booked', () => {
    const slots = [
      {
        id: 'a',
        auditProjectId: 'p1',
        dayNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        activityType: 'interview' as const,
        clauseIds: [],
        processOwner: 'Alice'
      },
      {
        id: 'b',
        auditProjectId: 'p1',
        dayNumber: 1,
        startTime: '09:30',
        endTime: '10:30',
        activityType: 'interview' as const,
        clauseIds: [],
        processOwner: 'Alice'
      }
    ]
    const conflicts = findSchedulingConflicts(slots)
    expect(conflicts.length).toBe(1)
  })

  it('does not flag non-overlapping slots for the same owner', () => {
    const slots = [
      {
        id: 'a',
        auditProjectId: 'p1',
        dayNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        activityType: 'interview' as const,
        clauseIds: [],
        processOwner: 'Alice'
      },
      {
        id: 'b',
        auditProjectId: 'p1',
        dayNumber: 1,
        startTime: '10:00',
        endTime: '11:00',
        activityType: 'interview' as const,
        clauseIds: [],
        processOwner: 'Alice'
      }
    ]
    expect(findSchedulingConflicts(slots).length).toBe(0)
  })
})
