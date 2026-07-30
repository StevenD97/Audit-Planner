import { create } from 'zustand'
import { newId } from '@shared/id'
import type {
  AuditProject,
  ChecklistItem,
  EvidencePlanItem,
  GapAssessment,
  ProgrammeSlot,
  ReadinessSnapshot
} from '@shared/types'
import type { WorkspaceState } from '@shared/ipc'

interface Store {
  workspace: WorkspaceState | null
  loading: boolean
  currentAuditProjectId: string | null
  aiPanelOpen: boolean
  toast: string | null

  init(): Promise<void>
  newWorkspace(): Promise<void>
  openWorkspace(): Promise<void>
  saveWorkspace(): Promise<void>
  saveWorkspaceAs(): Promise<void>
  refresh(): Promise<void>
  setCurrentAuditProject(id: string | null): void
  setAiPanelOpen(open: boolean): void
  setToast(message: string | null): void

  createAuditProject(partial: Partial<AuditProject>): Promise<AuditProject>
  updateAuditProject(id: string, patch: Partial<AuditProject>): Promise<void>

  replaceProgrammeSlots(auditProjectId: string, slots: ProgrammeSlot[]): Promise<void>
  upsertProgrammeSlot(slot: ProgrammeSlot): Promise<void>
  removeProgrammeSlot(id: string): Promise<void>

  bulkUpsertChecklistItems(items: ChecklistItem[]): Promise<void>
  upsertChecklistItem(item: ChecklistItem): Promise<void>
  removeChecklistItem(id: string): Promise<void>

  bulkUpsertEvidenceItems(items: EvidencePlanItem[]): Promise<void>
  upsertEvidenceItem(item: EvidencePlanItem): Promise<void>
  removeEvidenceItem(id: string): Promise<void>

  upsertGapAssessment(item: GapAssessment): Promise<void>

  addReadinessSnapshot(snapshot: ReadinessSnapshot): Promise<void>
}

function nowIso(): string {
  return new Date().toISOString()
}

export const useWorkspaceStore = create<Store>((set, get) => ({
  workspace: null,
  loading: true,
  currentAuditProjectId: null,
  aiPanelOpen: false,
  toast: null,

  async init() {
    set({ loading: true })
    const state = await window.api.workspaceNew()
    set({ workspace: state, loading: false })
  },

  async newWorkspace() {
    const state = await window.api.workspaceNew()
    set({ workspace: state, currentAuditProjectId: null })
  },

  async openWorkspace() {
    const result = await window.api.workspaceOpen()
    if (result.canceled || !result.state) return
    set({ workspace: result.state, currentAuditProjectId: null })
  },

  async saveWorkspace() {
    const result = await window.api.workspaceSave()
    if (!result.canceled) get().setToast(`Saved: ${result.filePath}`)
  },

  async saveWorkspaceAs() {
    const result = await window.api.workspaceSaveAs()
    if (!result.canceled) get().setToast(`Saved: ${result.filePath}`)
  },

  async refresh() {
    const state = await window.api.workspaceGetState()
    set({ workspace: state })
  },

  setCurrentAuditProject(id) {
    set({ currentAuditProjectId: id })
  },

  setAiPanelOpen(open) {
    set({ aiPanelOpen: open })
  },

  setToast(message) {
    set({ toast: message })
    if (message) setTimeout(() => set((s) => (s.toast === message ? { toast: null } : {})), 3500)
  },

  async createAuditProject(partial) {
    const project: AuditProject = {
      id: newId(),
      name: partial.name ?? 'New Audit',
      standards: partial.standards ?? ['iso14001'],
      scopeStatement: partial.scopeStatement ?? '',
      sites: partial.sites ?? [],
      departments: partial.departments ?? [],
      auditType: partial.auditType ?? 'internal',
      startDate: partial.startDate,
      endDate: partial.endDate,
      durationDays: partial.durationDays ?? 1,
      leadAuditor: partial.leadAuditor,
      auditTeam: partial.auditTeam ?? [],
      status: 'planning',
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
    await window.api.entityUpsert('audit_projects', project.id, { status: project.status, updatedAt: project.updatedAt }, project)
    await get().refresh()
    set({ currentAuditProjectId: project.id })
    return project
  },

  async updateAuditProject(id, patch) {
    const ws = get().workspace
    const existing = ws?.auditProjects.find((p) => p.id === id)
    if (!existing) return
    const updated: AuditProject = { ...existing, ...patch, updatedAt: nowIso() }
    await window.api.entityUpsert('audit_projects', id, { status: updated.status, updatedAt: updated.updatedAt }, updated)
    await get().refresh()
  },

  async replaceProgrammeSlots(auditProjectId, slots) {
    const ws = get().workspace
    const existingIds = (ws?.programmeSlots ?? []).filter((s) => s.auditProjectId === auditProjectId).map((s) => s.id)
    for (const id of existingIds) await window.api.entityRemove('programme_slots', id)
    await window.api.entityBulkUpsert(
      slots.map((s) => ({ table: 'programme_slots' as const, id: s.id, row: { auditProjectId: s.auditProjectId }, data: s }))
    )
    await get().refresh()
  },

  async upsertProgrammeSlot(slot) {
    await window.api.entityUpsert('programme_slots', slot.id, { auditProjectId: slot.auditProjectId }, slot)
    await get().refresh()
  },

  async removeProgrammeSlot(id) {
    await window.api.entityRemove('programme_slots', id)
    await get().refresh()
  },

  async bulkUpsertChecklistItems(items) {
    await window.api.entityBulkUpsert(
      items.map((i) => ({
        table: 'checklist_items' as const,
        id: i.id,
        row: { auditProjectId: i.auditProjectId, clauseId: i.clauseId },
        data: i
      }))
    )
    await get().refresh()
  },

  async upsertChecklistItem(item) {
    await window.api.entityUpsert(
      'checklist_items',
      item.id,
      { auditProjectId: item.auditProjectId, clauseId: item.clauseId },
      item
    )
    await get().refresh()
  },

  async removeChecklistItem(id) {
    await window.api.entityRemove('checklist_items', id)
    await get().refresh()
  },

  async bulkUpsertEvidenceItems(items) {
    await window.api.entityBulkUpsert(
      items.map((i) => ({
        table: 'evidence_plan_items' as const,
        id: i.id,
        row: { auditProjectId: i.auditProjectId, clauseId: i.clauseId },
        data: i
      }))
    )
    await get().refresh()
  },

  async upsertEvidenceItem(item) {
    await window.api.entityUpsert(
      'evidence_plan_items',
      item.id,
      { auditProjectId: item.auditProjectId, clauseId: item.clauseId },
      item
    )
    await get().refresh()
  },

  async removeEvidenceItem(id) {
    await window.api.entityRemove('evidence_plan_items', id)
    await get().refresh()
  },

  async upsertGapAssessment(item) {
    await window.api.entityUpsert(
      'gap_assessments',
      item.id,
      { auditProjectId: item.auditProjectId, clauseId: item.clauseId, rating: item.rating },
      item
    )
    await get().refresh()
  },

  async addReadinessSnapshot(snapshot) {
    await window.api.entityUpsert(
      'readiness_snapshots',
      snapshot.id,
      { auditProjectId: snapshot.auditProjectId, takenAt: snapshot.takenAt },
      snapshot
    )
    await get().refresh()
  }
}))
