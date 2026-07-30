import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc'
import type { PreloadApi } from '../shared/ipc'
import type { EntityTable } from '../main/db/workspace'

const api: PreloadApi = {
  workspaceNew: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceNew),
  workspaceOpen: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceOpen),
  workspaceSave: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceSave),
  workspaceSaveAs: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceSaveAs),
  workspaceGetState: () => ipcRenderer.invoke(IPC_CHANNELS.workspaceGetState),
  entityUpsert: (table: EntityTable, id, row, data) =>
    ipcRenderer.invoke(IPC_CHANNELS.entityUpsert, table, id, row, data),
  entityBulkUpsert: (items) => ipcRenderer.invoke(IPC_CHANNELS.entityBulkUpsert, items),
  entityRemove: (table: EntityTable, id) => ipcRenderer.invoke(IPC_CHANNELS.entityRemove, table, id),
  exportDocument: (format, doc, suggestedName) =>
    ipcRenderer.invoke(IPC_CHANNELS.exportDocument, format, doc, suggestedName)
}

contextBridge.exposeInMainWorld('api', api)

contextBridge.exposeInMainWorld('menuEvents', {
  onNew: (cb: () => void) => ipcRenderer.on('menu:new', cb),
  onOpen: (cb: () => void) => ipcRenderer.on('menu:open', cb),
  onSave: (cb: () => void) => ipcRenderer.on('menu:save', cb),
  onSaveAs: (cb: () => void) => ipcRenderer.on('menu:saveAs', cb)
})
