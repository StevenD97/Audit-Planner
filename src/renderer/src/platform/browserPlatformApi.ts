import type { PreloadApi, WorkspaceState } from '@shared/ipc'
import type { EntityTable } from '@shared/workspaceEntities'
import type { ExportDocument } from '@shared/export'
import { NeedsPassphraseError } from '@shared/crypto'
import { BrowserWorkspace } from './browserWorkspace'
import { buildExcelBlob, buildPdfBlob, downloadBlob } from './browserExport'

let current: BrowserWorkspace | null = null
/** Bytes (+ display name) of a file/autosave awaiting a passphrase via workspaceUnlock. */
let pendingUnlock: { bytes: Uint8Array; displayName: string; source: 'file' | 'autosave' } | null = null

function buildState(ws: BrowserWorkspace): WorkspaceState {
  return {
    filePath: ws.displayName,
    isEncrypted: ws.isEncrypted,
    auditProjects: ws.getAll('audit_projects'),
    programmeSlots: ws.getAll('programme_slots'),
    checklistItems: ws.getAll('checklist_items'),
    evidencePlanItems: ws.getAll('evidence_plan_items'),
    gapAssessments: ws.getAll('gap_assessments'),
    readinessSnapshots: ws.getAll('readiness_snapshots'),
    reports: ws.getAll('reports'),
    organisations: ws.getAll('organisations'),
    regions: ws.getAll('regions'),
    orgSites: ws.getAll('org_sites'),
    orgDepartments: ws.getAll('org_departments'),
    orgFunctions: ws.getAll('org_functions'),
    processes: ws.getAll('processes'),
    activities: ws.getAll('activities'),
    risks: ws.getAll('risks'),
    controls: ws.getAll('controls'),
    legislation: ws.getAll('legislation'),
    complianceObligations: ws.getAll('compliance_obligations'),
    complianceEvaluations: ws.getAll('compliance_evaluations'),
    auditFindings: ws.getAll('audit_findings'),
    rootCauseAnalyses: ws.getAll('root_cause_analyses'),
    correctiveActions: ws.getAll('corrective_actions'),
    samplingPlans: ws.getAll('sampling_plans'),
    maturityAssessments: ws.getAll('maturity_assessments'),
    maturityDimensionScores: ws.getAll('maturity_dimension_scores')
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
    pendingUnlock = null
    await autosave()
    return buildState(current)
  },

  async workspaceOpen() {
    const file = await pickFile('.iaap,application/x-sqlite3,application/octet-stream')
    if (!file) return { canceled: true }
    const bytes = new Uint8Array(await file.arrayBuffer())
    try {
      current = await BrowserWorkspace.fromBytes(bytes, file.name)
      pendingUnlock = null
      await autosave()
      return { canceled: false, state: buildState(current) }
    } catch (err) {
      if (err instanceof NeedsPassphraseError) {
        pendingUnlock = { bytes: err.encryptedBytes, displayName: file.name, source: 'file' }
        return { canceled: false, needsPassphrase: true }
      }
      throw err
    }
  },

  async workspaceUnlock(passphrase: string) {
    if (!pendingUnlock) return { success: false, error: 'No file is waiting to be unlocked.' }
    try {
      current = await BrowserWorkspace.fromBytes(pendingUnlock.bytes, pendingUnlock.displayName, passphrase)
      pendingUnlock = null
      await autosave()
      return { success: true, state: buildState(current) }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  },

  async workspaceSetPassphrase(passphrase: string | null) {
    const ws = requireWorkspace()
    ws.setPassphrase(passphrase)
    await autosave()
    return { ok: true }
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
    downloadBlob(new Blob([(await ws.exportBytes()) as BlobPart]), fileName)
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

/**
 * Called once at renderer startup (browser mode only) to reload any
 * autosaved workspace. Returns `{ needsPassphrase: true }` instead of state
 * if the autosaved copy is passphrase-protected — the caller should prompt
 * and then call `browserPlatformApi.workspaceUnlock`.
 */
export async function tryRestoreAutosavedWorkspace(): Promise<
  { state: WorkspaceState } | { needsPassphrase: true } | null
> {
  try {
    const restored = await BrowserWorkspace.fromAutosave()
    if (!restored) return null
    current = restored
    return { state: buildState(current) }
  } catch (err) {
    if (err instanceof NeedsPassphraseError) {
      pendingUnlock = { bytes: err.encryptedBytes, displayName: 'Autosaved workspace', source: 'autosave' }
      return { needsPassphrase: true }
    }
    throw err
  }
}
