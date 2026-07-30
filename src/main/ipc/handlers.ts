import { ipcMain, dialog, BrowserWindow } from 'electron'
import path from 'node:path'
import { Workspace, NeedsPassphraseError, type EntityTable } from '../db/workspace'
import { IPC_CHANNELS, type WorkspaceState } from '../../shared/ipc'
import { IncorrectPassphraseError, decryptBytes } from '../../shared/crypto'
import type { ExportDocument } from '../../shared/export'
import { writeExcel } from '../export/excel'
import { writePdf } from '../export/pdf'

let currentWorkspace: Workspace | null = null
/** Encrypted bytes of a file the user just picked, awaiting a passphrase via workspaceUnlock. */
let pendingUnlock: { bytes: Uint8Array; filePath: string } | null = null

function buildState(ws: Workspace): WorkspaceState {
  return {
    filePath: ws.filePath,
    isEncrypted: ws.isEncrypted,
    auditProjects: ws.getAll('audit_projects'),
    programmeSlots: ws.getAll('programme_slots'),
    checklistItems: ws.getAll('checklist_items'),
    evidencePlanItems: ws.getAll('evidence_plan_items'),
    gapAssessments: ws.getAll('gap_assessments'),
    readinessSnapshots: ws.getAll('readiness_snapshots'),
    reports: ws.getAll('reports')
  }
}

function requireWorkspace(): Workspace {
  if (!currentWorkspace) throw new Error('No workspace is open.')
  return currentWorkspace
}

export function getCurrentWorkspace(): Workspace | null {
  return currentWorkspace
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.workspaceNew, async () => {
    currentWorkspace = await Workspace.createNew()
    pendingUnlock = null
    return buildState(currentWorkspace)
  })

  ipcMain.handle(IPC_CHANNELS.workspaceOpen, async () => {
    const win = getWindow()
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'Open Audit Workspace',
      filters: [{ name: 'Audit Planner Workspace', extensions: ['iaap'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { canceled: true }
    try {
      currentWorkspace = await Workspace.openFile(result.filePaths[0])
      pendingUnlock = null
      return { canceled: false, state: buildState(currentWorkspace) }
    } catch (err) {
      if (err instanceof NeedsPassphraseError) {
        pendingUnlock = { bytes: err.encryptedBytes, filePath: result.filePaths[0] }
        return { canceled: false, needsPassphrase: true }
      }
      throw err
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspaceUnlock, async (_e, passphrase: string) => {
    if (!pendingUnlock) return { success: false, error: 'No file is waiting to be unlocked.' }
    try {
      const decrypted = await decryptBytes(pendingUnlock.bytes, passphrase)
      currentWorkspace = await Workspace.fromDecryptedBytes(decrypted, pendingUnlock.filePath, passphrase)
      pendingUnlock = null
      return { success: true, state: buildState(currentWorkspace) }
    } catch (err) {
      if (err instanceof IncorrectPassphraseError) return { success: false, error: err.message }
      throw err
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspaceSetPassphrase, async (_e, passphrase: string | null) => {
    const ws = requireWorkspace()
    ws.setPassphrase(passphrase)
    if (ws.filePath) await ws.save()
    return { ok: true }
  })

  const saveAs = async (): Promise<{ canceled: boolean; filePath?: string }> => {
    const ws = requireWorkspace()
    const win = getWindow()
    const result = await dialog.showSaveDialog(win ?? undefined!, {
      title: 'Save Audit Workspace As',
      defaultPath: 'Audit Workspace.iaap',
      filters: [{ name: 'Audit Planner Workspace', extensions: ['iaap'] }]
    })
    if (result.canceled || !result.filePath) return { canceled: true }
    await ws.saveAs(result.filePath)
    return { canceled: false, filePath: result.filePath }
  }

  ipcMain.handle(IPC_CHANNELS.workspaceSave, async () => {
    const ws = requireWorkspace()
    if (!ws.filePath) return saveAs()
    await ws.save()
    return { canceled: false, filePath: ws.filePath }
  })

  ipcMain.handle(IPC_CHANNELS.workspaceSaveAs, () => saveAs())

  ipcMain.handle(IPC_CHANNELS.workspaceGetState, async () => {
    const ws = requireWorkspace()
    return buildState(ws)
  })

  // Mutations always update the in-memory database; they only flush to disk
  // (ws.save()) when the workspace already has a file path. A brand-new,
  // not-yet-saved workspace is still fully usable in memory — the user is
  // prompted to choose a location the first time they explicitly hit
  // Save/Save As (or on autosave once a path exists), just like a new
  // document in any desktop office app. When a passphrase is set, ws.save()
  // encrypts transparently — callers here don't need to know that.
  ipcMain.handle(
    IPC_CHANNELS.entityUpsert,
    async (_e, table: EntityTable, id: string, row: Record<string, unknown>, data: unknown) => {
      const ws = requireWorkspace()
      ws.upsert(table, id, row, data)
      if (ws.filePath) await ws.save()
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.entityBulkUpsert,
    async (_e, items: { table: EntityTable; id: string; row: Record<string, unknown>; data: unknown }[]) => {
      const ws = requireWorkspace()
      for (const item of items) ws.upsert(item.table, item.id, item.row, item.data)
      if (ws.filePath) await ws.save()
    }
  )

  ipcMain.handle(IPC_CHANNELS.entityRemove, async (_e, table: EntityTable, id: string) => {
    const ws = requireWorkspace()
    ws.remove(table, id)
    if (ws.filePath) await ws.save()
  })

  ipcMain.handle(
    IPC_CHANNELS.exportDocument,
    async (_e, format: 'xlsx' | 'pdf', doc: ExportDocument, suggestedName: string) => {
      const win = getWindow()
      const ext = format
      const result = await dialog.showSaveDialog(win ?? undefined!, {
        title: 'Export Report',
        defaultPath: `${suggestedName}.${ext}`,
        filters: [{ name: format === 'xlsx' ? 'Excel Workbook' : 'PDF Document', extensions: [ext] }]
      })
      if (result.canceled || !result.filePath) return { canceled: true }
      if (format === 'xlsx') await writeExcel(doc, result.filePath)
      else await writePdf(doc, result.filePath)
      return { canceled: false, filePath: result.filePath }
    }
  )
}

export function workspaceFileNameHint(filePath: string | null): string {
  return filePath ? path.basename(filePath) : 'Untitled Workspace'
}
