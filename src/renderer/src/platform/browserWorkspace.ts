import initSqlJs from 'sql.js/dist/sql-wasm.js'
// Deep-importing the exact same dist file the desktop build uses (rather than
// letting the bundler pick sql.js's "browser" package.json condition) so the
// JS glue and the .wasm binary are guaranteed to be the matching pair — see
// src/main/db/workspace.ts for the Node-side equivalent.
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { SqlWorkspaceCore, type EntityTable } from '@shared/workspaceEntities'
import { idbGet, idbSet } from './idb'

export type { EntityTable }

const AUTOSAVE_KEY = 'current-workspace'

let sqlJsModulePromise: ReturnType<typeof initSqlJs> | null = null

function loadSqlJs() {
  if (!sqlJsModulePromise) {
    sqlJsModulePromise = initSqlJs({ locateFile: () => sqlWasmUrl })
  }
  return sqlJsModulePromise
}

export class BrowserWorkspace {
  private constructor(
    private core: SqlWorkspaceCore,
    /** Display-only name; there is no real filesystem path in a browser. */
    public displayName: string | null
  ) {}

  static async createNew(): Promise<BrowserWorkspace> {
    const SQL = await loadSqlJs()
    return new BrowserWorkspace(new SqlWorkspaceCore(new SQL.Database()), null)
  }

  static async fromBytes(bytes: Uint8Array, displayName: string): Promise<BrowserWorkspace> {
    const SQL = await loadSqlJs()
    return new BrowserWorkspace(new SqlWorkspaceCore(new SQL.Database(bytes)), displayName)
  }

  /** Reload whatever was last autosaved to this browser's IndexedDB, if anything. */
  static async fromAutosave(): Promise<BrowserWorkspace | null> {
    const saved = await idbGet<{ bytes: Uint8Array; displayName: string | null }>(AUTOSAVE_KEY)
    if (!saved) return null
    const SQL = await loadSqlJs()
    return new BrowserWorkspace(new SqlWorkspaceCore(new SQL.Database(saved.bytes)), saved.displayName)
  }

  export(): Uint8Array {
    return this.core.export()
  }

  async persistToIndexedDb(): Promise<void> {
    await idbSet(AUTOSAVE_KEY, { bytes: this.export(), displayName: this.displayName })
  }

  upsert(table: EntityTable, id: string, row: Record<string, unknown>, data: unknown): void {
    this.core.upsert(table, id, row, data)
  }

  remove(table: EntityTable, id: string): void {
    this.core.remove(table, id)
  }

  getAll<T>(table: EntityTable, whereAuditProjectId?: string): T[] {
    return this.core.getAll<T>(table, whereAuditProjectId)
  }
}
