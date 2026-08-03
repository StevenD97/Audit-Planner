import type { Database } from 'sql.js'
import { WORKSPACE_SCHEMA } from './workspaceSchema'
import { runSchemaV2Migration } from './migrations'

export type EntityTable =
  | 'audit_projects'
  | 'programme_slots'
  | 'checklist_items'
  | 'evidence_plan_items'
  | 'gap_assessments'
  | 'readiness_snapshots'
  | 'reports'
  | 'organisations'
  | 'regions'
  | 'org_sites'
  | 'org_departments'
  | 'org_functions'
  | 'processes'
  | 'activities'
  | 'risks'
  | 'controls'

const EXTRA_COLUMNS: Record<EntityTable, string[]> = {
  audit_projects: ['status', 'updated_at'],
  programme_slots: ['audit_project_id'],
  checklist_items: ['audit_project_id', 'clause_id'],
  evidence_plan_items: ['audit_project_id', 'clause_id'],
  gap_assessments: ['audit_project_id', 'clause_id', 'rating'],
  readiness_snapshots: ['audit_project_id', 'taken_at'],
  reports: ['audit_project_id'],
  organisations: [],
  regions: ['organisation_id'],
  org_sites: ['organisation_id'],
  org_departments: ['site_id'],
  org_functions: ['department_id'],
  processes: ['function_id'],
  activities: ['process_id'],
  risks: ['process_id'],
  controls: ['risk_id']
}

function toCamel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * Pure wrapper around a sql.js `Database` handle — no filesystem, no
 * IndexedDB, no Electron. This is the one piece of persistence logic shared
 * verbatim between the desktop build (src/main/db/workspace.ts, which adds
 * fs-based load/save) and the browser build
 * (src/renderer/src/platform/browserWorkspace.ts, which adds IndexedDB +
 * file-download/upload load/save) so the SQL never drifts between the two.
 */
export class SqlWorkspaceCore {
  constructor(private db: Database) {
    db.run(WORKSPACE_SCHEMA) // idempotent: adds any tables missing from an older file version
    runSchemaV2Migration(this) // idempotent: no-op once schema_version is already current
  }

  export(): Uint8Array {
    return this.db.export()
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
