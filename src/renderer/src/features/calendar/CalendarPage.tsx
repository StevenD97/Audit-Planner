import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { newId } from '@shared/id'
import {
  buildAuditDerivedEvents,
  eventsForDate,
  mergeCalendarEvents,
  toIsoDate,
  type CalendarEventView
} from '@shared/engine/calendar'
import type { CalendarEvent, CalendarEventCategory } from '@shared/types'
import { useWorkspaceStore } from '../../store/workspaceStore'

const CATEGORY_LABELS: Record<CalendarEventCategory, string> = {
  meeting: 'Meeting',
  deadline: 'Deadline',
  reminder: 'Reminder',
  other: 'Other'
}

const CATEGORY_STYLES: Record<CalendarEventCategory, string> = {
  meeting: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  deadline: 'bg-status-major/10 text-status-major',
  reminder: 'bg-status-ofi/10 text-status-ofi',
  other: 'bg-status-pending/10 text-status-pending'
}

const DERIVED_STYLE = 'bg-accent-500/10 text-accent-500 dark:text-accent-400'

function chipClasses(e: CalendarEventView): string {
  return e.source === 'manual' ? CATEGORY_STYLES[e.category] : DERIVED_STYLE
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfMonthGrid(year: number, month: number): Date {
  const first = new Date(year, month, 1)
  const weekday = (first.getDay() + 6) % 7 // 0=Mon..6=Sun
  first.setDate(first.getDate() - weekday)
  return first
}

function buildGridDays(year: number, month: number): Date[] {
  const start = startOfMonthGrid(year, month)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

interface DraftEvent {
  id?: string
  title: string
  description: string
  allDay: boolean
  startTime: string
  endTime: string
  category: CalendarEventCategory
  auditProjectId: string
}

function emptyDraft(): DraftEvent {
  return { title: '', description: '', allDay: true, startTime: '09:00', endTime: '10:00', category: 'meeting', auditProjectId: '' }
}

export default function CalendarPage(): JSX.Element {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const upsertEntity = useWorkspaceStore((s) => s.upsertEntity)
  const removeEntity = useWorkspaceStore((s) => s.removeEntity)

  const [params] = useSearchParams()
  const today = useMemo(() => toIsoDate(new Date()), [])
  const initialDate = params.get('date') || today
  const initial = new Date(`${initialDate}T00:00:00`)
  const [viewYear, setViewYear] = useState(() => initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(() => initial.getMonth())
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [draft, setDraft] = useState<DraftEvent | null>(null)

  const auditProjects = workspace?.auditProjects ?? []
  const manualEvents = workspace?.calendarEvents ?? []
  const programmeSlots = workspace?.programmeSlots ?? []

  const allEvents = useMemo(
    () => mergeCalendarEvents(manualEvents, buildAuditDerivedEvents(auditProjects, programmeSlots)),
    [manualEvents, auditProjects, programmeSlots]
  )

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventView[]>()
    for (const e of allEvents) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return map
  }, [allEvents])

  const gridDays = useMemo(() => buildGridDays(viewYear, viewMonth), [viewYear, viewMonth])
  const selectedEvents = eventsForDate(allEvents, selectedDate)

  function changeMonth(delta: number): void {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  function goToToday(): void {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelectedDate(today)
  }

  function startNewEvent(): void {
    setDraft({ ...emptyDraft(), title: '' })
  }

  function startEditEvent(e: CalendarEventView): void {
    if (!e.editable) return
    setDraft({
      id: e.id,
      title: e.title,
      description: e.description ?? '',
      allDay: e.allDay,
      startTime: e.startTime ?? '09:00',
      endTime: e.endTime ?? '10:00',
      category: e.category,
      auditProjectId: e.auditProjectId ?? ''
    })
  }

  async function saveDraft(): Promise<void> {
    if (!draft || !draft.title.trim()) return
    const event: CalendarEvent = {
      id: draft.id ?? newId(),
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      date: selectedDate,
      allDay: draft.allDay,
      startTime: draft.allDay ? undefined : draft.startTime,
      endTime: draft.allDay ? undefined : draft.endTime,
      category: draft.category,
      auditProjectId: draft.auditProjectId || undefined
    }
    await upsertEntity('calendar_events', { date: event.date }, event)
    setDraft(null)
  }

  async function deleteEvent(id: string): Promise<void> {
    await removeEntity('calendar_events', id)
    if (draft?.id === id) setDraft(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button className="btn-primary" onClick={startNewEvent}>
          + Add event
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="btn-ghost" onClick={() => changeMonth(-1)}>
                ←
              </button>
              <h2 className="w-48 text-center text-lg font-semibold">
                {new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h2>
              <button className="btn-ghost" onClick={() => changeMonth(1)}>
                →
              </button>
            </div>
            <button className="btn-secondary" onClick={goToToday}>
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="bg-slate-50 p-1.5 text-center text-xs font-semibold uppercase text-slate-400 dark:bg-slate-800">
                {w}
              </div>
            ))}
            {gridDays.map((d) => {
              const iso = toIsoDate(d)
              const inMonth = d.getMonth() === viewMonth
              const dayEvents = eventsByDate.get(iso) ?? []
              const isSelected = iso === selectedDate
              const isToday = iso === today
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`min-h-[88px] p-1.5 text-left align-top ${
                    inMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 text-slate-400 dark:bg-slate-800/50'
                  } ${isSelected ? 'ring-2 ring-inset ring-brand-500' : ''}`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      isToday ? 'bg-brand-600 font-semibold text-white' : ''
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <p key={e.id} className={`truncate rounded px-1 text-[10px] font-medium ${chipClasses(e)}`} title={e.title}>
                        {e.title}
                      </p>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          {selectedEvents.length === 0 && !draft && <p className="text-sm text-slate-400">No events on this day.</p>}

          <div className="space-y-2">
            {selectedEvents.map((e) => (
              <div key={e.id} className="rounded-lg border border-slate-100 p-2 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {e.allDay ? 'All day' : `${e.startTime ?? ''}–${e.endTime ?? ''}`} ·{' '}
                      <span className={`chip ${chipClasses(e)}`}>
                        {e.source === 'manual' ? CATEGORY_LABELS[e.category] : 'From Audit Planner'}
                      </span>
                    </p>
                    {e.description && <p className="mt-1 text-xs text-slate-500">{e.description}</p>}
                  </div>
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  {e.editable ? (
                    <>
                      <button className="text-brand-600 hover:underline dark:text-brand-400" onClick={() => startEditEvent(e)}>
                        Edit
                      </button>
                      <button className="text-status-major hover:underline" onClick={() => deleteEvent(e.id)}>
                        Delete
                      </button>
                    </>
                  ) : (
                    e.auditProjectId && (
                      <Link to={`/programme?project=${e.auditProjectId}`} className="text-brand-600 hover:underline dark:text-brand-400">
                        View in Programme Builder →
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {draft ? (
            <div className="space-y-2 rounded-lg border border-brand-200 p-3 dark:border-brand-800">
              <input className="input" placeholder="Event title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <textarea
                className="input min-h-[50px]"
                placeholder="Description (optional)"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <select
                  className="input"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value as CalendarEventCategory })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 whitespace-nowrap text-xs">
                  <input type="checkbox" checked={draft.allDay} onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })} />
                  All day
                </label>
              </div>
              {!draft.allDay && (
                <div className="flex gap-2">
                  <input className="input" type="time" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
                  <input className="input" type="time" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
                </div>
              )}
              {auditProjects.length > 0 && (
                <select
                  className="input"
                  value={draft.auditProjectId}
                  onChange={(e) => setDraft({ ...draft, auditProjectId: e.target.value })}
                >
                  <option value="">Not linked to an audit</option>
                  {auditProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setDraft(null)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={saveDraft} disabled={!draft.title.trim()}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-secondary w-full justify-center" onClick={startNewEvent}>
              + Add event on this day
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
