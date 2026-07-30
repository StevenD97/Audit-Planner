# Audit Planner — Database Schema

The design below models the knowledge base as its own SQLite database
(`knowledge.db`) conceptually — this is the right shape if the app ever
needs to query/join it in SQL (e.g. reporting across thousands of clauses).
**In this MVP build it is implemented instead as static, bundled TypeScript
data** (`src/shared/knowledge-base`), imported directly by both the main and
renderer processes: it is read-only reference data, so shipping it as plain
JS avoids IPC round-trips for every clause lookup/search/filter, which
matters for an interactive Clause Explorer. The tables in §1 are therefore
best read as "the shape of each clause record", not literal SQL tables that
exist on disk. If the knowledge base ever needs to be user-editable or
multi-gigabyte, promoting §1 to a real SQLite file is a mechanical change
(see `docs/ROADMAP.md`).

One real SQLite database is used per audit workspace:

- **`<workspace-name>.iaap`** — one file per audit workspace, containing one
  or more audit projects, created/opened by the user like any other
  document. Contains everything in §2. (The actual MVP implementation
  stores each entity's non-indexed fields as a JSON `data` column rather
  than one SQL column per field — see the note at the end of §2.)

All tables use `TEXT` primary keys (ULIDs generated client-side) unless noted,
so records merge cleanly if projects are ever shared/merged, and timestamps are
ISO-8601 strings.

## 1. Knowledge base schema (`knowledge.db`)

```sql
CREATE TABLE standards (
  id            TEXT PRIMARY KEY,       -- 'iso14001', 'iso45001', 'iso9001', ...
  name          TEXT NOT NULL,          -- 'ISO 14001'
  full_title    TEXT NOT NULL,          -- 'Environmental management systems — Requirements with guidance for use'
  edition       TEXT NOT NULL,          -- '2026' / '2018+A1:2024'
  discipline    TEXT NOT NULL,          -- 'Environmental' | 'OH&S' | 'Quality' | 'Energy' | 'Information Security'
  is_active     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE clauses (
  id                    TEXT PRIMARY KEY,      -- 'iso14001-6.1.2'
  standard_id           TEXT NOT NULL REFERENCES standards(id),
  clause_number         TEXT NOT NULL,          -- '6.1.2'
  parent_clause_id      TEXT REFERENCES clauses(id), -- NULL for top-level clauses 4-10
  title                 TEXT NOT NULL,          -- 'Environmental aspects'
  sort_order            INTEGER NOT NULL,       -- for stable display ordering
  requirement_summary   TEXT NOT NULL,          -- paraphrased "shall" requirement(s)
  explanation           TEXT NOT NULL,          -- plain-English meaning
  audit_intent          TEXT NOT NULL,          -- what the auditor is trying to establish
  process_owner_roles   TEXT NOT NULL,          -- JSON array of typical role titles, e.g. ["SHE Manager","Site Engineer"]
  is_mandatory_process  INTEGER NOT NULL DEFAULT 1, -- vs guidance-only note
  assumptions           TEXT,                   -- JSON array of explicit interpretation assumptions (nullable)
  UNIQUE(standard_id, clause_number)
);
CREATE INDEX idx_clauses_standard ON clauses(standard_id);
CREATE INDEX idx_clauses_parent ON clauses(parent_clause_id);

CREATE TABLE mandatory_documented_info (
  id            TEXT PRIMARY KEY,
  clause_id     TEXT NOT NULL REFERENCES clauses(id),
  description   TEXT NOT NULL,      -- e.g. 'Environmental policy'
  kind          TEXT NOT NULL       -- 'document' | 'record'
);

CREATE TABLE evidence_items (
  id            TEXT PRIMARY KEY,
  clause_id     TEXT NOT NULL REFERENCES clauses(id),
  category      TEXT NOT NULL,      -- 'procedure' | 'record' | 'monitoring_data' | 'competence' | 'other'
  description   TEXT NOT NULL,      -- 'Aspects/impacts register with significance criteria applied'
  typical_source TEXT               -- 'Environmental Manager / EMS software'
);

CREATE TABLE interview_questions (
  id            TEXT PRIMARY KEY,
  clause_id     TEXT NOT NULL REFERENCES clauses(id),
  audience_role TEXT NOT NULL,      -- 'Top management' | 'Process owner' | 'Worker' | 'Contractor'
  question      TEXT NOT NULL,
  question_type TEXT NOT NULL       -- 'open' | 'trace' | 'verification'
);

CREATE TABLE audit_tests (
  id            TEXT PRIMARY KEY,
  clause_id     TEXT NOT NULL REFERENCES clauses(id),
  description   TEXT NOT NULL       -- e.g. 'Select 3 significant aspects; trace to operational controls and monitoring data'
);

CREATE TABLE potential_findings (
  id            TEXT PRIMARY KEY,
  clause_id     TEXT NOT NULL REFERENCES clauses(id),
  severity_hint TEXT NOT NULL,      -- 'OFI' | 'Minor' | 'Major'
  description   TEXT NOT NULL       -- typical nonconformity wording
);

CREATE TABLE related_clauses (
  id              TEXT PRIMARY KEY,
  clause_id       TEXT NOT NULL REFERENCES clauses(id),
  related_clause_id TEXT NOT NULL REFERENCES clauses(id),
  relationship    TEXT NOT NULL     -- 'feeds_into' | 'depends_on' | 'verified_by' | 'same_trail'
);

CREATE TABLE clause_equivalence (          -- cross-standard mapping (see ARCHITECTURE.md §2)
  id                TEXT PRIMARY KEY,
  clause_id         TEXT NOT NULL REFERENCES clauses(id),
  equivalent_clause_id TEXT NOT NULL REFERENCES clauses(id),
  relationship      TEXT NOT NULL   -- 'equivalent' | 'partial_overlap' | 'analogous_concept'
);

CREATE TABLE risk_prompts (
  id            TEXT PRIMARY KEY,
  clause_id     TEXT NOT NULL REFERENCES clauses(id),
  prompt        TEXT NOT NULL,      -- 'How many significant aspects has the site identified vs comparable sites?'
  risk_weight   INTEGER NOT NULL    -- 1-5, used by the readiness/AI engine to prioritise audit depth
);

CREATE TABLE audit_trails_catalogue (      -- named canonical trails (Phase 2 "Audit Trail Generator")
  id            TEXT PRIMARY KEY,
  standard_id   TEXT REFERENCES standards(id), -- NULL = cross-standard/combined trail
  name          TEXT NOT NULL,      -- 'Leadership → Objectives → Monitoring → Management Review'
  description   TEXT NOT NULL,
  step_order    TEXT NOT NULL       -- JSON array of clause_ids in trail order
);
```

## 2. Audit project schema (`<project>.iaap`)

```sql
CREATE TABLE audit_projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  standards       TEXT NOT NULL,     -- JSON array of standard_id, e.g. ["iso14001","iso45001"] for combined
  scope_statement TEXT,
  sites           TEXT NOT NULL,     -- JSON array of {id, name, address}
  departments     TEXT NOT NULL,     -- JSON array of {id, name, siteId}
  audit_type      TEXT NOT NULL,     -- 'internal' | 'external_stage1' | 'external_stage2' | 'surveillance' | 'certification'
  start_date      TEXT,
  end_date        TEXT,
  duration_days   REAL,
  lead_auditor    TEXT,
  audit_team      TEXT,              -- JSON array of {name, role}
  status          TEXT NOT NULL DEFAULT 'planning', -- planning|scheduled|in_progress|completed|closed
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE programme_slots (             -- Audit Programme Builder output
  id              TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  day_number      INTEGER NOT NULL,
  start_time      TEXT NOT NULL,     -- '09:00'
  end_time        TEXT NOT NULL,
  activity_type   TEXT NOT NULL,     -- 'opening_meeting'|'interview'|'document_review'|'site_inspection'|'closing_meeting'|'break'
  clause_ids      TEXT NOT NULL,     -- JSON array
  process_owner   TEXT,
  location        TEXT,
  notes           TEXT
);

CREATE TABLE checklist_items (              -- Audit Checklist Generator output
  id              TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  clause_id       TEXT NOT NULL,      -- FK conceptually into knowledge.db (cross-db, resolved in app layer)
  question        TEXT NOT NULL,
  risk_level       TEXT NOT NULL,     -- 'low'|'medium'|'high'
  process         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending|answered|na
  response        TEXT,
  evidence_notes  TEXT
);

CREATE TABLE evidence_plan_items (          -- Evidence Planner
  id              TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  clause_id       TEXT NOT NULL,
  category        TEXT NOT NULL,      -- procedure|record|monitoring_data|competence
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'requested', -- requested|obtained|not_available|not_applicable
  location_owner  TEXT,
  notes           TEXT
);

CREATE TABLE gap_assessments (               -- Gap Assessment Tool
  id              TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  clause_id       TEXT NOT NULL,
  rating          TEXT NOT NULL,      -- 'conforms'|'ofi'|'minor_nc'|'major_nc'|'not_assessed'
  narrative       TEXT,
  recommended_action TEXT,
  risk_rating     TEXT,               -- 'low'|'medium'|'high'
  assessed_by     TEXT,
  assessed_at     TEXT
);

CREATE TABLE readiness_snapshots (           -- Readiness Assessment (point-in-time roll-up, recomputable)
  id              TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  taken_at        TEXT NOT NULL,
  overall_pct     REAL NOT NULL,
  by_clause       TEXT NOT NULL,       -- JSON: [{clauseId, score}]
  high_risk_gaps  TEXT NOT NULL,       -- JSON array of clause_id + reason
  recommended_actions TEXT NOT NULL    -- JSON array
);

CREATE TABLE reports (                        -- generated report artefacts metadata
  id              TEXT PRIMARY KEY,
  audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  report_type     TEXT NOT NULL,        -- 'audit_plan'|'schedule'|'prep_pack'|'gap_report'
  format          TEXT NOT NULL,        -- 'xlsx'|'pdf'
  file_path       TEXT NOT NULL,
  generated_at    TEXT NOT NULL
);

CREATE TABLE app_settings (
  key             TEXT PRIMARY KEY,
  value           TEXT NOT NULL         -- JSON scalar; e.g. theme, autosave interval, AI provider config
);
```

### Notes on design decisions

- **Cross-database FK (`checklist_items.clause_id` etc. → `knowledge.db`)**:
  SQLite cannot enforce a FK across two separate database files, so these are
  soft references resolved in the repository layer at read time (the
  knowledge DB is attached read-only via `ATTACH DATABASE`). This keeps the
  large, versioned standards library separate from the small, frequently
  saved project files — important because the project file is what a user
  emails/saves to SharePoint, and it should not carry the whole standards
  library each time an audit is saved.
- **`gap_assessments.rating`** enum matches the four states requested exactly
  (Conforms / OFI / Minor NC / Major NC) plus `not_assessed` as the default so
  readiness scoring can distinguish "assessed as conforming" from "not yet
  looked at".
- **`readiness_snapshots`** stores a computed roll-up rather than only
  computing on the fly, so historical readiness trend (e.g. week-over-week
  improvement before a certification audit) can be charted on the Dashboard.
- All "previous audits" are simply audit_projects with `status = 'closed'`;
  no separate archive table is needed, keeping "save previous audits" trivial
  (Phase 4 requirement) — the app's "Open Audit" dialog lists `.iaap` files.
