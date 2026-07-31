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
