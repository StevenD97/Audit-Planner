import type { AuditProject, CalendarEvent, CalendarEventCategory, ProgrammeActivityType, ProgrammeSlot } from '../types'

export type CalendarEventSource = 'manual' | 'audit' | 'programme'

/** A calendar entry ready to render — either a persisted CalendarEvent or one
 * derived on the fly from an AuditProject/ProgrammeSlot. Derived events are
 * never persisted, so an audit's date only ever has one source of truth. */
export interface CalendarEventView {
  id: string
  title: string
  description?: string
  date: string // 'YYYY-MM-DD'
  allDay: boolean
  startTime?: string
  endTime?: string
  category: CalendarEventCategory
  source: CalendarEventSource
  auditProjectId?: string
  editable: boolean
}

const ACTIVITY_LABELS: Record<ProgrammeActivityType, string> = {
  opening_meeting: 'Opening meeting',
  interview: 'Interview',
  document_review: 'Document review',
  site_inspection: 'Site inspection',
  closing_meeting: 'Closing meeting',
  break: 'Break'
}

/** Formats a Date using its LOCAL calendar fields — never `toISOString()`,
 * which converts to UTC first and can shift the date by a day either side
 * of midnight depending on the browser's timezone offset. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d) // local calendar date, no UTC conversion
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** One event per Programme Builder slot once an audit has been scheduled;
 * otherwise a single fallback event on the audit's start date so it's still
 * visible on the calendar before day-by-day scheduling happens. */
export function buildAuditDerivedEvents(auditProjects: AuditProject[], programmeSlots: ProgrammeSlot[]): CalendarEventView[] {
  const events: CalendarEventView[] = []
  for (const project of auditProjects) {
    const slots = programmeSlots.filter((s) => s.auditProjectId === project.id)
    if (slots.length > 0) {
      if (!project.startDate) continue
      for (const slot of slots) {
        events.push({
          id: `slot:${slot.id}`,
          title: `${ACTIVITY_LABELS[slot.activityType]} — ${project.name}`,
          description: slot.notes,
          date: addDaysToIsoDate(project.startDate, slot.dayNumber - 1),
          allDay: false,
          startTime: slot.startTime,
          endTime: slot.endTime,
          category: 'meeting',
          source: 'programme',
          auditProjectId: project.id,
          editable: false
        })
      }
    } else if (project.startDate) {
      events.push({
        id: `audit:${project.id}`,
        title: `Audit starts: ${project.name}`,
        date: project.startDate,
        allDay: true,
        category: 'meeting',
        source: 'audit',
        auditProjectId: project.id,
        editable: false
      })
    }
  }
  return events
}

function toEventView(e: CalendarEvent): CalendarEventView {
  return { ...e, source: 'manual', editable: true }
}

function sortByDateThenTime(a: CalendarEventView, b: CalendarEventView): number {
  return a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? '')
}

export function mergeCalendarEvents(manual: CalendarEvent[], derived: CalendarEventView[]): CalendarEventView[] {
  return [...derived, ...manual.map(toEventView)].sort(sortByDateThenTime)
}

export function eventsForDate(events: CalendarEventView[], date: string): CalendarEventView[] {
  return events.filter((e) => e.date === date).sort(sortByDateThenTime)
}

export function getUpcomingEvents(events: CalendarEventView[], fromDate: string, limit: number): CalendarEventView[] {
  return events
    .filter((e) => e.date >= fromDate)
    .sort(sortByDateThenTime)
    .slice(0, limit)
}
