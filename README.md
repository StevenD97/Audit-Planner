# Audit Planner

A desktop application that helps a SHE Coordinator **plan and prepare**
internal/external audits against **ISO 14001** (Environmental Management
Systems) and **ISO 45001** (Occupational Health & Safety Management
Systems) — not just a checklist, but a knowledge-graph-driven planning tool
covering evidence requirements, interview questions, audit trails, gap
assessment, readiness scoring and report generation.

See `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/UI_DESIGN.md`
and `docs/ROADMAP.md` for the full design rationale, explicit assumptions
made when interpreting the standards, and MVP scope.

## Standards covered

- **ISO 14001:2026** (BS EN ISO 14001:2026, 4th edition — supersedes 2015+A1:2024)
- **ISO 45001:2018 + Amendment 1:2024** (BS EN ISO 45001:2023+A1:2024)

The knowledge base (`src/shared/knowledge-base`) is authored directly from
these two documents' clause text, not from memory of earlier editions —
see `docs/ARCHITECTURE.md` §2 for the structural differences this surfaces
in the app (e.g. combined-audit clause mapping).

## Tech stack

Electron 31 + React 18 + TypeScript + Vite (via `electron-vite`), Tailwind
CSS, Zustand, SQLite via `sql.js` (WASM, no native build step), `exceljs` /
`pdfmake` for exports. See `docs/ARCHITECTURE.md` §3 for the full rationale.

## Getting started

```bash
npm install
npm run dev        # launches the Electron app in development mode
```

Other scripts:

```bash
npm run build       # production build of main/preload/renderer to out/
npm run start       # preview the production build
npm run typecheck   # TypeScript project references, no emit
npm run test        # Vitest unit tests (knowledge base, engines, export generators)
npm run package     # electron-builder installers (see electron-builder.yml)
```

## Using the app

1. **New Audit** (or `Ctrl/Cmd+N`) creates an in-memory workspace — save it
   anywhere as a `.iaap` file (SQLite) via **Save**/**Save As** whenever you
   want it persisted; it autosaves every 60s once a file path exists.
2. **Audit Planner** — choose ISO 14001, ISO 45001, or both (combined),
   define scope, sites, departments, dates and team.
3. **Programme Builder** — auto-generate a day-by-day schedule from the
   audit's in-scope clauses, then adjust activity types/owners/locations.
4. **Clause Explorer** — browse every clause with its requirement,
   explanation, audit intent, evidence required, interview questions,
   typical findings, and related/cross-standard clauses. Global search:
   `Ctrl/Cmd+K`.
5. **Checklist Generator** / **Evidence Planner** / **Gap Assessment Tool**
   / **Readiness Assessment** — generate and work through audit-ready
   artefacts from the same knowledge base.
6. **Audit Trail Generator** — canonical trails (Leadership→Objectives→
   Monitoring→Management Review; Hazard ID→Risk Assessment→Controls→
   Training→Incident Investigation; Environmental Aspects→Controls→
   Monitoring→Compliance Obligations; plus four more) can be added straight
   into the programme.
7. **Reporting** — export an Audit Plan, Schedule, Preparation Pack, or Gap
   Assessment Report to Excel or PDF.
8. **AI Assistant** (🤖 button, bottom of sidebar) — a deterministic,
   fully-offline recommender (no external API calls) that suggests
   questions, trails, weak areas, interview plans, missing evidence and
   agendas from the current audit's actual data. See
   `docs/ARCHITECTURE.md` §6 for why it's rule-based rather than LLM-backed
   in this build, and the upgrade path.

## Project layout

```
docs/                    Phase 1/6 design deliverables
src/shared/              Standard-agnostic domain types, knowledge base, engines (scoring, scheduler, trail builder, recommender)
src/main/                Electron main process: SQLite workspace store, IPC handlers, Excel/PDF export generators
src/preload/             contextBridge-based typed API surface exposed to the renderer
src/renderer/            React app: layout, routing, feature screens, Zustand store
tests/                   Vitest unit tests
```

## Notes on this build

- Built and verified in a headless sandboxed container (no display server,
  no code-signing): TypeScript project typechecks clean, the production
  build succeeds, all Vitest unit tests pass, and the packaged Electron app
  was smoke-tested end-to-end under Xvfb (Playwright driving the real
  Chromium DevTools Protocol) — audit creation, programme auto-generation,
  clause explorer, checklist/evidence generation, gap assessment, audit
  trails and the AI Assistant were all exercised with zero console errors.
- `npm run package` (installer generation) was not run here — see
  `docs/ROADMAP.md` "Build & packaging notes".
