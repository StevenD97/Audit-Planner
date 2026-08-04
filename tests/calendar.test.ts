import { describe, it, expect } from 'vitest'
import {
  addDaysToIsoDate,
  buildAuditDerivedEvents,
  mergeCalendarEvents,
  eventsForDate,
  getUpcomingEvents
} from '../src/shared/engine/calendar'
import type { AuditProject, CalendarEvent, ProgrammeSlot } from '../src/shared/types'

function project(overrides: Partial<AuditProject> = {}): AuditProject {
  return {
    id: 'p1',
    name: 'Test Audit',
    standards: ['iso14001'],
    scopeStatement: '',
    sites: [],
    departments: [],
    auditType: 'internal',
    auditTeam: [],
    status: 'planning',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('addDaysToIsoDate', () => {
  it('adds days within a month', () => {
    expect(addDaysToIsoDate('2026-08-10', 3)).toBe('2026-08-13')
  })

  it('rolls over a month boundary', () => {
    expect(addDaysToIsoDate('2026-08-30', 3)).toBe('2026-09-02')
  })

  it('is a no-op for zero days', () => {
    expect(addDaysToIsoDate('2026-08-10', 0)).toBe('2026-08-10')
  })
})

describe('buildAuditDerivedEvents', () => {
  it('produces a single fallback event on the start date when no programme slots exist', () => {
    const events = buildAuditDerivedEvents([project({ startDate: '2026-08-10' })], [])
    expect(events).toHaveLength(1)
    expect(events[0].date).toBe('2026-08-10')
    expect(events[0].source).toBe('audit')
    expect(events[0].editable).toBe(false)
  })

  it('produces no event when the audit has no start date and no slots', () => {
    expect(buildAuditDerivedEvents([project()], [])).toHaveLength(0)
  })

  it('prefers programme slots over the fallback, placed at startDate + dayNumber - 1', () => {
    const slots: ProgrammeSlot[] = [
      { id: 's1', auditProjectId: 'p1', dayNumber: 1, startTime: '09:00', endTime: '09:30', activityType: 'opening_meeting', clauseIds: [] },
      { id: 's2', auditProjectId: 'p1', dayNumber: 2, startTime: '09:00', endTime: '10:00', activityType: 'interview', clauseIds: [] }
    ]
    const events = buildAuditDerivedEvents([project({ startDate: '2026-08-10' })], slots)
    expect(events).toHaveLength(2)
    expect(events.find((e) => e.id === 'slot:s1')?.date).toBe('2026-08-10')
    expect(events.find((e) => e.id === 'slot:s2')?.date).toBe('2026-08-11')
    expect(events.every((e) => e.source === 'programme' && !e.editable)).toBe(true)
  })

  it('skips slots when the audit has no start date to anchor them to', () => {
    const slots: ProgrammeSlot[] = [
      { id: 's1', auditProjectId: 'p1', dayNumber: 1, startTime: '09:00', endTime: '09:30', activityType: 'opening_meeting', clauseIds: [] }
    ]
    expect(buildAuditDerivedEvents([project()], slots)).toHaveLength(0)
  })
})

describe('mergeCalendarEvents', () => {
  it('combines manual and derived events sorted by date then time', () => {
    const manual: CalendarEvent[] = [{ id: 'm1', title: 'Team meeting', date: '2026-08-11', allDay: false, startTime: '08:00', category: 'meeting' }]
    const derived = buildAuditDerivedEvents([project({ startDate: '2026-08-11' })], [])
    const merged = mergeCalendarEvents(manual, derived)
    expect(merged).toHaveLength(2)
    // All-day events (no startTime) sort before timed events on the same date.
    expect(merged[0].allDay).toBe(true)
    expect(merged[1].startTime).toBe('08:00')
    expect(merged.find((e) => e.source === 'manual')?.editable).toBe(true)
  })
})

describe('eventsForDate', () => {
  it('filters to exactly the requested date', () => {
    const manual: CalendarEvent[] = [
      { id: 'm1', title: 'A', date: '2026-08-11', allDay: true, category: 'other' },
      { id: 'm2', title: 'B', date: '2026-08-12', allDay: true, category: 'other' }
    ]
    const merged = mergeCalendarEvents(manual, [])
    expect(eventsForDate(merged, '2026-08-11')).toHaveLength(1)
  })
})

describe('getUpcomingEvents', () => {
  it('excludes past events and respects the limit', () => {
    const manual: CalendarEvent[] = [
      { id: 'm1', title: 'Past', date: '2026-08-01', allDay: true, category: 'other' },
      { id: 'm2', title: 'Soon', date: '2026-08-11', allDay: true, category: 'other' },
      { id: 'm3', title: 'Later', date: '2026-08-12', allDay: true, category: 'other' }
    ]
    const merged = mergeCalendarEvents(manual, [])
    const upcoming = getUpcomingEvents(merged, '2026-08-10', 1)
    expect(upcoming).toHaveLength(1)
    expect(upcoming[0].title).toBe('Soon')
  })
})
