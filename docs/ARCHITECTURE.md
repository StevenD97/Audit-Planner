# Audit Planner — Application Architecture

## 1. Purpose

Audit Planner is a desktop application for a SHE Coordinator to plan, prepare and
run internal/external audits against **ISO 14001** (Environmental Management
Systems) and **ISO 45001** (Occupational Health & Safety Management Systems). It
is not a checklist app: it models the standards as a knowledge graph (clauses,
requirements, evidence, interview questions, audit trails, typical
nonconformities, clause relationships) and uses that graph to generate audit
programmes, checklists, evidence plans, gap assessments and readiness scores.

## 2. Source standards used to build the knowledge base

| Standard | Edition supplied | Notes / assumptions |
|---|---|---|
| ISO 14001 | **BS EN ISO 14001:2026** (supersedes 2015+A1:2024) | This is a **new edition**, not the widely known 2015 text. Clause numbers 4–10 are retained but wording, several sub-clause titles and terminology have changed (e.g. "shall be available as documented information" replaces "shall maintain/retain documented information"; "compliance obligations" remains the preferred term). The knowledge base is built from this 2026 text, not from memory of the 2015 edition. |
| ISO 45001 | **BS EN ISO 45001:2018, incorporating Amendment 1:2024** (BS EN ISO 45001:2023+A1:2024) | Core clause text is ISO 45001:2018. Amendment 1:2024 adds **climate change** as an explicit consideration under 4.1 (external issues) and 4.2 (interested party needs/expectations), tagged in the source with change markers. No other structural clause changes were introduced by the amendment. |

**Key structural difference exploited by the "Combined Audit" feature:** both
standards share the Annex SL harmonised high-level structure (clauses 4–10),
but the sub-clause breakdown is **not** identical:

- ISO 14001:2026 clause 5 = "Leadership" only (5.1–5.3). ISO 45001 clause 5 =
  "Leadership **and worker participation**" (5.1–5.4, with 5.4 Consultation
  and participation of workers having no 14001 counterpart).
- ISO 14001 6.1 splits into 6.1.1 General, 6.1.2 Environmental aspects, 6.1.3
  Compliance obligations, 6.1.4 Risks and opportunities, 6.1.5 Planning
  action. ISO 45001 6.1 splits into 6.1.1 General, 6.1.2.1 Hazard
  identification, 6.1.2.2 Assessment of OH&S risks, 6.1.2.3 Assessment of
  OH&S opportunities, 6.1.3 Legal/other requirements, 6.1.4 Planning action.
  These are conceptually equivalent but numbered differently.
- ISO 45001 8.1 has a deeper breakdown (8.1.2 Eliminating hazards/hierarchy
  of controls, 8.1.3 Management of change, 8.1.4 Procurement incl.
  Contractors/Outsourcing) than ISO 14001 8.1 (a single operational
  planning and control clause).
- ISO 14001 9.3 is split into 9.3.1/9.3.2/9.3.3 (General/Inputs/Results). ISO
  45001 9.3 is a single unstructured clause with equivalent content.
- ISO 45001 10 adds **"incident"** as a distinct concept alongside
  nonconformity (10.2), and has a distinct 10.1 General plus 10.3 Continual
  improvement; ISO 14001 10 has only 10.1 Continual improvement and 10.2
  Nonconformity and corrective action.

Rather than forcing artificial 1:1 numbering, the data model stores an
explicit **`clause_equivalence`** mapping table (§3.7 of the DB schema) that
links conceptually equivalent clauses across standards with a relationship
strength/type. This is what powers the Combined Audit programme builder and
the cross-standard Clause Explorer links.

Where the standard's wording was genuinely ambiguous or open to
interpretation for audit-planning purposes, this is flagged inline in the
knowledge base record as `assumptions: string[]` rather than silently
resolved — see `docs/DATABASE_SCHEMA.md` §3.1.

## 3. Technology stack

| Layer | Choice | Rationale |
|---|---|---|
| Shell | **Electron 30** | True desktop app (Windows/macOS/Linux), offline-first, local file system access for save/export, no server to maintain — appropriate for a corporate SHE tool that may need to run without internet access or IT-approved installs of a server stack. |
| UI | **React 18 + TypeScript**, Vite build | Fast dev loop, strong typing across the large clause data model, componentised screens. |
| Styling | **Tailwind CSS** + small design-token layer | Consistent, modern, themeable UI without a heavy component library lock-in; supports light/dark. |
| Routing/state | **react-router** for navigation, **Zustand** for app state | Lightweight, avoids Redux boilerplate for a single-user desktop app. |
| Local database | **SQLite via sql.js (WASM)**, persisted to a `.iaap` (Iso Audit Application Package) file per audit project + one shared `knowledge.db` for the standards library | Avoids native module compilation (`better-sqlite3`) issues across OS/Electron ABI versions, which is a common source of "works on my machine" packaging failures for SHE teams without dev tooling. Trade-off (documented in Roadmap): sql.js is in-memory with explicit save-to-disk, so the app autosaves on an interval and on every mutating action. |
| Data access | Thin repository layer (`src/main/db/*Repository.ts`) executing parameterised SQL | Keeps the schema (docs/DATABASE_SCHEMA.md) as the single source of truth; no heavy ORM needed for this size of schema. |
| IPC | Electron `contextBridge` + `ipcMain.handle` / `ipcRenderer.invoke`, one channel per repository method | Renderer never touches the filesystem or SQLite directly (security: `contextIsolation: true`, `nodeIntegration: false`). |
| Export | **exceljs** (Excel), **pdfmake** (PDF) | Both pure-JS, no native/Chromium-print dependency, run identically in main or renderer. |
| AI assistant | Deterministic **rule/graph-based recommendation engine** over the knowledge base (see §5), with an optional pluggable LLM provider interface | No API key is available in this build environment and a SHE tool used inside a corporate network often cannot call external AI APIs for confidentiality reasons. The engine is designed so a real LLM (e.g. an Anthropic API key entered in Settings) can be dropped in later to enrich phrasing without changing the data contracts. |
| Testing | **Vitest** (unit) for engines/repositories, **Playwright** (smoke) for renderer screens | |
| Packaging | **electron-builder** | NSIS/DMG/AppImage targets — configured but not run in this sandboxed build (no GUI/code-signing here); documented as a roadmap step. |

## 4. High-level module architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Electron Main Process                                           │
│  ├─ window management, app menu, autosave scheduler              │
│  ├─ db/                                                         │
│  │   ├─ knowledgeDb.ts        (loads seeded standards library)  │
│  │   ├─ projectDb.ts          (per-audit-project SQLite file)   │
│  │   └─ *Repository.ts        (Clauses, Audits, Checklists,     │
│  │                              GapAssessments, Evidence, ...)  │
│  ├─ ipc/                      (typed request/response handlers) │
│  └─ export/                   (excel.ts, pdf.ts generators)     │
└─────────────────────────────────────────────────────────────────┘
                          ▲  IPC (contextBridge)  ▼
┌─────────────────────────────────────────────────────────────────┐
│ Renderer (React + TS)                                            │
│  ├─ app/            router, layout, theme                        │
│  ├─ features/                                                    │
│  │   ├─ dashboard/                                                │
│  │   ├─ audit-planner/                                           │
│  │   ├─ programme-builder/                                       │
│  │   ├─ clause-explorer/                                         │
│  │   ├─ checklist-generator/                                     │
│  │   ├─ evidence-planner/                                        │
│  │   ├─ gap-assessment/                                          │
│  │   ├─ readiness/                                                │
│  │   ├─ audit-trails/                                            │
│  │   ├─ reporting/                                                │
│  │   └─ ai-assistant/                                             │
│  ├─ engine/          (shared, pure TS — importable by main too)  │
│  │   ├─ scoring.ts          (clause score → readiness %)         │
│  │   ├─ scheduler.ts        (programme time-slot allocation)     │
│  │   ├─ trailBuilder.ts     (audit trail suggestion graph walk)  │
│  │   └─ recommender.ts      (AI-assistant rule engine)           │
│  └─ data/knowledge-base/    (seeded clause data — see §5)         │
└─────────────────────────────────────────────────────────────────┘
```

The `engine/` package has **no Electron or DOM dependency** — it is plain
TypeScript operating on the knowledge-base + project data types, so it is
unit-testable in isolation and reusable if the app is ever offered as a web
version.

## 5. Knowledge base (Phase 3 structure)

```
Standard (14001 | 45001 | [future: 9001, 50001, 27001])
  └─ Clause (e.g. "6.1.2")
       ├─ requirementText          (verbatim/paraphrased "shall" statement)
       ├─ explanation              (plain-English meaning for a SHE reader)
       ├─ auditObjective           (what the auditor is trying to establish)
       ├─ evidenceRequired[]       (documents, records, data, competence evidence)
       ├─ interviewQuestions[]     (open questions + who to ask)
       ├─ auditTests[]             ("audit trail" style trace/verify steps)
       ├­─ potentialFindings[]      (typical NC/OFI wording seen in practice)
       ├─ relatedClauses[]         (same-standard cross-refs)
       ├─ crossStandardEquivalents[] (other-standard clause + relationship type)
       ├─ riskPrompts[]            (risk-based questions to decide audit depth)
       └─ mandatoryDocumentedInfo[] (explicit "shall be available/retained" items)
```

This is intentionally a **superset** of the Annex SL structure so the same
tables extend cleanly to ISO 9001, ISO 50001 and ISO 27001 (§8).

## 6. AI assistant design (Phase 5)

Given no external LLM is available in this build, the "AI assistant" is a
**rule + graph based recommender** that runs entirely offline over the
knowledge base and the current audit project's data:

1. **Recommend audit questions** — pulls `interviewQuestions` for clauses in
   scope, ranked by (a) whether the clause previously scored Minor/Major NC in
   a past audit stored in the project DB, (b) risk level assigned in the
   Audit Planner, (c) whether evidence has been marked "not sighted" in the
   Evidence Planner.
2. **Suggest audit trails** — `trailBuilder.ts` walks the `relatedClauses`
   graph from a seed clause (e.g. Leadership) outward, assembling the
   canonical trails (see `ROADMAP.md` §MVP) plus organisation-specific trails
   inferred from the selected scope/departments.
3. **Identify likely weak areas** — scores each clause 0–100 from: prior gap
   assessment history, evidence completeness, and a static "commonly
   nonconforming clause" weight derived from the `potentialFindings` density
   and auditor experience encoded in the seed data; surfaces the lowest
   scorers.
4. **Generate interview plans** — groups ranked questions by process owner
   role (derived from clause → typical role mapping) into a time-boxed
   agenda.
5. **Highlight missing evidence** — diff between `evidenceRequired` for
   in-scope clauses and what the user has marked as obtained/sighted in the
   Evidence Planner.
6. **Generate audit agendas** — combines the programme builder's time slots
   with the interview plan and document-review list into an exportable
   agenda document.

The module exposes a single `recommender.ts` interface
(`getRecommendations(context): Recommendation[]`) so a future LLM-backed
implementation (e.g. calling the Claude API with the same `context` object to
produce more natural phrasing or handle free-text organisational context) can
be swapped in without touching any UI code — see "AI provider" extension
point in `ROADMAP.md`.

## 7. Security & data handling

- Electron `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
  for the renderer; all filesystem/db access proxied through a narrow,
  typed `preload.ts` API.
- Audit project files (`.iaap`, a SQLite database) are stored wherever the
  user chooses (typically a corporate document management / SharePoint-synced
  folder) — the app does not transmit data anywhere; it is fully offline.
- No telemetry, no network calls, by default.

## 8. Extensibility to ISO 9001 / ISO 50001 / ISO 27001

The `standards` table and `clauses` table are already standard-agnostic (see
DB schema). Adding a new standard is:

1. Insert a `standards` row.
2. Seed `clauses` + related tables for that standard (same shape as
   14001/45001).
3. Optionally add `clause_equivalence` rows linking it to existing standards
   (e.g. ISO 27001 A.5–A.8 controls ↔ ISO 45001 operational controls) to
   support future multi-standard integrated audits.

No schema or UI code changes are required — the Clause Explorer, Checklist
Generator, etc. are all driven by `standard_id`, not hard-coded to 14001/45001.
The Audit Planner's "Combined audit" selector is a multi-select over
`standards`, currently constrained to the two seeded standards in the MVP UI
copy, but the underlying engine already supports N standards.
