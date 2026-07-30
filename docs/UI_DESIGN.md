# Audit Planner — UI / UX Design

Audience: a **SHE Coordinator**, not a certification body auditor — so the
design favours plain language, guided workflows and visible next-actions over
auditor jargon or a bare document-control aesthetic.

## Design principles

1. **Guided, not blank-page.** Every generator screen (Programme Builder,
   Checklist Generator, Evidence Planner) opens with sensible defaults derived
   from the Audit Planner's scope, so the user edits rather than starts from
   nothing.
2. **One navigation spine.** A persistent left sidebar (collapsible) with the
   ten modules; a persistent top bar with global clause/keyword search
   (`Cmd/Ctrl+K`) and the current audit project name/status.
3. **Traceability everywhere.** Any clause reference in any screen is a
   clickable chip that opens the Clause Explorer detail panel (slide-over),
   so the user never loses context switching between "what does this clause
   need" and "what have I done about it."
4. **Status colour language, used consistently:** grey = not started/pending,
   blue = in progress, green = conforms/complete, amber = OFI, orange = minor
   NC, red = major NC / high risk. Same palette in Gap Assessment, Readiness,
   and Dashboard.
5. **Modern, light-weight visuals**: rounded cards, generous whitespace,
   Tailwind-based design tokens, light/dark theme, accessible contrast (WCAG
   AA), keyboard navigable.

## Screen inventory

### 1. Dashboard
- **Upcoming audits** — card list (next 3), each showing standard(s), site,
  date, readiness %.
- **Audit status board** — kanban-style strip: Planning / Scheduled / In
  Progress / Completed / Closed, counts per column, click to filter.
- **Completion metrics** — checklist completion %, evidence obtained %,
  gap-assessment coverage % (progress rings).
- **Readiness score** — large radial gauge (0–100%) for the selected/most
  imminent audit, with a sparkline of the last N readiness snapshots.
- **Quick actions** — "New Audit", "Open Audit", "Generate Prep Pack".

### 2. Audit Planner
Wizard-style, 5 steps with a left step-tracker:
1. Standard(s): ISO 14001 / ISO 45001 / **Combined** (multi-select cards with
   short description; combined shows the clause-equivalence note from
   ARCHITECTURE.md).
2. Scope: free-text scope statement + suggested scope prompts pulled from
   4.3/4.3 clause data.
3. Sites & Departments: add/edit sites, then departments per site (table,
   inline add).
4. Audit type, dates, duration, lead auditor & team.
5. Review & create — summary, "Create Audit Project" button which persists
   `audit_projects` and jumps to Programme Builder.

### 3. Audit Programme Builder
Two-pane layout: left = draggable list of unscheduled items (clauses grouped
by process owner, interviews, document reviews, site inspections — all
auto-generated from scope); right = a day-by-day calendar/timetable grid
(drag-and-drop into slots). Toolbar: "Auto-generate schedule" (runs
`engine/scheduler.ts`), "Add day", export buttons. Conflicts (double-booked
owner) are flagged inline in red.

### 4. Clause Explorer
Left: tree/list of clauses (filter by standard, search, "show only clauses
in current audit scope" toggle). Right: detail panel with tabs —
Requirement | Explanation | Audit Intent | Evidence Required | Questions to
Ask | Typical Findings | Related Clauses (chips, cross-standard clauses shown
with a small "↔ ISO 45001 6.1.2.1" badge). A "Add to current audit" button
per clause pushes it into scope from here too.

### 5. Audit Checklist Generator
Filter bar (standard, process, risk level) → "Generate checklist" builds
`checklist_items`. Resulting checklist is a table (question, clause chip,
risk badge, status dropdown, response text, evidence notes) groupable by
clause or by process. Bulk actions: mark N/A, export selection.

### 6. Evidence Planner
Grouped-by-clause accordion; each row = evidence item (category icon:
procedure/record/monitoring-data/competence), status pill (Requested /
Obtained / Not available / N/A), owner, notes. Top summary bar shows % evidence
obtained, count outstanding, and a "Missing evidence" filter that feeds the
AI Assistant's gap highlighting.

### 7. Gap Assessment Tool
Spreadsheet-like grid: one row per clause in scope, columns = current rating
(segmented control: Conforms / OFI / Minor NC / Major NC), narrative
(expandable text), recommended action, risk. Colour-coded rows per the status
language above. Right-side summary panel: rating distribution donut chart.

### 8. Readiness Assessment
Top: overall readiness % gauge + trend sparkline. Middle: per-clause
compliance score bar chart (sorted worst-first). Bottom: "High-risk gaps"
list (red/orange rows with a "recommended action" callout) and "Recommended
actions" list aggregated from gap assessments and the AI recommender.

### 9. Audit Trail Generator
Card grid of canonical trails (from `audit_trails_catalogue`), e.g.:
- *Leadership → Objectives → Monitoring → Management Review*
- *Hazard Identification → Risk Assessment → Controls → Training → Incident
  Investigation*
- *Environmental Aspects → Controls → Monitoring → Compliance Obligations*

Clicking a trail opens a horizontal stepper visualising the clause chain with
the audit tests for each step; "Add trail to programme" schedules it as a
linked set of programme slots.

### 10. Reporting
Simple document-generation hub: four report cards (Audit Plan, Audit
Schedule, Audit Preparation Pack, Gap Assessment Report), each with a preview
pane and Export to Excel / Export to PDF buttons. Preparation Pack bundles
scope + programme + checklist + evidence plan + trails into one PDF.

### AI Assistant (docked panel, available from every screen)
A slide-over panel (chat-like but structured, not free-text-only) offering
the six Phase 5 actions as buttons ("Recommend questions for this clause",
"Suggest audit trails for this scope", "Where are the weak areas?", "Build an
interview plan", "What evidence is missing?", "Generate today's agenda").
Each produces a structured card the user can "Insert into..." the relevant
module (checklist, programme, evidence plan) rather than raw chat text.

## Navigation & search

- Left sidebar icons + labels, collapsible to icon-only.
- `Cmd/Ctrl+K` global search across clause numbers/titles/keywords and audit
  project names — jumps straight to the relevant screen with the item
  preselected.
- Breadcrumbs in the top bar for nested views (e.g. Audit Planner ▸ Sites).

## Visual language

- Typeface: system UI font stack (fast, native feel).
- Accent colour: teal/blue (`#0F766E`/`#2563EB` family) — calm, "safety &
  environment" adjacent without being alarm-red by default.
- Cards: `rounded-2xl`, subtle shadow, 16–24px padding.
- Dark mode: same tokens, inverted surface scale, tested for contrast.
