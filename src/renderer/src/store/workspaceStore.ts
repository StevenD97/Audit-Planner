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
import type { EntityTable } from '@shared/workspaceEntities'
import { getPlatformApi, isElectron, tryRestoreAutosavedWorkspace } from '../platform'

export type PassphraseModalState = { mode: 'set' } | { mode: 'unlock'; error?: string } | null

interface Store {
  workspace: WorkspaceState | null
  loading: boolean
  currentAuditProjectId: string | null
  aiPanelOpen: boolean
  toast: string | null
  passphraseModal: PassphraseModalState

  init(): Promise<void>
  newWorkspace(): Promise<void>
  openWorkspace(): Promise<void>
  saveWorkspace(): Promise<void>
  saveWorkspaceAs(): Promise<void>
  refresh(): Promise<void>
  setCurrentAuditProject(id: string | null): void
  setAiPanelOpen(open: boolean): void
  setToast(message: string | null): void

  openSetPassphraseModal(): void
  closePassphraseModal(): Promise<void>
  submitUnlockPassphrase(passphrase: string): Promise<void>
  submitSetPassphrase(passphrase: string | null): Promise<void>

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

  /**
   * Generic upsert/remove for the process-centric org-hierarchy tables
   * (organisations, regions, org_sites, org_departments, org_functions,
   * processes, activities, risks, controls) — these are simple master-data
   * records with no bespoke row-shaping beyond what EntityTable's extra
   * columns already define, so a dedicated named wrapper per table (9 pairs)
   * would be repetition without adding type safety the caller doesn't
   * already get by passing a correctly-typed `data` object.
   */
  upsertEntity(table: EntityTable, row: Record<string, unknown>, data: { id: string }): Promise<void>
  removeEntity(table: EntityTable, id: string): Promise<void>
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
  passphraseModal: null,

  async init() {
    set({ loading: true })
    if (isElectron()) {
      // Electron always starts a fresh in-memory workspace; Open/Save work
      // against real files (and prompt for a passphrase there if needed).
      const state = await getPlatformApi().workspaceNew()
      set({ workspace: state, loading: false })
      return
    }
    // Browser build: pick up whatever was last autosaved to IndexedDB.
    const restored = await tryRestoreAutosavedWorkspace()
    if (restored === null) {
      const state = await getPlatformApi().workspaceNew()
      set({ workspace: state, loading: false, passphraseModal: { mode: 'set' } })
    } else if ('needsPassphrase' in restored) {
      set({ loading: false, passphraseModal: { mode: 'unlock' } })
    } else {
      set({ workspace: restored.state, loading: false })
    }
  },

  async newWorkspace() {
    const state = await getPlatformApi().workspaceNew()
    // Secure-by-default: offer passphrase protection up front rather than
    // making the user remember to go find the setting later.
    set({ workspace: state, currentAuditProjectId: null, passphraseModal: { mode: 'set' } })
  },

  async openWorkspace() {
    const result = await getPlatformApi().workspaceOpen()
    if (result.canceled) return
    if (result.needsPassphrase) {
      set({ passphraseModal: { mode: 'unlock' } })
      return
    }
    if (!result.state) return
    set({ workspace: result.state, currentAuditProjectId: null, passphraseModal: null })
  },

  async saveWorkspace() {
    const result = await getPlatformApi().workspaceSave()
    if (!result.canceled) get().setToast(`Saved: ${result.filePath}`)
  },

  async saveWorkspaceAs() {
    const result = await getPlatformApi().workspaceSaveAs()
    if (!result.canceled) get().setToast(`Saved: ${result.filePath}`)
  },

  async refresh() {
    const state = await getPlatformApi().workspaceGetState()
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

  openSetPassphraseModal() {
    set({ passphraseModal: { mode: 'set' } })
  },

  async closePassphraseModal() {
    // If we were still initializing (autosave restore needed a passphrase
    // the user can't/won't supply right now), fall back to a fresh
    // workspace rather than leaving the app stuck with nothing loaded. The
    // encrypted autosave is untouched in IndexedDB — reloading the page
    // will prompt again if they want to try the passphrase another time.
    const stillInitializing = get().workspace === null
    set({ passphraseModal: null })
    if (stillInitializing) {
      const state = await getPlatformApi().workspaceNew()
      set({ workspace: state, loading: false })
    }
  },

  async submitUnlockPassphrase(passphrase) {
    const result = await getPlatformApi().workspaceUnlock(passphrase)
    if (!result.success || !result.state) {
      set({ passphraseModal: { mode: 'unlock', error: result.error ?? 'Incorrect passphrase.' } })
      return
    }
    set({ workspace: result.state, currentAuditProjectId: null, passphraseModal: null, loading: false })
  },

  async submitSetPassphrase(passphrase) {
    await getPlatformApi().workspaceSetPassphrase(passphrase)
    await get().refresh()
    set({ passphraseModal: null })
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
    await getPlatformApi().entityUpsert('audit_projects', project.id, { status: project.status, updatedAt: project.updatedAt }, project)
    await get().refresh()
    set({ currentAuditProjectId: project.id })
    return project
  },

  async updateAuditProject(id, patch) {
    const ws = get().workspace
    const existing = ws?.auditProjects.find((p) => p.id === id)
    if (!existing) return
    const updated: AuditProject = { ...existing, ...patch, updatedAt: nowIso() }
    await getPlatformApi().entityUpsert('audit_projects', id, { status: updated.status, updatedAt: updated.updatedAt }, updated)
    await get().refresh()
  },

  async replaceProgrammeSlots(auditProjectId, slots) {
    const ws = get().workspace
    const existingIds = (ws?.programmeSlots ?? []).filter((s) => s.auditProjectId === auditProjectId).map((s) => s.id)
    for (const id of existingIds) await getPlatformApi().entityRemove('programme_slots', id)
    await getPlatformApi().entityBulkUpsert(
      slots.map((s) => ({ table: 'programme_slots' as const, id: s.id, row: { auditProjectId: s.auditProjectId }, data: s }))
    )
    await get().refresh()
  },

  async upsertProgrammeSlot(slot) {
    await getPlatformApi().entityUpsert('programme_slots', slot.id, { auditProjectId: slot.auditProjectId }, slot)
    await get().refresh()
  },

  async removeProgrammeSlot(id) {
    await getPlatformApi().entityRemove('programme_slots', id)
    await get().refresh()
  },

  async bulkUpsertChecklistItems(items) {
    await getPlatformApi().entityBulkUpsert(
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
    await getPlatformApi().entityUpsert(
      'checklist_items',
      item.id,
      { auditProjectId: item.auditProjectId, clauseId: item.clauseId },
      item
    )
    await get().refresh()
  },

  async removeChecklistItem(id) {
    await getPlatformApi().entityRemove('checklist_items', id)
    await get().refresh()
  },

  async bulkUpsertEvidenceItems(items) {
    await getPlatformApi().entityBulkUpsert(
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
    await getPlatformApi().entityUpsert(
      'evidence_plan_items',
      item.id,
      { auditProjectId: item.auditProjectId, clauseId: item.clauseId },
      item
    )
    await get().refresh()
  },

  async removeEvidenceItem(id) {
    await getPlatformApi().entityRemove('evidence_plan_items', id)
    await get().refresh()
  },

  async upsertGapAssessment(item) {
    await getPlatformApi().entityUpsert(
      'gap_assessments',
      item.id,
      { auditProjectId: item.auditProjectId, clauseId: item.clauseId, rating: item.rating },
      item
    )
    await get().refresh()
  },

  async addReadinessSnapshot(snapshot) {
    await getPlatformApi().entityUpsert(
      'readiness_snapshots',
      snapshot.id,
      { auditProjectId: snapshot.auditProjectId, takenAt: snapshot.takenAt },
      snapshot
    )
    await get().refresh()
  },

  async upsertEntity(table, row, data) {
    await getPlatformApi().entityUpsert(table, data.id, row, data)
    await get().refresh()
  },

  async removeEntity(table, id) {
    await getPlatformApi().entityRemove(table, id)
    await get().refresh()
  }
}))
