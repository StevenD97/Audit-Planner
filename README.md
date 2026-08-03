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

The same renderer source also builds as a **plain static web app** (no
Electron) — see "Web build & deployment" below.

## Getting started

```bash
npm install
npm run dev        # launches the Electron app in development mode
```

Other scripts:

```bash
npm run build       # production build of main/preload/renderer to out/ (desktop)
npm run start       # preview the desktop production build
npm run build:web   # production build of the browser-only app to dist-web/
npm run dev:web     # dev server for the browser-only app
npm run preview:web # preview the browser-only production build
npm run typecheck   # TypeScript project references, no emit
npm run test        # Vitest unit tests (knowledge base, engines, export generators)
npm run package     # electron-builder installers (see electron-builder.yml)
```

## Web build & deployment

Everything — the knowledge base, engines, and all ten feature screens —
runs identically in a plain browser tab, no Electron required. A small
platform abstraction (`src/renderer/src/platform`) swaps out Electron's IPC
bridge for a browser-native equivalent at runtime:

| Concern | Desktop (Electron) | Browser (web build) |
|---|---|---|
| Storage | SQLite file on disk (`.iaap`), via `sql.js` in the main process | SQLite **in the browser tab itself** (`sql.js` compiled to WebAssembly), autosaved to IndexedDB |
| Save | Native Save/Save As dialog, writes the `.iaap` file | **Save** persists to this browser's IndexedDB; **Save As** downloads a `.iaap` file you can back up or move to another device |
| Open | Native Open dialog | A file picker lets you upload a previously-downloaded `.iaap` file |
| Export (Excel/PDF) | Written straight to disk via a native Save dialog | Generated in the browser and downloaded like any file |

This means data is **local to that browser/device** — there's no shared
server, so opening the link on a different computer starts a fresh
workspace unless you download a `.iaap` file from one and upload it on the
other. See `docs/ARCHITECTURE.md` §9 for the full rationale and the tradeoffs
of moving to shared/multi-user storage later.

**Public GitHub Pages deployment: live again.** The desktop build turned
out not to be viable without local IT approval to run an installer, so the
web app (`.github/workflows/deploy-pages.yml`) is back as the primary access
path, at `https://<org-or-user>.github.io/<repo>/`. Two one-time,
repo-admin-only settings changes are needed for the workflow to actually
publish (I can't change repo-level GitHub settings myself, only files/git):

1. **Settings → General → Danger Zone → Change visibility → Public**
   (GitHub Pages on the Free plan only serves public repos; there is no way
   around this short of a paid plan).
2. **Settings → Pages → Build and deployment → Source** → set to
   **"GitHub Actions"**.

Once both are set, push to this branch (or run the workflow manually from
the Actions tab) and the site goes live at the URL above. **What being
public actually exposes**: the app's source code and the empty UI shell —
nothing else. There is no server and no database; every audit you create
lives only in that browser's IndexedDB (or a downloaded `.iaap` file), so
making the repo public does not publish any audit data, regardless of who
else finds the link. See "Passphrase protection" below for protecting a
`.iaap` file if you export one.

## Passphrase protection (encryption at rest)

If a workspace holds anything sensitive, click **🔓 Unprotected** in the
toolbar (or just start typing when the app offers it on a new workspace)
to set a passphrase. From then on, everything saved to disk (desktop
`.iaap` file) or to the browser (IndexedDB autosave) is encrypted with
AES-256-GCM, key-derived from your passphrase via PBKDF2 — see
`docs/ARCHITECTURE.md` §10 for the exact design and, importantly, **what
this does and doesn't protect against**. Two things worth knowing up front:

- **There is no password recovery.** The passphrase is never stored
  anywhere — lose it, and that workspace's data is gone. Keep it in a real
  password manager.
- **This is encryption at rest, not a login.** Anyone with access to the
  app while it's open and unlocked sees everything. It protects a copied
  file or a stolen disk, not a shared, already-unlocked session.

## Using the app

1. **New Audit** (or `Ctrl/Cmd+N`) creates an in-memory workspace — save it
   anywhere as a `.iaap` file (SQLite) via **Save**/**Save As** whenever you
   want it persisted; it autosaves every 60s once a file path exists.
2. **Audit Planner** — choose ISO 14001, ISO 45001, or both (combined),
   define scope, sites, departments, dates and team.
3. **Process Explorer** — model your organisation as Organisation → Site →
   Department → Function → Process, each process with its own inputs/
   activities/outputs/KPIs, risks (with likelihood/severity) and controls,
   each linkable to the ISO clauses it evidences. Adopt any of 10 seeded
   starter processes (Permit to Work, Waste Management, Incident
   Management, Contractor Management, Emergency Preparedness, Training &
   Competence, Management Review, Legal & Compliance Obligations, Change
   Management, Monitoring & Measurement) instead of starting from scratch.
4. **Legal & Compliance** — register legislation (environmental, H&S,
   permit conditions, corporate requirements), track compliance
   obligations with requirements/responsible person/review frequency,
   link obligations to the ISO clauses they affect, and record compliance
   evaluations (Compliant/Non-compliant/Partial) over time. Overdue
   reviews and a compliance-rate summary surface at the top of the
   screen.
5. **Risk Register** — every risk recorded against a process, plotted on
   a likelihood x severity heat map (click a cell to see what's in it),
   plus a coverage-priority ranking of processes driven by their risk
   level, findings raised against them, and non-compliant obligations
   linked to their clauses — with the reasoning behind each ranking shown,
   not just a number.
6. **Programme Builder** — auto-generate a day-by-day schedule from the
   audit's in-scope clauses; optionally select processes and/or legal
   obligations in scope to widen the schedule to whatever those actually
   link to, planning by process or compliance obligation rather than only
   by clause. A **"Prioritise by risk"** toggle reorders the schedule so
   higher-priority processes (per the Risk Register) are covered earlier
   and in more depth. Adjust activity types/owners/locations afterward.
7. **Clause Explorer** — browse every clause with its requirement,
   explanation, audit intent, evidence required, interview questions,
   typical findings, related/cross-standard clauses, and — via the
   **Legal** tab — every compliance obligation linked to that clause,
   with a direct link back into Legal & Compliance. Global search:
   `Ctrl/Cmd+K`.
8. **Checklist Generator** / **Evidence Planner** / **Gap Assessment Tool**
   — generate and work through audit-ready artefacts from the same
   knowledge base. Any clause rated Minor/Major NC in the Gap Assessment
   Tool can be **raised as a finding** with one click, pre-filled from
   the assessment narrative.
   **Sampling Plans** recommends a sample size and states its rationale
   plainly — judgment/risk-based/random/stratified, each explicitly
   labelled as a practical heuristic rather than a formal statistical
   calculation — for training records, inspections, permits, contractors,
   incident investigations and competence records, and logs which items
   were actually sampled.
   **Readiness Assessment** scores every clause from six real inputs
   (gap rating, open findings, corrective-action closure history,
   compliance evaluations, evidence completeness, linked risk level),
   shows exactly why each score isn't 100%, and rolls scores up by
   process, department and site — not just an overall percentage.
9. **Findings & Corrective Actions** — track findings (Observation / OFI
   / Minor NC / Major NC) to closure: run a root cause analysis (5 Why,
   Fishbone, or a simplified TapRooT-style method), log corrective
   actions with an owner/due date/verification notes, and see open
   findings, overdue actions, closure rate, and **recurring findings
   across your entire audit history** (the same clause or process
   showing up repeatedly across different audits) at a glance.
10. **Audit Trail Generator** — canonical trails (Leadership→Objectives→
    Monitoring→Management Review; Hazard ID→Risk Assessment→Controls→
    Training→Incident Investigation; Environmental Aspects→Controls→
    Monitoring→Compliance Obligations; plus four more) can be added
    straight into the programme.
11. **Reporting** — export an Audit Plan, Schedule, Preparation Pack, or
    Gap Assessment Report to Excel or PDF.
12. **Audit Intelligence Engine** (🤖 button, bottom of sidebar) — a
    deterministic, fully-offline recommender (no external API calls) that
    suggests questions, trails, weak areas, interview plans, missing
    evidence and agendas from the current audit's actual data — every
    reason shown is the same explainable `ScoreDriver` the Readiness
    Assessment screen uses, not a separate heuristic. Trail suggestions
    include a **process trail** (Process → Risk → Control → Clauses) from
    whichever process currently has the highest risk/findings/compliance
    coverage priority, alongside the canonical and clause-graph trails.
    **Analyse patterns & recurrence** surfaces recurring findings across
    your entire audit history, controls whose linked clauses are still
    scoring poorly despite existing, and processes with the worst
    corrective-action closure record. Runs behind a provider seam
    (`src/shared/engine/ai/`) designed so a future local LLM (e.g. Ollama)
    can be swapped in without touching UI code. See
    `docs/AUDIT_INTELLIGENCE_PLATFORM_STRATEGY.md` for the full platform
    roadmap and `docs/ARCHITECTURE.md` §6 for why it's rule-based rather
    than LLM-backed today.

## Project layout

```
docs/                    Phase 1/6 design deliverables
src/shared/              Standard-agnostic domain types, knowledge base, engines (scoring, scheduler, trail builder, recommender)
src/main/                Electron main process: SQLite workspace store, IPC handlers, Excel/PDF export generators
src/preload/             contextBridge-based typed API surface exposed to the renderer
src/renderer/            React app: layout, routing, feature screens, Zustand store, platform/ (Electron vs. browser persistence + export)
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
- The passphrase-protection feature was verified two ways: `tests/mainWorkspace.test.ts`
  drives the real desktop `Workspace` class against real files on disk
  (plain→encrypted save, correct/incorrect passphrase on open, removing
  protection, opening a pre-existing unencrypted file), and a full
  browser-driven pass confirmed the actual UI flow — protect a workspace,
  create real audit data, reload the page (encrypted autosave), reject a
  wrong passphrase, accept the correct one, and confirm the data survived
  the round trip intact.
- `npm run package` (Windows installer generation via electron-builder) was
  run here and produces `release/Audit Planner Setup <version>.exe` (NSIS
  installer) plus `release/win-unpacked/` (the unpacked app). It was smoke-tested
  in this sandbox under Wine + Xvfb: the packaged exe launches and spawns
  Electron's real multi-process set (main, GPU, renderer, network service),
  confirming the build is genuinely functional and not just a valid file
  format. The installer is unsigned (no code-signing certificate), so Windows
  SmartScreen will show an "unrecognized app" warning on first run — see
  `docs/ROADMAP.md` for the signing tradeoffs.
