import fs from 'node:fs'
import path from 'node:path'
import initSqlJs from 'sql.js'
import { SqlWorkspaceCore, type EntityTable } from '../../shared/workspaceEntities'

export type { EntityTable }

let sqlJsModulePromise: ReturnType<typeof initSqlJs> | null = null

function loadSqlJs() {
  if (!sqlJsModulePromise) {
    // sql.js's package.json has no "./package.json" export subpath, so resolve
    // via its main entry (dist/sql-wasm.js) instead and locate the wasm binary
    // alongside it.
    const sqlJsDist = path.dirname(require.resolve('sql.js'))
    sqlJsModulePromise = initSqlJs({
      locateFile: (file: string) => path.join(sqlJsDist, file)
    })
  }
  return sqlJsModulePromise
}

export class Workspace {
  private constructor(
    private core: SqlWorkspaceCore,
    public filePath: string | null
  ) {}

  static async createNew(): Promise<Workspace> {
    const SQL = await loadSqlJs()
    return new Workspace(new SqlWorkspaceCore(new SQL.Database()), null)
  }

  static async openFile(filePath: string): Promise<Workspace> {
    const SQL = await loadSqlJs()
    const buffer = fs.readFileSync(filePath)
    return new Workspace(new SqlWorkspaceCore(new SQL.Database(buffer)), filePath)
  }

  saveAs(filePath: string): void {
    fs.writeFileSync(filePath, Buffer.from(this.core.export()))
    this.filePath = filePath
  }

  save(): void {
    if (!this.filePath) throw new Error('Workspace has no file path yet; use saveAs.')
    this.saveAs(this.filePath)
  }

  close(): void {
    this.core.close()
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

  getSetting(key: string): string | null {
    return this.core.getSetting(key)
  }

  setSetting(key: string, value: string): void {
    this.core.setSetting(key, value)
  }
}
