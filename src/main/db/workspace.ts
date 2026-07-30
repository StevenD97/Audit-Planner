import fs from 'node:fs'
import path from 'node:path'
import initSqlJs, { type Database } from 'sql.js'
import { WORKSPACE_SCHEMA } from './workspaceSchema'

export type EntityTable =
  | 'audit_projects'
  | 'programme_slots'
  | 'checklist_items'
  | 'evidence_plan_items'
  | 'gap_assessments'
  | 'readiness_snapshots'
  | 'reports'

const EXTRA_COLUMNS: Record<EntityTable, string[]> = {
  audit_projects: ['status', 'updated_at'],
  programme_slots: ['audit_project_id'],
  checklist_items: ['audit_project_id', 'clause_id'],
  evidence_plan_items: ['audit_project_id', 'clause_id'],
  gap_assessments: ['audit_project_id', 'clause_id', 'rating'],
  readiness_snapshots: ['audit_project_id', 'taken_at'],
  reports: ['audit_project_id']
}

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
    private db: Database,
    public filePath: string | null
  ) {}

  static async createNew(): Promise<Workspace> {
    const SQL = await loadSqlJs()
    const db = new SQL.Database()
    db.run(WORKSPACE_SCHEMA)
    return new Workspace(db, null)
  }

  static async openFile(filePath: string): Promise<Workspace> {
    const SQL = await loadSqlJs()
    const buffer = fs.readFileSync(filePath)
    const db = new SQL.Database(buffer)
    db.run(WORKSPACE_SCHEMA) // idempotent: adds any tables missing from an older file version
    return new Workspace(db, filePath)
  }

  saveAs(filePath: string): void {
    const data = this.db.export()
    fs.writeFileSync(filePath, Buffer.from(data))
    this.filePath = filePath
  }

  save(): void {
    if (!this.filePath) throw new Error('Workspace has no file path yet; use saveAs.')
    this.saveAs(this.filePath)
  }

  close(): void {
    this.db.close()
  }

  upsert(table: EntityTable, id: string, row: Record<string, unknown>, data: unknown): void {
    const cols = EXTRA_COLUMNS[table]
    const colNames = ['id', ...cols, 'data']
    const placeholders = colNames.map(() => '?').join(', ')
    const updates = colNames
      .filter((c) => c !== 'id')
      .map((c) => `${c} = excluded.${c}`)
      .join(', ')
    const sql = `INSERT INTO ${table} (${colNames.join(', ')}) VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates}`
    const values = [id, ...cols.map((c) => row[toCamel(c)] ?? null), JSON.stringify(data)]
    this.db.run(sql, values as (string | number | null)[])
  }

  remove(table: EntityTable, id: string): void {
    this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id])
  }

  getAll<T>(table: EntityTable, whereAuditProjectId?: string): T[] {
    const sql = whereAuditProjectId
      ? `SELECT data FROM ${table} WHERE audit_project_id = ?`
      : `SELECT data FROM ${table}`
    const stmt = this.db.prepare(sql)
    if (whereAuditProjectId) stmt.bind([whereAuditProjectId])
    const rows: T[] = []
    while (stmt.step()) {
      const r = stmt.getAsObject() as { data: string }
      rows.push(JSON.parse(r.data) as T)
    }
    stmt.free()
    return rows
  }

  getSetting(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM app_settings WHERE key = ?')
    stmt.bind([key])
    let value: string | null = null
    if (stmt.step()) value = (stmt.getAsObject() as { value: string }).value
    stmt.free()
    return value
  }

  setSetting(key: string, value: string): void {
    this.db.run(
      `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    )
  }
}

function toCamel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}
