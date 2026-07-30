import type { PreloadApi, WorkspaceState } from '@shared/ipc'
import type { EntityTable } from '@shared/workspaceEntities'
import type { ExportDocument } from '@shared/export'
import { BrowserWorkspace } from './browserWorkspace'
import { buildExcelBlob, buildPdfBlob, downloadBlob } from './browserExport'

let current: BrowserWorkspace | null = null

function buildState(ws: BrowserWorkspace): WorkspaceState {
  return {
    filePath: ws.displayName,
    auditProjects: ws.getAll('audit_projects'),
    programmeSlots: ws.getAll('programme_slots'),
    checklistItems: ws.getAll('checklist_items'),
    evidencePlanItems: ws.getAll('evidence_plan_items'),
    gapAssessments: ws.getAll('gap_assessments'),
    readinessSnapshots: ws.getAll('readiness_snapshots'),
    reports: ws.getAll('reports')
  }
}

function requireWorkspace(): BrowserWorkspace {
  if (!current) throw new Error('No workspace is open.')
  return current
}

/** Opens a hidden native file picker and resolves with the chosen File, or null if cancelled. */
function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true })
    // Some browsers only fire `cancel` on the input, not a change event when
    // the picker is dismissed with no selection.
    input.addEventListener('cancel', () => resolve(null), { once: true })
    document.body.appendChild(input)
    input.click()
    setTimeout(() => input.remove(), 0)
  })
}

async function autosave(): Promise<void> {
  if (current) await current.persistToIndexedDb()
}

export const browserPlatformApi: PreloadApi = {
  async workspaceNew() {
    current = await BrowserWorkspace.createNew()
    await autosave()
    return buildState(current)
  },

  async workspaceOpen() {
    const file = await pickFile('.iaap,application/x-sqlite3,application/octet-stream')
    if (!file) return { canceled: true }
    const bytes = new Uint8Array(await file.arrayBuffer())
    current = await BrowserWorkspace.fromBytes(bytes, file.name)
    await autosave()
    return { canceled: false, state: buildState(current) }
  },

  async workspaceSave() {
    // There is no ambient "current file" to overwrite in a browser the way
    // there is a filesystem path on desktop — Save persists to this
    // browser's IndexedDB (so the workspace is here next time you open the
    // page on this device), and Save As (below) is what produces a real
    // downloadable file.
    const ws = requireWorkspace()
    await ws.persistToIndexedDb()
    return { canceled: false, filePath: ws.displayName ?? 'Browser storage (autosaved)' }
  },

  async workspaceSaveAs() {
    const ws = requireWorkspace()
    const name = ws.displayName?.replace(/\.iaap$/i, '') || 'Audit Workspace'
    const fileName = `${name}.iaap`
    downloadBlob(new Blob([ws.export() as BlobPart]), fileName)
    ws.displayName = fileName
    await autosave()
    return { canceled: false, filePath: fileName }
  },

  async workspaceGetState() {
    return buildState(requireWorkspace())
  },

  async entityUpsert(table: EntityTable, id: string, row: Record<string, unknown>, data: unknown) {
    requireWorkspace().upsert(table, id, row, data)
    await autosave()
  },

  async entityBulkUpsert(items) {
    const ws = requireWorkspace()
    for (const item of items) ws.upsert(item.table, item.id, item.row, item.data)
    await autosave()
  },

  async entityRemove(table: EntityTable, id: string) {
    requireWorkspace().remove(table, id)
    await autosave()
  },

  async exportDocument(format: 'xlsx' | 'pdf', doc: ExportDocument, suggestedName: string) {
    const fileName = `${suggestedName}.${format}`
    const blob = format === 'xlsx' ? await buildExcelBlob(doc) : await buildPdfBlob(doc)
    downloadBlob(blob, fileName)
    return { canceled: false, filePath: fileName }
  }
}

/** Called once at renderer startup (browser mode only) to reload any autosaved workspace. */
export async function tryRestoreAutosavedWorkspace(): Promise<WorkspaceState | null> {
  const restored = await BrowserWorkspace.fromAutosave()
  if (!restored) return null
  current = restored
  return buildState(current)
}
