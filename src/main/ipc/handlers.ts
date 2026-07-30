import { ipcMain, dialog, BrowserWindow } from 'electron'
import path from 'node:path'
import { Workspace, type EntityTable } from '../db/workspace'
import { IPC_CHANNELS, type WorkspaceState } from '../../shared/ipc'
import type { ExportDocument } from '../../shared/export'
import { writeExcel } from '../export/excel'
import { writePdf } from '../export/pdf'

let currentWorkspace: Workspace | null = null

function buildState(ws: Workspace): WorkspaceState {
  return {
    filePath: ws.filePath,
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
    currentWorkspace = await Workspace.openFile(result.filePaths[0])
    return { canceled: false, state: buildState(currentWorkspace) }
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
    ws.saveAs(result.filePath)
    return { canceled: false, filePath: result.filePath }
  }

  ipcMain.handle(IPC_CHANNELS.workspaceSave, async () => {
    const ws = requireWorkspace()
    if (!ws.filePath) return saveAs()
    ws.save()
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
  // document in any desktop office app.
  ipcMain.handle(
    IPC_CHANNELS.entityUpsert,
    async (_e, table: EntityTable, id: string, row: Record<string, unknown>, data: unknown) => {
      const ws = requireWorkspace()
      ws.upsert(table, id, row, data)
      if (ws.filePath) ws.save()
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.entityBulkUpsert,
    async (_e, items: { table: EntityTable; id: string; row: Record<string, unknown>; data: unknown }[]) => {
      const ws = requireWorkspace()
      for (const item of items) ws.upsert(item.table, item.id, item.row, item.data)
      if (ws.filePath) ws.save()
    }
  )

  ipcMain.handle(IPC_CHANNELS.entityRemove, async (_e, table: EntityTable, id: string) => {
    const ws = requireWorkspace()
    ws.remove(table, id)
    if (ws.filePath) ws.save()
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
