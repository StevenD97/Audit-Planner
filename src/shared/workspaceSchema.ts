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

-- Process-centric organisational model (additive; see
-- docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §4). Workspace-scoped master
-- data, independent of any one audit_projects row.
CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_regions_org ON regions(organisation_id);

CREATE TABLE IF NOT EXISTS org_sites (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_sites_org ON org_sites(organisation_id);

CREATE TABLE IF NOT EXISTS org_departments (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_departments_site ON org_departments(site_id);

CREATE TABLE IF NOT EXISTS org_functions (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_org_functions_department ON org_functions(department_id);

CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  function_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_processes_function ON processes(function_id);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_process ON activities(process_id);

CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_risks_process ON risks(process_id);

CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY,
  risk_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_controls_risk ON controls(risk_id);

-- Legal & compliance obligations (additive; see
-- docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §4.3).
CREATE TABLE IF NOT EXISTS legislation (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS compliance_obligations (
  id TEXT PRIMARY KEY,
  legislation_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_compliance_obligations_legislation ON compliance_obligations(legislation_id);

CREATE TABLE IF NOT EXISTS compliance_evaluations (
  id TEXT PRIMARY KEY,
  obligation_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_compliance_evaluations_obligation ON compliance_evaluations(obligation_id);

-- Findings & corrective action lifecycle (additive; see
-- docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md §4.4).
CREATE TABLE IF NOT EXISTS audit_findings (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_findings_project ON audit_findings(audit_project_id);

CREATE TABLE IF NOT EXISTS root_cause_analyses (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_root_cause_analyses_finding ON root_cause_analyses(finding_id);

CREATE TABLE IF NOT EXISTS corrective_actions (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_finding ON corrective_actions(finding_id);

-- Audit sampling plans (additive; see
-- docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md's Phase 7 notes).
CREATE TABLE IF NOT EXISTS sampling_plans (
  id TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sampling_plans_project ON sampling_plans(audit_project_id);
`
