# Audit Planner → Audit Intelligence Platform
## Gap Assessment, Architecture Proposal & Delivery Strategy

*Prepared 2026-08-03, acting as: Principal Software Architect / ISO 14001
Lead Auditor / ISO 45001 Lead Auditor / Enterprise SHE Systems Consultant /
Product Manager, per the brief. This document covers deliverables 1–9 of
the brief's requested list (Gap Assessment, Updated Architecture, Schema
v2, Migration Strategy, Technical Roadmap, UX Roadmap, Risk Register,
Implementation Plan, Prioritised Backlog). Deliverable 10 (Source Code)
begins after the one open decision in §0 is made — see "What happens
next."*

---

## 0. The one decision that has to be made before Phase 1 code is written

The brief's own diagnosis — evolve from `Clause → Evidence → Questions` to
`Business → Process → Risk → Controls → Evidence → Clauses`, with
corporate/region/site hierarchy, cross-site benchmarking, and a shared
legal compliance register — describes an **organisation-wide, multi-user
system**. That is a different architecture, not a bigger version of the
current one, and it directly reopens a decision this project already made
explicitly and recently:

> This app was deliberately built with **no server, no backend, and no
> multi-user access**, storing each workspace only in one browser's local
> storage or a `.iaap` file — a decision driven by the fact that IT
> approval was not obtainable for anything more (see the deployment
> history that led to it being a static GitHub Pages site today).

Several of the brief's capabilities are only real if data is centrally
shared:

- **Cross-site benchmarking / "strongest vs. weakest performing sites"**
  requires seeing every site's data in one place, not one browser's
  IndexedDB per site.
- **A shared legal compliance register** with a "Responsible Person" per
  obligation implies multiple named people using the same data.
- **Corporate audit programmes across regions** implies a corporate-level
  user who isn't the same person running the site-level workspace.
- **Recurring-finding / closure-performance analysis "across sites"**
  needs findings from every site to be queryable together.

Building these as *client-side-only, per-browser* features would be
building a convincing-looking simulation of enterprise capability on top
of storage that architecturally cannot deliver it — that is precisely the
"superficial improvement" the brief says not to do.

**Recommendation (and what this document assumes going forward):** build
the full `Organisation → Process → Risk → Control → Legal → Findings →
Maturity` data model now, at **single-workspace scope** (one organisation,
one or many sites, one user at a time — exactly like today, just with a
vastly richer schema). This alone is a large, genuine leap in value and
requires no infrastructure decision. Ship it in the milestones below.
**Explicitly flag corporate cross-site roll-up, shared legal registers
with multiple named owners, and true multi-user concurrent access as a
later phase gated on deciding to introduce a real backend** — a decision
this document surfaces but does not make unilaterally, since it reverses
a considered constraint from earlier in this project. §8 (Risk Register)
and §5 (Roadmap) carry this forward as a tracked, explicit item rather
than quietly building around it.

If that recommendation is wrong for your actual situation (e.g. IT
posture has changed, or a backend is now acceptable), say so and the
milestones below get re-sequenced to build the shared backend first —
that's a materially different (and larger) plan, not a tweak to this one.

---

## 1. Current State Assessment (verified against the actual codebase, not the earlier project report)

| Area | What's actually there today |
|---|---|
| Data model | `standards` → `clauses` (105 total: 49 ISO 14001, 56 ISO 45001) with evidence/questions/tests/findings/related-clauses/risk-prompts per clause, plus a `clause_equivalence` cross-standard mapping. One flat `audit_projects` table per workspace with `sites`/`departments` as **unnormalised JSON arrays** on the project row itself — no independent Site/Department entities, no Organisation/Region/Function/Process/Activity concept at all. |
| Scoring | `engine/scoring.ts::computeReadiness()` — averages the latest `gap_assessments.rating` per clause (Conforms=100/OFI=80/Minor NC=40/Major NC=0) into one overall %. That's the entire model: no incident history, no compliance results, no KPI/training/management-review inputs, no process/department/site rollups. |
| "AI" recommender | `engine/recommender.ts` — six deterministic functions (rank questions, suggest trails, identify weak areas, build interview plan, missing evidence, agenda) driven by gap-assessment ratings + static `riskWeight` on clause records + evidence-plan status. No knowledge-graph traversal beyond `relatedClauses`/`crossStandardEquivalents` chip links; no pattern/recurrence detection; reasoning is a flat list of strings per item, not a structured, queryable rationale object. |
| Findings/CAPA | `gap_assessments` table only — one row per clause per audit with a rating + narrative + recommended action. **No** finding categories beyond the four ratings, no owner, no due date, no verification step, no closure workflow, no root-cause fields. |
| Legal compliance | Does not exist. No legislation, obligation, or compliance-evaluation entity anywhere in the schema. |
| Risk-based planning | Does not exist as a first-class concept. `risk_prompts.risk_weight` (1–5, static, authored once per clause in the seed data) is the only risk signal, consumed only by the recommender's priority score — no Risk entity, no heat map, no coverage-adjustment logic. |
| Sampling | Does not exist. No sample-size guidance, no methodology selection anywhere. |
| Multi-site / corporate | Does not exist beyond the free-text `sites`/`departments` JSON on one audit project. No Organisation, Region, Business Unit hierarchy; no cross-project or cross-workspace query is possible (each `.iaap` file is an island). |
| Maturity model | Does not exist. |
| AI provider architecture | No provider interface at all — `recommender.ts` is called directly by UI code with no seam for swapping in an LLM later. |
| Storage/runtime | SQLite via `sql.js` (WASM), running **inside the browser tab** (or Electron main process in the unused desktop build), persisted to `IndexedDB` (browser autosave) or a downloaded `.iaap` file. No server, no database server, no multi-user access, no query engine beyond what SQLite gives you against one file. |
| Testing | 33 tests across 7 files (knowledge-base shape, scoring, scheduler, recommender, crypto round-trip, real file I/O, export generation). No coverage tooling configured, no accessibility tests, no performance tests, no load tests. |
| Security | AES-256-GCM encryption-at-rest, opt-in, verified by tests — genuinely solid for what it protects (a stolen file/disk), but it is not access control and there is no login, ever, for anyone. |

**Bottom line:** the brief's characterisation is accurate and, if anything,
understates it slightly — this isn't "clause-driven and needs to add
process-awareness," it's a single-user clause-lookup-and-checklist tool
with zero concept of organisational structure, legal obligations, risk as
a first-class entity, or a real findings lifecycle. That's not a criticism
of the MVP (it did what a solo SHE Coordinator without IT support needed),
but it means every one of the 12 phases below is genuinely new
construction, not refactoring.

---

## 2. Gap Assessment (deliverable 1)

Ranked by how much of the brief's target state depends on it existing
first (i.e. blocking gaps first):

| # | Gap | Severity | Why it blocks other phases |
|---|---|---|---|
| G1 | No Organisation/Site/Department/Process/Activity entity model — everything hangs off free-text JSON on one audit project | **Critical** | Phases 2, 3, 5, 6, 8 all reference Process/Site/Department as real, queryable entities. Nothing else can be built cleanly until this exists. |
| G2 | No Risk or Control entity — risk is a static per-clause weight, not a modelled thing with likelihood/severity/ownership | **Critical** | Blocks risk-based planning (Ph.5), heat maps, and half of what "process → risk → controls → clauses" means. |
| G3 | No real Findings/CAPA lifecycle — `gap_assessments` conflates "assessment rating" and "finding" with no owner/due-date/verification/closure | **High** | Blocks closure-performance metrics (needed by Ph.4's scoring model and Ph.3's dashboards). |
| G4 | No legal/compliance entity at all | **High** | A SHE platform without a compliance obligation register is missing one of the two or three things a real EHS audit actually verifies first. |
| G5 | Scoring model has three inputs (gap rating only, really) vs. the nine the brief specifies | **High** | Directly requested (Ph.4); also the thing most visible to management as "is this trustworthy." |
| G6 | AI layer has no explainability data structure — reasons are ad-hoc strings, not first-class "driver" objects attached to a score | **Medium** | Ph.6 requires every recommendation and every score to carry rationale; retrofitting this after scoring/findings exist is more expensive than designing it in from the start. |
| G7 | No sampling methodology support | **Medium** | Self-contained; low risk to add once findings/evidence entities are richer. |
| G8 | No multi-site/corporate roll-up capability, and no realistic path to one without a backend (see §0) | **Critical, but deliberately deferred** | This is the one gap that isn't "build it," it's "decide whether to build the infrastructure this needs." |
| G9 | No maturity model | **Medium** | Additive; can layer on top of everything else last. |
| G10 | No LLM provider seam | **Low effort, currently zero** | Cheap to fix early — an interface costs almost nothing and de-risks Ph.10 entirely; recommend doing this *before* it's asked for by anything else, while the recommender is being touched anyway. |
| G11 | Testing/coverage/accessibility/performance discipline is currently "adequate for an MVP," not "80%+ coverage, enterprise-reviewed" | **Medium, ongoing** | Needs to be a standing constraint applied to every milestone below, not a Phase 12 clean-up pass at the end — retrofitting tests onto three-times-the-schema at the end never actually happens in practice. |

---

## 3. Updated Architecture Proposal (deliverable 2)

### 3.1 Data model — the new spine

```
Organisation
  └─ Region (optional grouping; a single-region org can skip this layer)
       └─ Site
            └─ Department
                 └─ Function            (a role/discipline grouping, e.g. "Maintenance")
                      └─ Process             (e.g. "Permit to Work", "Waste Management")
                           └─ Activity        (a concrete task within the process)
                                ├─ Risk[]          (likelihood × severity, linked to hazards/aspects)
                                │    └─ Control[]        (the mitigation; may be shared across risks)
                                │         └─ clause_link[]    (which ISO clauses this control evidences)
                                └─ clause_link[]          (process can also link clauses directly)

Legislation
  └─ ComplianceObligation
       ├─ Requirement[]
       ├─ ComplianceEvaluation[]  (point-in-time judgement: compliant/non-compliant/partial, by whom, when, next review)
       ├─ clause_link[]           (crosswalk, same pattern as clause_equivalence)
       └─ ResponsiblePerson

AuditProject  (unchanged concept, now referencing the above instead of JSON blobs)
  └─ AuditFinding
       ├─ RootCauseAnalysis (method: 5-Why | Fishbone | TapRooT-style; structured fields)
       └─ CorrectiveAction[]
            ├─ owner, dueDate, status, verification, closedAt

MaturityAssessment
  └─ MaturityDimensionScore[]   (7 dimensions × 5 levels)

SamplingPlan   (per audit, per artefact type: method, population, sample size, rationale, selected items)
```

This is a genuine hierarchy walk, not a relabelling: a `Process` is what
gets audited; it has `Risk`s; each `Risk` is mitigated by `Control`s; each
`Control` is what a `Clause` requirement actually exists to verify. The
existing clause knowledge base becomes a **leaf reference** hanging off
Process/Risk/Control, rather than the root of the tree. That inversion is
the actual architectural change the brief is asking for — everything else
in the 12 phases is a consequence of it.

### 3.2 Module architecture (extends, doesn't replace, the current one)

```
src/shared/
  engine/
    scoring.ts          → becomes scoringV2.ts (multi-input, multi-level, explainable — §3.4)
    recommender.ts       → extended with graph traversal over Process/Risk/Control, not just clauses
    scheduler.ts          (unchanged concept, now schedules by Process too, not only clause)
    trailBuilder.ts        (unchanged)
    sampling.ts          [NEW] judgment/risk-based/random/stratified calculators + rationale text
    maturity.ts           [NEW] dimension scoring + improvement-roadmap generation
    riskHeatmap.ts        [NEW] likelihood×severity grid + coverage-adjustment logic
    ai/
      provider.ts          [NEW] AiProvider interface — see §3.5
      nullProvider.ts       [NEW] current deterministic behaviour, always available, default
      ollamaProvider.ts   [NEW, optional] talks to a local Ollama HTTP endpoint only
  knowledge-base/         (unchanged — still the seeded ISO clause library)
  process-library/       [NEW] optional starter set of common SHE processes or organisations to
                          adopt/customise (see Migration Strategy §4) — same "seeded reference
                          data" pattern as the clause knowledge base
  types.ts                (extended with the new entities)
```

Every new engine module follows the existing house style: pure TypeScript,
no DOM/Electron dependency, unit-testable in isolation, and — this is the
one *new* rule imposed by Ph.6's explainability requirement — **every
function that produces a score or a recommendation returns a `reasons`/
`drivers` structure alongside the number**, not just a number. This is
already the convention in `recommender.ts` (`reasons: string[]`); it
becomes a hard requirement everywhere, including scoring, risk heat maps,
and maturity levels, and gets upgraded from loose strings to a typed
`Driver { label: string; weight: number; sourceType: string; sourceId: string }[]`
so the UI can render "why is this score X" consistently and so it's
testable (assert on driver contents, not string-matching prose).

### 3.3 AI Assistant → Audit Intelligence Engine

Renamed per the brief. Concretely:
- User-facing label and panel heading change (`🤖 AI Assistant` →
  `🤖 Audit Intelligence Engine`) — cosmetic, zero risk, done as part of
  this delivery (see §7, this is the one code change landing today).
- The deterministic core is **retained as the default and only always-on
  path** — nothing about its behaviour changes from this renaming.
- Its reasoning surface expands from "clauses + gap ratings + evidence
  status" to traversing the full Process→Risk→Control→Clause graph plus
  Findings history, enabling real recurrence detection ("this control has
  failed in 3 of the last 4 audits") which the current clause-only graph
  cannot express.

### 3.4 Scoring v2 — explainable, multi-level

Replaces the single `computeReadiness()` average with a layered
computation:

```
ClauseScore    = weighted(gapRating, complianceEvaluations, incidentHistory,
                           findingRecurrence, actionClosurePerformance)
ProcessScore   = aggregate(ClauseScores for clauses linked to this Process,
                           weighted by Risk severity of the Process's Risks)
DepartmentScore = aggregate(ProcessScores for Processes in this Department)
SiteScore       = aggregate(DepartmentScores)
OverallScore    = aggregate(SiteScores)  [meaningful once G8/multi-site exists;
                                          single-site today it's just SiteScore]
```

Every level stores its `drivers[]` (§3.2) so "why is Department X's score
62%" is answerable by drilling into the three or four processes actually
dragging it down — this is the "show drivers of low scores" / "provide
transparency for every score" requirement from Ph.4, and it's the reason
the driver structure has to be designed now rather than bolted on.

### 3.5 Local LLM integration architecture (Ph.10 — build the seam now, not the integration)

```ts
export interface AiProvider {
  readonly id: string                    // 'none' | 'ollama' | future providers
  readonly available: boolean            // false if e.g. Ollama isn't reachable
  generate(context: RecommenderContext, task: AiTask): Promise<AiSuggestion[]>
}
```

- **`NullProvider`** — wraps the existing deterministic `recommender.ts`
  functions unchanged. This is the default and the only provider that
  ships enabled; the app is fully functional with it and nothing else.
- **`OllamaProvider`** (optional, off by default) — calls a
  **user-configured local endpoint only** (`http://localhost:11434` by
  default, editable), never a cloud API; if unreachable, `available` is
  `false` and the UI silently falls back to `NullProvider`. Configuration
  lives in the existing `app_settings` key/value table (`ai.provider`,
  `ai.ollama.baseUrl`, `ai.ollama.model`) — no schema change needed.
- Worth flagging honestly (carried into the Risk Register, §8): even a
  "local-only" LLM call is a new local-network dependency the app didn't
  have before. On a locked-down corporate laptop, an app reaching out to
  `localhost:11434` may itself need the same kind of IT sign-off that
  ruled out the desktop installer earlier in this project — this doesn't
  block building the architecture, but it means "entirely optional" has
  to be real, not aspirational: the app must be indistinguishable in
  behaviour with the provider absent.

---

## 4. Database Schema v2 (deliverable 3) — additive, not a rewrite

Extends `docs/DATABASE_SCHEMA.md` §2 (the per-workspace `.iaap` file).
Existing tables (`audit_projects`, `programme_slots`, `checklist_items`,
`evidence_plan_items`, `gap_assessments`, `readiness_snapshots`, `reports`,
`app_settings`) are kept; `gap_assessments` is joined by, not replaced by,
`audit_findings` (a gap assessment is the audit-time judgement; a finding
is what gets tracked to closure — an OFI/NC can exist without every
gap-assessment row becoming one, e.g. "conforms" ratings never produce a
finding).

```sql
-- 4.1 Organisational hierarchy
CREATE TABLE organisations (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE regions (id TEXT PRIMARY KEY, organisation_id TEXT NOT NULL REFERENCES organisations(id), name TEXT NOT NULL);
CREATE TABLE sites_v2 (
  id TEXT PRIMARY KEY, region_id TEXT REFERENCES regions(id), organisation_id TEXT NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL, address TEXT
);
CREATE TABLE departments_v2 (id TEXT PRIMARY KEY, site_id TEXT NOT NULL REFERENCES sites_v2(id), name TEXT NOT NULL);
CREATE TABLE functions (id TEXT PRIMARY KEY, department_id TEXT NOT NULL REFERENCES departments_v2(id), name TEXT NOT NULL);
CREATE TABLE processes (
  id TEXT PRIMARY KEY, function_id TEXT NOT NULL REFERENCES functions(id),
  name TEXT NOT NULL, description TEXT,
  inputs TEXT, activities TEXT, outputs TEXT, kpis TEXT   -- JSON arrays, same "array as JSON column" convention as elsewhere
);
CREATE TABLE activities (id TEXT PRIMARY KEY, process_id TEXT NOT NULL REFERENCES processes(id), name TEXT NOT NULL, description TEXT);
CREATE INDEX idx_regions_org ON regions(organisation_id);
CREATE INDEX idx_sites_v2_region ON sites_v2(region_id);
CREATE INDEX idx_departments_v2_site ON departments_v2(site_id);
CREATE INDEX idx_functions_dept ON functions(department_id);
CREATE INDEX idx_processes_function ON processes(function_id);
CREATE INDEX idx_activities_process ON activities(process_id);

-- 4.2 Risk & control
CREATE TABLE risks (
  id TEXT PRIMARY KEY, process_id TEXT NOT NULL REFERENCES processes(id),
  category TEXT NOT NULL,        -- 'environmental_aspect'|'ohs_hazard'|'compliance'|'business'
  description TEXT NOT NULL, likelihood INTEGER NOT NULL, severity INTEGER NOT NULL   -- 1-5 each
);
CREATE TABLE controls (id TEXT PRIMARY KEY, risk_id TEXT NOT NULL REFERENCES risks(id), description TEXT NOT NULL, control_type TEXT);
CREATE TABLE control_clause_link (id TEXT PRIMARY KEY, control_id TEXT NOT NULL REFERENCES controls(id), clause_id TEXT NOT NULL);
CREATE TABLE process_clause_link (id TEXT PRIMARY KEY, process_id TEXT NOT NULL REFERENCES processes(id), clause_id TEXT NOT NULL);
CREATE INDEX idx_risks_process ON risks(process_id);
CREATE INDEX idx_controls_risk ON controls(risk_id);

-- 4.3 Legal & compliance
CREATE TABLE legislation (id TEXT PRIMARY KEY, title TEXT NOT NULL, jurisdiction TEXT, category TEXT);  -- 'environmental'|'ohs'|'permit'|'corporate'
CREATE TABLE compliance_obligations (
  id TEXT PRIMARY KEY, legislation_id TEXT NOT NULL REFERENCES legislation(id),
  description TEXT NOT NULL, responsible_person TEXT, review_frequency_months INTEGER, next_review_at TEXT
);
CREATE TABLE compliance_requirements (id TEXT PRIMARY KEY, obligation_id TEXT NOT NULL REFERENCES compliance_obligations(id), description TEXT NOT NULL);
CREATE TABLE compliance_evaluations (
  id TEXT PRIMARY KEY, obligation_id TEXT NOT NULL REFERENCES compliance_obligations(id),
  status TEXT NOT NULL,        -- 'compliant'|'non_compliant'|'partial'|'not_evaluated'
  evaluated_by TEXT, evaluated_at TEXT, evidence_notes TEXT
);
CREATE TABLE clause_legal_link (id TEXT PRIMARY KEY, clause_id TEXT NOT NULL, obligation_id TEXT NOT NULL REFERENCES compliance_obligations(id));
CREATE INDEX idx_obligations_legislation ON compliance_obligations(legislation_id);
CREATE INDEX idx_evaluations_obligation ON compliance_evaluations(obligation_id);

-- 4.4 Findings & corrective action
CREATE TABLE audit_findings (
  id TEXT PRIMARY KEY, audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  clause_id TEXT, process_id TEXT REFERENCES processes(id),
  category TEXT NOT NULL,      -- 'observation'|'ofi'|'minor_nc'|'major_nc'
  description TEXT NOT NULL, raised_by TEXT, raised_at TEXT NOT NULL
);
CREATE TABLE root_cause_analyses (
  id TEXT PRIMARY KEY, finding_id TEXT NOT NULL REFERENCES audit_findings(id),
  method TEXT NOT NULL,        -- '5_why'|'fishbone'|'taproot'
  structured_data TEXT NOT NULL   -- JSON: method-specific fields
);
CREATE TABLE corrective_actions (
  id TEXT PRIMARY KEY, finding_id TEXT NOT NULL REFERENCES audit_findings(id),
  description TEXT NOT NULL, owner TEXT NOT NULL, due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',   -- 'open'|'in_progress'|'verification_pending'|'closed'|'overdue'
  verification_notes TEXT, closed_at TEXT
);
CREATE INDEX idx_findings_project ON audit_findings(audit_project_id);
CREATE INDEX idx_findings_process ON audit_findings(process_id);
CREATE INDEX idx_actions_finding ON corrective_actions(finding_id);

-- 4.5 Maturity
CREATE TABLE maturity_assessments (id TEXT PRIMARY KEY, audit_project_id TEXT NOT NULL REFERENCES audit_projects(id), taken_at TEXT NOT NULL);
CREATE TABLE maturity_dimension_scores (
  id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES maturity_assessments(id),
  dimension TEXT NOT NULL,     -- 'leadership'|'planning'|'risk_management'|'competence'|'operational_control'|'performance_evaluation'|'improvement'
  level INTEGER NOT NULL,      -- 1-5
  narrative TEXT
);

-- 4.6 Sampling
CREATE TABLE sampling_plans (
  id TEXT PRIMARY KEY, audit_project_id TEXT NOT NULL REFERENCES audit_projects(id),
  artefact_type TEXT NOT NULL,  -- 'training_records'|'inspections'|'permits'|'contractors'|'incidents'|'competence_records'
  method TEXT NOT NULL,         -- 'judgment'|'risk_based'|'random'|'stratified'
  population_size INTEGER NOT NULL, sample_size INTEGER NOT NULL,
  rationale TEXT NOT NULL, selected_items TEXT   -- JSON array
);

-- 4.7 Scoring v2 extension (additive columns, not a new table, so historical readiness_snapshots keep working)
ALTER TABLE readiness_snapshots ADD COLUMN by_process TEXT;      -- JSON [{processId, score, drivers[]}]
ALTER TABLE readiness_snapshots ADD COLUMN by_department TEXT;   -- JSON
ALTER TABLE readiness_snapshots ADD COLUMN by_site TEXT;         -- JSON
ALTER TABLE readiness_snapshots ADD COLUMN drivers TEXT;         -- JSON, overall-score driver breakdown
```

`clause_legal_link` and `control_clause_link`/`process_clause_link` all
follow the exact pattern `clause_equivalence` already established for
cross-referencing — reusing a convention the codebase already has, rather
than inventing a new one.

---

## 5. Migration Strategy (deliverable 4)

1. **Schema version marker.** Add `schema_version` to `app_settings`
   (absent/`1` = current shape, `2` = this proposal). Checked on
   workspace open, same seam already used for `NeedsPassphraseError` —
   i.e. opening a workspace can require a step (decrypt, or now migrate)
   before it's usable, and the UI already has a pattern for that.
2. **Sites/Departments → normalised tables.** On first open of a
   `schema_version: 1` file: read `audit_projects.sites`/`.departments`
   JSON, insert into `sites_v2`/`departments_v2` preserving original
   `id`s (so any code still holding those ids keeps working), and create
   one default `organisations` row + one default `regions` row to hang
   them under (user renames later; nothing is lost or reshuffled). The
   legacy JSON columns are **kept, not dropped**, for one release cycle —
   read-only fallback if the migration needs to be inspected or re-run.
3. **Everything else starts empty**, by necessity — there's no existing
   data to map Process/Risk/Control/Legislation/Findings from. To avoid
   shipping an empty, intimidating Process Explorer on first migration,
   seed an **optional starter process library** (~15–20 common SHE
   processes — Permit to Work, Waste Management, Incident Management,
   Contractor Management, etc. — each with plausible starter
   Risks/Controls/clause-links) the user can adopt-and-customise per
   site, using the exact same "seeded reference data the user edits
   rather than starts from nothing" principle already stated as design
   principle #1 in `docs/UI_DESIGN.md`.
4. **Migration is forward-only and non-destructive** — never deletes
   data, only adds. A migration dry-run mode (write to a copy, diff
   row counts) is a cheap, high-value test to write before this ships,
   given how much this project already leans on "verified against real
   file I/O" tests (`tests/mainWorkspace.test.ts` is the existing
   template for this).

---

## 6. Technical Roadmap (deliverable 5) — sequenced by actual dependency, not the brief's original numbering

The brief's 12 phases have real dependencies between them that determine
build order regardless of stated priority — e.g. Ph.4's scoring model
literally needs Ph.2's compliance evaluations and Ph.3's closure
performance as inputs, so scoring cannot be built before them no matter
how it's numbered. Milestones below are each independently shippable and
testable (nothing half-finished lands).

| Milestone | Brief phase(s) | Depends on | Ships |
|---|---|---|---|
| **M0** | Ph.6 (partial) | none | AI provider seam (`AiProvider` interface + `NullProvider`) + the AI Assistant → Audit Intelligence Engine rename. Trivial, zero-risk, unblocks nothing else but costs nothing to do first. |
| **M1** | Ph.1 | M0 (optional) | Organisation/Region/Site/Department/Function/Process/Activity entities, schema migration (§5), Process Explorer screen, process maps (inputs/activities/outputs/risks/controls/KPIs/clauses), process-based audit planning + scheduling. |
| **M2** | Ph.2 | M1 (for clause-link crosswalk pattern reuse; otherwise independent) | Legal Compliance module: register, evaluations, clause↔obligation crosswalk, overdue-review surfacing, compliance-focused audit programmes. |
| **M3** | Ph.3 | M1 (findings link to Process) | Findings & CAPA lifecycle: categories, root cause (5-Why/Fishbone/TapRooT fields), corrective actions with owner/due-date/verification/closure, open-findings/overdue/recurring/closure-effectiveness dashboards. |
| **M4** | Ph.5 | M1 (Risk/Control entities) | Risk-based audit planning: risk register, heat maps, coverage-adjustment logic (more audit depth where risk/findings/compliance-failures/incidents concentrate). |
| **M5** | Ph.4 | M2 + M3 + M4 (needs their data as scoring inputs) | Scoring v2: multi-input, multi-level (clause/process/department/site), explainable drivers everywhere. |
| **M6** | Ph.6 (full) + Ph.7 | M1–M5 (needs the fuller graph and finding history to reason over) | Audit Intelligence Engine: graph traversal across the new entities, recurrence/pattern detection, explainable recommendations; Sampling Engine (judgment/risk-based/random/stratified, guidance + rationale per artefact type). |
| **M7** | Ph.8 (single-workspace parts) + Ph.9 | M1, M5 | Maturity model (5 levels × 7 dimensions, spider chart, improvement roadmap) and *single-workspace* multi-site views (a workspace can already hold many sites once M1 lands — this milestone is the comparison UI within one workspace, not cross-workspace/cross-user roll-up, which is gated on §0). |
| **M8 (gated)** | Ph.8 (corporate/cross-workspace parts) | §0 decision | Real cross-site/cross-workspace roll-up, shared legal register with multiple named owners, true multi-user access. Only sequenced once a backend is approved — see §0. |
| **Ongoing, every milestone** | Ph.10, Ph.11, Ph.12 | — | LLM provider architecture is M0 (cheap, do it once). UX improvements (search scope, saved views, filtering, comparison views, dashboard widgets) are applied *within* each milestone's screens as they're built, not as a separate late-stage redesign. Tests are written alongside each milestone's engine/schema code, not deferred — coverage tooling (`vitest --coverage`) gets turned on at M1 so the 80% target is tracked from the start, not measured for the first time at the end. |

---

## 7. UX Roadmap (deliverable 6)

Folded into the milestones above rather than a standalone late phase,
because a Process Explorer, a Legal Compliance register, and a
Findings/CAPA board are different-enough information shapes that
designing their UX in isolation from the data model risks the current
project's "guided, not blank-page" principle (`docs/UI_DESIGN.md`
principle #1) — each new screen should ship following the same
conventions already established (status colour language, clause chips
opening the Clause Explorer slide-over, keyboard shortcuts, dark mode)
rather than as a bolt-on skin.

Cross-cutting additions, each attached to the milestone that first needs
it rather than done as one big UI sprint:
- **Global search** extended to Process/Risk/Control/Legislation/Findings
  at M1–M3 (it already indexes clauses + audit names; same mechanism,
  more entity types).
- **Saved views & advanced filtering** at M3 (findings dashboards are
  where "show me overdue Major NCs owned by X" first becomes necessary).
- **Clause comparison view** (side-by-side two clauses, e.g. cross-
  standard equivalents) at M1, since Process Explorer's clause-links make
  this immediately useful.
- **Dashboard widgets / customisable homepage** at M5–M7, once there's
  enough scored, multi-level data to make a customisable dashboard
  meaningful rather than decorative.
- **Dark mode, keyboard shortcuts** already exist — extend the existing
  design tokens/shortcut map to new screens rather than reinventing them.

---

## 8. Risk Register (deliverable 7)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | The backend/multi-user decision (§0) is made implicitly by drifting into building corporate features on client-only storage | Medium | High — wasted work, false sense of "enterprise-ready" | This document forces the decision to be explicit before M8; M1–M7 are deliberately scoped to not require it. |
| R2 | Schema migration (§5) corrupts or loses existing `.iaap` workspace data | Low | High (data loss is irreversible for a user with no backend backup) | Non-destructive, additive-only migration; keep legacy JSON columns one release cycle; write migration tests against real exported files before M1 ships, following the existing `tests/mainWorkspace.test.ts` pattern. |
| R3 | 12 phases of scope, built by effectively one contributor across sessions, stalls or partially completes | High | Medium | Milestones (§6) are each independently shippable and valuable alone — M1 alone is already a major upgrade even if nothing after it ships. |
| R4 | Explainability (driver structures, §3.2) gets treated as a UI afterthought rather than a data-model requirement | Medium | Medium — expensive to retrofit | Driver typing is specified now (§3.2) as a hard requirement for every new engine function, enforced by tests asserting driver contents, not just final scores. |
| R5 | Encryption-at-rest (already built, verified) doesn't automatically cover new sensitive tables (legal register, findings, root cause narratives) | Low (same encryption wraps the whole file) | Medium if assumed without re-verification | Whole-file encryption already covers new tables for free (it encrypts the exported SQLite bytes, not per-table) — re-run `tests/mainWorkspace.test.ts`-style round-trip tests once schema v2 lands to confirm this holds, rather than assuming it. |
| R6 | Local LLM provider (§3.5) becomes a new IT/security question on the exact kind of locked-down laptop that already ruled out a desktop installer | Medium | Medium | Off by default; the app must be fully functional and behaviourally identical with it absent — treat this as a hard acceptance criterion for M0, not an aspiration. |
| R7 | Data volume (findings/compliance history/maturity assessments accumulated over years) outgrows what `sql.js`-in-a-browser-tab + IndexedDB can comfortably hold/parse on load | Medium (grows over time) | Medium | Not a near-term concern at single-site scale; flag as the first concrete symptom that would justify the §0 backend decision, and consider a lightweight archiving/pagination strategy for closed audit projects before it becomes urgent. |
| R8 | 80%+ coverage target is aspirational without the tooling and habit in place from day one | Medium | Low–Medium (quality debt, not data risk) | Turn on `vitest --coverage` at M1, track the number every milestone, don't wait for a Ph.12-style cleanup pass. |

---

## 9. Implementation Plan & Prioritised Backlog (deliverables 8 & 9)

Prioritised by **business value × audit effectiveness × user-effort
reduction × certification-readiness impact**, per the brief's own stated
criteria — not just dependency order (§6 already covers sequencing; this
orders *within* what's buildable next).

| Priority | Item | Milestone | Value driver |
|---|---|---|---|
| 1 | AI provider seam + rename | M0 | Effort reduction (unblocks future LLM work cheaply); zero risk |
| 2 | Organisation/Site/Department/Process/Activity entities + migration | M1 | Foundational — everything else's value depends on this existing |
| 3 | Process Explorer + process maps | M1 | Audit effectiveness — this is the headline "process-driven, not clause-driven" deliverable |
| 4 | Process-based audit scheduling | M1 | User-effort reduction — auditors plan how they actually think |
| 5 | Legal Compliance register + evaluations | M2 | Audit effectiveness + certification-readiness — compliance obligations are core to both standards' clause 6.1.3/9.1.2 |
| 6 | Findings/CAPA lifecycle + dashboards | M3 | Certification-readiness — auditors are assessed on closure discipline, not just finding things |
| 7 | Risk register + heat maps + coverage adjustment | M4 | Audit effectiveness — risk-based audit depth is what "Lead Auditor" credibility actually rests on |
| 8 | Scoring v2 (multi-input, multi-level, explainable) | M5 | Business value — this is what management actually reads on a dashboard |
| 9 | Audit Intelligence Engine (graph traversal, recurrence detection) + Sampling Engine | M6 | Audit effectiveness + user-effort reduction |
| 10 | Maturity model + single-workspace multi-site views | M7 | Business value — maturity trending is a strong management-reporting artefact |
| 11 (gated) | Cross-workspace/corporate roll-up, shared legal register, multi-user | M8 | Blocked on §0 |

---

## What happens next

Steps 1–5 of the brief are delivered above (this document). Per the
brief's own instruction ("6. Then implement the improvements
iteratively"), implementation is underway — "iteratively" for a 12-phase
enterprise redesign means real milestones across multiple sessions, not
one commit.

**Status as of this update: M0 and M1 are both landed** (single-workspace
scope, per the confirmed answer to §0's question):

- **M0** — `AiProvider` interface + `NullProvider` wrapping the existing
  deterministic recommender unchanged (`src/shared/engine/ai/`); "AI
  Assistant" renamed to "Audit Intelligence Engine" throughout the UI.
- **M1** — the process-centric data model is real and working end-to-end:
  `Organisation → Region → OrgSite → OrgDepartment → OrgFunction → Process
  → Activity`, plus `Risk`/`Control` hanging off each Process, each with
  direct clause links (`src/shared/types.ts`, new tables in
  `workspaceSchema.ts`). A **Process Explorer** screen
  (`src/renderer/src/features/process-explorer/`) lets a user build this
  hierarchy, add risks/controls, link ISO clauses, or **adopt one of 10
  seeded starter processes** (`src/shared/process-library/`) covering
  Permit to Work, Waste Management, Incident Management, Contractor
  Management, Emergency Preparedness, Training & Competence, Management
  Review, Legal & Compliance Obligations, Management of Change, and
  Monitoring/Measurement — each with real risks, controls, and clause
  links verified to resolve against the actual knowledge base
  (`tests/processLibrary.test.ts`). The **Programme Builder now supports
  planning by process**: selecting processes in scope widens the audit's
  clause set via `collectProcessClauseIds()` (`src/shared/engine/
  processClauses.ts`, unit-tested), verified end-to-end in a live browser
  session (process → audit → programme, correct clause count, zero
  console errors). A **non-destructive migration**
  (`src/shared/migrations.ts`) backfills any pre-existing `.iaap` file's
  ad hoc embedded sites/departments into the new normalised tables on
  first open, verified against real file I/O
  (`tests/migration.test.ts`) — legacy data is never rewritten, only
  supplemented.
- All 45 automated tests pass, both build targets (web + desktop)
  compile cleanly.

**M2 (Legal & Compliance, Phase 2 of the brief) is also landed:**

- `Legislation → ComplianceObligation → ComplianceEvaluation` entities
  (`src/shared/types.ts`), same additive-schema convention as M1.
- A **Legal & Compliance** screen (`src/renderer/src/features/
  legal-compliance/`) — register legislation, add obligations with
  requirements/responsible person/review frequency, link ISO clauses via
  the (now shared) `ClausePicker`, and record compliance evaluations
  (Compliant/Non-compliant/Partial) with full history retained.
- **Compliance engine helpers** (`src/shared/engine/compliance.ts`,
  unit-tested): overdue-review detection, a compliance-rate summary
  (latest evaluation per obligation, not-yet-evaluated excluded from the
  rate — mirrors `scoring.ts`'s `computeReadiness` convention), and the
  bidirectional clause↔obligation lookup the brief asked for explicitly.
- **Bidirectional linkage is real, not just data-model plumbing**: the
  Clause Explorer has a new "Legal" tab showing every obligation linked
  to the clause you're viewing (with a live deep link back into Legal &
  Compliance), and the Legal & Compliance screen accepts a
  `?legislation=` query param to land there directly.
- **Compliance-focused audit programmes**: Programme Builder gained a
  second "Plan by legal obligation" picker alongside "Plan by process" —
  selecting obligations in scope widens the clause set the same way
  processes do (`collectObligationClauseIds`, unit-tested).
- Refactor along the way: `ClausePicker`/`ClauseLinkList`/`TagListEditor`
  were extracted from the Process Explorer into `components/common.tsx`
  once Legal & Compliance needed the same clause-linking UI — reuse, not
  duplication, now that there were two real call sites.
- Verified: 53/53 tests pass, typecheck clean, both builds compile, and
  the full obligation → evaluation → Clause Explorer reverse-link flow
  was exercised live in a browser (screenshots, zero console errors).

**Next up: M3 (Findings & CAPA lifecycle, Phase 3 of the brief)** —
promotes the current flat `gap_assessments` rating into a full
Observation/OFI/Minor NC/Major NC finding with root cause analysis and a
corrective-action lifecycle (owner/due date/verification/closure), plus
the open-findings/overdue/recurring/closure-effectiveness dashboards the
brief asks for. This is the last major entity group before Scoring v2 (M5)
can be built, since scoring v2 needs real closure-performance data as an
input.
