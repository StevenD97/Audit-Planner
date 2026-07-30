# Audit Planner — Development Roadmap & MVP Scope

## MVP scope (this build)

In scope, fully functional:
- Knowledge base for ISO 14001:2026 and ISO 45001:2018+A1:2024, all clauses
  4–10 and sub-clauses, each with requirement/explanation/audit
  intent/evidence/questions/tests/findings/related clauses/risk prompts/
  mandatory documented info, and cross-standard equivalence mapping.
- Dashboard, Audit Planner wizard, Programme Builder (auto-generate +
  drag-and-drop adjust), Clause Explorer, Checklist Generator, Evidence
  Planner, Gap Assessment Tool, Readiness Assessment, Audit Trail Generator
  (3 canonical trails + graph-based custom trail suggestion), Reporting
  (Excel + PDF), rule-based AI Assistant.
- Local SQLite persistence, save/open/close audit projects, autosave.
- Global search, keyboard shortcut, light/dark theme.

Explicitly **out of scope** for this build (documented so expectations are
clear):
- Multi-user/concurrent editing or a server component — this is a
  single-user desktop file, like a spreadsheet or Word document.
- Real LLM-backed natural-language generation — the AI Assistant is
  deterministic/rule-based (see ARCHITECTURE.md §6); a provider interface is
  stubbed for future integration.
- Code-signed installers — `electron-builder` config is included but signing
  certificates and a GUI build/run were not available in this container; see
  §Build & Packaging below.
- ISO 9001/50001/27001 content — schema supports it (ARCHITECTURE.md §8) but
  no seed data is authored yet.

## Assumptions (explicit, per the standards actually supplied)

1. ISO 14001:2026 is treated as authoritative over any memorised knowledge of
   ISO 14001:2015 — several sub-clause groupings and phrases differ (see
   ARCHITECTURE.md §2). Any place the app's copy sounds slightly different
   from "what ISO 14001 used to say" is intentional.
2. ISO 45001 content reflects the 2018 base text plus the 2024 climate-change
   amendment; no other 45001 amendments are assumed.
3. Where the standard uses "as applicable"/"where practicable" qualifiers,
   the knowledge base still lists the full evidence/question set and lets the
   auditor mark items N/A during the audit, rather than trying to
   pre-guess applicability — this keeps the tool conservative (nothing
   silently hidden).
4. "Combined audit" clause alignment uses conceptual equivalence, not
   identical numbering (see the clause_equivalence table) — this is stated
   explicitly in the Combined Audit UI so the user isn't confused when e.g.
   14001 §6.1.2 and 45001 §6.1.2.1 are shown side by side despite differing
   numbers.

## Phased roadmap

**Phase 1 — Requirements & design (this deliverable):** data model,
architecture, DB schema, UI design, tech stack, roadmap. ✅

**Phase 2 — Application build (this deliverable):** Electron/React desktop
app implementing the MVP scope above, seeded with the full 14001/45001
knowledge base. ✅

**Phase 3 — Knowledge structure (this deliverable):** Standard → Clause →
Requirement → Audit Objective → Evidence → Interview Questions → Audit Tests
→ Potential Findings, extensible to new standards. ✅

**Phase 4 — UX polish (this deliverable):** search, export, save/open
audits, fast clause navigation, responsive layout, theming. ✅

**Phase 5 — AI features (this deliverable, deterministic engine):**
recommend questions, suggest trails, identify weak areas, generate interview
plans, highlight missing evidence, generate agendas. ✅ (LLM upgrade path
documented, not implemented.)

**Phase 6 — Deliverables (this deliverable):** architecture, DB design, file
structure (`docs/FILE_STRUCTURE.md` generated alongside the repo tree),
development plan (this file), MVP scope (this file), full source code. ✅

## Post-MVP roadmap (future iterations, not built here)

1. **v1.1** — ISO 9001 knowledge base + generic "process approach" audit
   trail templates; installer builds (Windows NSIS, macOS DMG, Linux AppImage)
   with code signing.
2. **v1.2** — ISO 50001 and ISO 27001 knowledge bases; integrated
   multi-standard audit programme (3+ standards in one programme).
3. **v1.3** — Optional LLM provider integration (bring-your-own API key)
   swapped into `engine/recommender.ts` for richer natural-language
   interview-plan phrasing and free-text organisational-context ingestion
   (e.g. paste a process map or org chart and get suggested interviewees).
4. **v1.4** — Multi-user mode: shared project file on a network drive with
   file-locking, or a small sync service for teams running multiple SHE
   coordinators across sites.
5. **v1.5** — Mobile companion (read-only checklist + evidence capture via
   camera) syncing back into the desktop project file.

## Build & packaging notes for this sandboxed build

This build was produced in a headless remote container without a display
server or code-signing certificates. What was validated here:
- TypeScript compiles cleanly (`npm run typecheck`).
- The Vite renderer build succeeds (`npm run build:renderer`) and the
  resulting UI was smoke-tested by loading it in headless Chromium
  (Playwright) — screenshots taken of the key screens.
- Unit tests for the scoring/scheduler/trail-builder/recommender engines pass
  (`npm run test`).

Not validated here (requires a machine with a display / code-signing keys):
- Full Electron desktop shell launch (`npm run dev`/`npm start`) with native
  window chrome.
- `electron-builder` installer generation for Windows/macOS/Linux.

See `README.md` for exact commands to run both once on a normal workstation.
