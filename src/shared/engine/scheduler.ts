import type { Clause, Department, ProgrammeActivityType, ProgrammeSlot } from '../types'

interface TimeBlock {
  start: string
  end: string
  kind: 'content' | 'break' | 'lunch'
}

const DAY_TEMPLATE: TimeBlock[] = [
  { start: '09:00', end: '10:00', kind: 'content' },
  { start: '10:00', end: '11:00', kind: 'content' },
  { start: '11:00', end: '11:15', kind: 'break' },
  { start: '11:15', end: '12:15', kind: 'content' },
  { start: '12:15', end: '13:00', kind: 'lunch' },
  { start: '13:00', end: '14:00', kind: 'content' },
  { start: '14:00', end: '15:00', kind: 'content' },
  { start: '15:00', end: '15:15', kind: 'break' },
  { start: '15:15', end: '16:15', kind: 'content' }
]

const ACTIVITY_CYCLE: ProgrammeActivityType[] = ['document_review', 'interview', 'site_inspection']

function idFor(dayNumber: number, index: number): string {
  return `slot-${dayNumber}-${index}-${Math.random().toString(36).slice(2, 8)}`
}

export interface GenerateProgrammeOptions {
  auditProjectId: string
  durationDays: number
  clauses: Clause[]
  departments: Department[]
}

/**
 * Auto-generates a first-draft audit programme: an opening meeting on day 1,
 * a closing meeting on the last day, and content slots in between populated
 * round-robin with the in-scope clauses, cycling document review / interview
 * / site inspection so no single activity type dominates the day. This is a
 * deterministic starting point the user then drags/edits in the Programme
 * Builder UI — it is intentionally simple rather than a constraint solver.
 */
export function generateProgramme(options: GenerateProgrammeOptions): ProgrammeSlot[] {
  const { auditProjectId, durationDays, clauses, departments } = options
  const days = Math.max(1, Math.round(durationDays) || 1)
  const slots: ProgrammeSlot[] = []

  // Chunk clauses across the blocks actually available for clause coverage —
  // i.e. excluding the one content block on day 1 reserved for the opening
  // meeting and the one on the last day reserved for the closing meeting
  // (both carve their slot out of a "content" block, not a break/lunch one).
  const contentBlocksPerDay = DAY_TEMPLATE.filter((b) => b.kind === 'content').length
  const totalContentBlocks = contentBlocksPerDay * days
  const reservedForMeetings = Math.min(totalContentBlocks, days === 1 ? 2 : 2)
  const usableContentBlocks = Math.max(1, totalContentBlocks - reservedForMeetings)
  const chunkSize = Math.max(1, Math.ceil(clauses.length / usableContentBlocks))
  const clauseChunks: Clause[][] = []
  for (let i = 0; i < clauses.length; i += chunkSize) {
    clauseChunks.push(clauses.slice(i, i + chunkSize))
  }

  let chunkIndex = 0
  let activityIndex = 0

  for (let day = 1; day <= days; day++) {
    let blockIndex = 0
    for (const block of DAY_TEMPLATE) {
      if (block.kind === 'lunch' || block.kind === 'break') {
        slots.push({
          id: idFor(day, blockIndex),
          auditProjectId,
          dayNumber: day,
          startTime: block.start,
          endTime: block.end,
          activityType: 'break',
          clauseIds: [],
          notes: block.kind === 'lunch' ? 'Lunch' : 'Break'
        })
        blockIndex++
        continue
      }

      if (day === 1 && blockIndex === 0) {
        slots.push({
          id: idFor(day, blockIndex),
          auditProjectId,
          dayNumber: day,
          startTime: block.start,
          endTime: block.end,
          activityType: 'opening_meeting',
          clauseIds: [],
          notes: 'Opening meeting: confirm scope, criteria, logistics, and audit team introductions.'
        })
        blockIndex++
        continue
      }

      const isLastContentBlockOverall = day === days && isLastContentBlock(block, day, days)
      if (isLastContentBlockOverall) {
        slots.push({
          id: idFor(day, blockIndex),
          auditProjectId,
          dayNumber: day,
          startTime: block.start,
          endTime: block.end,
          activityType: 'closing_meeting',
          clauseIds: [],
          notes: 'Closing meeting: present findings, agree corrective action timescales, confirm next steps.'
        })
        blockIndex++
        continue
      }

      const chunk = clauseChunks[chunkIndex] ?? []
      chunkIndex++
      const activityType = ACTIVITY_CYCLE[activityIndex % ACTIVITY_CYCLE.length]
      activityIndex++
      const processOwner = chunk[0]?.processOwnerRoles?.[0] ?? departments[0]?.processOwner ?? 'TBC'

      slots.push({
        id: idFor(day, blockIndex),
        auditProjectId,
        dayNumber: day,
        startTime: block.start,
        endTime: block.end,
        activityType,
        clauseIds: chunk.map((c) => c.id),
        processOwner,
        location: departments[(blockIndex + day) % Math.max(1, departments.length)]?.name,
        notes: chunk.length ? `Cover: ${chunk.map((c) => c.clauseNumber).join(', ')}` : 'Unallocated — add clauses'
      })
      blockIndex++
    }
  }

  return slots
}

function isLastContentBlock(block: TimeBlock, day: number, totalDays: number): boolean {
  if (day !== totalDays) return false
  const contentBlocks = DAY_TEMPLATE.filter((b) => b.kind === 'content')
  const last = contentBlocks[contentBlocks.length - 1]
  return last.start === block.start && last.end === block.end
}

/** Detect double-booking of the same process owner in overlapping slots on the same day. */
export function findSchedulingConflicts(slots: ProgrammeSlot[]): { slotA: string; slotB: string; reason: string }[] {
  const conflicts: { slotA: string; slotB: string; reason: string }[] = []
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]
      const b = slots[j]
      if (a.dayNumber !== b.dayNumber || !a.processOwner || a.processOwner !== b.processOwner) continue
      const overlap = a.startTime < b.endTime && b.startTime < a.endTime
      if (overlap) {
        conflicts.push({ slotA: a.id, slotB: b.id, reason: `${a.processOwner} double-booked on day ${a.dayNumber}` })
      }
    }
  }
  return conflicts
}
