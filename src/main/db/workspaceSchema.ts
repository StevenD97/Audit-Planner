/**
 * Schema for a workspace file (.iaap — Iso Audit Application Package).
 *
 * Pragmatic deviation from docs/DATABASE_SCHEMA.md: each documented entity
 * table keeps its real, queryable identity columns (id, audit_project_id,
 * clause_id, status/rating where useful for fast filtering) but the rest of
 * the entity is stored as a JSON `data` column rather than one SQL column per
 * field. This keeps the schema stable while the shared TypeScript types in
 * src/shared/types.ts evolve, without a migration for every added field —
 * appropriate for a single-user desktop file rather than a shared server
 * database. The standards knowledge base (clauses, trails) is NOT stored in
 * SQLite at all: it is static, read-only reference data bundled with the
 * app (src/shared/knowledge-base) and imported directly by both the main and
 * renderer processes, which is both simpler and faster for interactive
 * search/filtering than round-tripping through IPC + SQL.
 */
export const WORKSPACE_SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_projects (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programme_slots (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_programme_slots_project ON programme_slots(audit_project_id);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_project ON checklist_items(audit_project_id);

CREATE TABLE IF NOT EXISTS evidence_plan_items (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_plan_items_project ON evidence_plan_items(audit_project_id);

CREATE TABLE IF NOT EXISTS gap_assessments (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  clause_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gap_assessments_project ON gap_assessments(audit_project_id);

CREATE TABLE IF NOT EXISTS readiness_snapshots (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  taken_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_project ON readiness_snapshots(audit_project_id);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(audit_project_id);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`
