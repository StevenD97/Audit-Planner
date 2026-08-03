# Audit Planner — Project Report (for external review)

*Prepared 2026-08-03. This document summarizes what the tool does and how
it is built today, for the purpose of getting outside feedback/improvement
ideas. It reflects the actual current state of the codebase and deployment,
not aspirational scope.*

---

## 1. What this is

Audit Planner is a browser-based tool for a SHE (Safety, Health &
Environment) Coordinator to **plan and prepare** internal/external audits
against two ISO management-system standards:

- **ISO 14001** (Environmental Management Systems) — built from **BS EN ISO
  14001:2026**, a new edition (supersedes 2015+A1:2024)
- **ISO 45001** (Occupational Health & Safety Management Systems) — built
  from **BS EN ISO 45001:2018, incorporating Amendment 1:2024** (climate
  change added as an explicit consideration)

It is not a generic checklist app. The standards are modeled as a
**knowledge graph** — clauses, requirements, required evidence, interview
questions, typical findings, and cross-references between clauses (both
within a standard and between the two standards) — and every feature screen
generates its output (programmes, checklists, evidence plans, gap
assessments, readiness scores, reports) from that graph rather than from
static templates.

**Current knowledge base size:** 105 clauses total (49 for ISO 14001, 56
for ISO 45001), each carrying: requirement summary, plain-English
explanation, audit objective/intent, evidence-required list, interview
questions (tagged by audience role), audit trace tests, typical
findings/nonconformities, related clauses, cross-standard equivalents, and
risk prompts. Plus 7 pre-built canonical audit trails (e.g. Leadership →
Objectives → Monitoring → Management Review; Hazard ID → Risk Assessment →
Controls → Training → Incident Investigation).

## 2. Feature screens

| Screen | What it does |
|---|---|
| **Dashboard** | Overview/landing screen for the current workspace. |
| **Audit Planner** | Wizard to define an audit: choose ISO 14001, ISO 45001, or both (combined), scope, sites, departments, dates, team. |
| **Programme Builder** | Auto-generates a day-by-day audit schedule from the in-scope clauses (a scheduling engine allocates clauses into time-boxed slots, reserving opening/closing meeting slots), then supports manual adjustment of activity type/owner/location per slot. |
| **Clause Explorer** | Browse every clause with its full knowledge-base record; global search (`Ctrl/Cmd+K`); cross-standard links surfaced inline. |
| **Checklist Generator** | Produces an audit-ready checklist from the in-scope clauses. |
| **Evidence Planner** | Tracks evidence required vs. obtained/sighted per clause. |
| **Gap Assessment Tool** | Structured gap-assessment workflow against clause requirements. |
| **Readiness Assessment** | Scores clauses 0–100 from gap-assessment history + evidence completeness + a static "commonly nonconforming" weighting, rolled up into an overall readiness percentage. |
| **Audit Trail Generator** | Offers the 7 canonical trails plus graph-based custom trail suggestions (walks the `relatedClauses` graph from a seed clause), and can insert a trail straight into the programme. |
| **Reporting** | Exports an Audit Plan, Schedule, Preparation Pack, or Gap Assessment Report to **Excel** (`exceljs`) or **PDF** (`pdfmake`). |
| **AI Assistant** | See §3 below — not an LLM, a deterministic recommender. |

## 3. "AI Assistant" — what it actually is

There is no external AI API call anywhere in this build (no OpenAI/Anthropic
API key, no network dependency at all). The AI Assistant is a **rule- and
graph-based recommendation engine** (`src/shared/engine/recommender.ts`)
that runs entirely offline over the knowledge base and the current audit's
own data:

1. Recommends interview questions, ranked by prior nonconformity history,
   assigned risk level, and evidence gaps.
2. Suggests audit trails by walking the clause-relationship graph.
3. Scores clauses to surface likely weak areas.
4. Groups ranked questions into a time-boxed interview agenda by process
   owner role.
5. Diffs required vs. obtained evidence to highlight gaps.
6. Assembles a full audit agenda combining the programme, interview plan,
   and document list.

The interface (`getRecommendations(context): Recommendation[]`) is designed
so a real LLM could later be dropped in behind the same contract — this
was a deliberate design choice, not yet implemented. **This is the single
biggest gap between the name "AI Assistant" and what's actually running**,
worth being upfront about in any review.

## 4. How it's built — technology stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript, built with Vite, Tailwind CSS |
| Routing/state | react-router (`HashRouter`), Zustand |
| Database | SQLite compiled to WebAssembly (`sql.js`) — runs **inside the browser tab itself** |
| Persistence | Browser `IndexedDB` (autosave) + explicit "Save As" download / "Open" upload of a `.iaap` file (a renamed SQLite file) for moving a workspace between devices |
| Export | `exceljs` (Excel), `pdfmake` (PDF) — both generate the file client-side and trigger a browser download |
| Encryption | Web Crypto API (`crypto.subtle`) — see §6 |
| Testing | Vitest (unit/integration — 33 tests across 7 files, all passing), Playwright (browser smoke tests) |
| Hosting | Static site on **GitHub Pages**, built and deployed by a GitHub Actions workflow on every push |

**Notable architectural fact:** this codebase actually supports *two*
build targets from one source tree — a full Electron desktop app (with a
native SQLite file on disk via IPC) and this browser build (SQLite-in-WASM
+ IndexedDB) — via a platform-abstraction layer (`src/renderer/src/platform`)
that every feature screen calls through, never touching storage directly.
**The desktop build exists in the repo but is not the deployed/used path**
— see §7 for why.

Codebase size: ~7,050 lines of TypeScript/TSX across the shared
engine/knowledge-base, the Electron main process, and the React renderer.

## 5. Data model summary

- `Standard` (currently 2 seeded: ISO 14001, ISO 45001; schema supports
  more — see §8)
- `Clause` (per standard) — the full record described in §1
- `clause_equivalence` — an explicit many-to-many mapping between
  conceptually-equivalent clauses across the two standards (they don't
  share numbering, so this is a real mapping table, not a numeric
  coincidence — e.g. ISO 14001 6.1.2 "Environmental aspects" ↔ ISO 45001
  6.1.2.1/6.1.2.2 "Hazard identification"/"OH&S risk assessment")
- Per-audit-project entities: audit plan, programme/schedule, checklist
  items, evidence records, gap-assessment records, readiness scores —
  all stored in the user's own workspace database, not shared/centralized

Full schema detail lives in `docs/DATABASE_SCHEMA.md` in the repo.

## 6. Security & data handling — stated plainly

This tool holds no server and no login. That shapes everything about its
security model, and it's worth being explicit about both what was built
and what it deliberately does not claim:

- **No data leaves the browser.** There is no backend. A workspace lives
  in that browser's `IndexedDB`, or in a `.iaap` file the user explicitly
  downloads. Opening the same URL on a different device starts a fresh,
  empty workspace — there is no shared state to leak.
- **Encryption at rest is available, opt-in, and real** (not just a
  password prompt with nothing behind it): `src/shared/crypto.ts`
  implements AES-256-GCM with a key derived via PBKDF2-HMAC-SHA256 at
  210,000 iterations (OWASP's 2023 minimum), unique random salt/IV per
  encryption. Once a passphrase is set, every save (autosave to
  IndexedDB, or an exported `.iaap` file) is encrypted; a file-format
  magic-byte prefix lets the app tell an encrypted file from a plain one
  without needing the passphrase up front, so pre-existing unencrypted
  files still open normally.
  - **There is no password recovery.** The passphrase is never stored
    anywhere — losing it means the data is permanently gone.
  - **This is encryption at rest, not access control.** Anyone using the
    app while it's open and unlocked sees everything. It protects a
    stolen/copied file, not a shared, already-unlocked session.
  - Verified by dedicated tests (`tests/crypto.test.ts`,
    `tests/mainWorkspace.test.ts`): round-trip correctness, wrong-passphrase
    rejection, and backward compatibility with unencrypted legacy files.
- **The GitHub repository (and therefore the app's source code) is
  public.** GitHub Pages on the free tier requires a public repo. This
  exposes the *code*, not any *audit data* — nothing user-entered is ever
  committed to the repo or reachable by anyone else, since storage is
  entirely local to each visitor's own browser.
- **No telemetry, no analytics, no third-party network calls** anywhere
  in the app.

## 7. Deployment history (for context — this went back and forth)

Worth including so a reviewer understands *why* the architecture has two
platforms baked in, even though only one is currently used:

1. Originally scoped and built as a **desktop-only Electron app** (native
   SQLite file, no browser involved).
2. A browser-hosted build was added afterwards so it could be reached
   from a work computer without installing anything, deployed to GitHub
   Pages.
3. Concern was raised about uploading sensitive company data to a public
   web app; in response, the desktop path was revisited and passphrase
   encryption was added, and the public web deployment was taken down in
   favor of distributing a Windows installer instead.
4. Building/testing a Windows installer turned out to work technically,
   but **installing unsigned third-party `.exe` files is not something
   IT policy on the actual target work laptop allows** without going
   through IT — which the user explicitly cannot do for this tool.
5. The web deployment was restored as the primary (and currently only
   practical) access path. It is live now at:
   **https://stevend97.github.io/Audit-Planner/**

Net effect: the encryption-at-rest feature built during the "desktop"
detour is still fully wired into the browser build too (same crypto code,
shared by both platforms), so that security work wasn't wasted — it's the
main mitigation available now that the app is reached over a public URL.

## 8. Extensibility

The schema is already standard-agnostic — adding ISO 9001, ISO 50001, or
ISO 27001 requires seeding new clause data in the same shape, with no
schema or UI code changes (the Combined Audit selector, Clause Explorer,
etc. are all driven by a `standard_id`, not hard-coded to two standards).
No additional standards are seeded yet.

## 9. Known limitations / explicitly out of scope

- **Single-user, single-device per workspace.** No real-time collaboration,
  no shared/multi-user editing — moving a workspace between people or
  devices means downloading and re-uploading a `.iaap` file, like emailing
  a spreadsheet.
- **AI Assistant is rule-based, not an LLM** (§3) — this is probably the
  most impactful thing to get feedback on, since "AI Assistant" branding
  sets an expectation of natural-language generation that isn't there yet.
- **No code-signed installer** — the desktop build path exists but isn't
  the recommended one given IT constraints (§7).
- Only 2 of the 5 originally-scoped standards have seed data (§8).
- No accessibility audit has been performed (contrast, screen-reader
  labeling, keyboard-only navigation beyond the documented shortcuts).
- No performance testing at scale (e.g. hundreds of concurrent audit
  projects in one browser's IndexedDB, or clause counts far beyond the
  current 105).

## 10. What's been verified vs. what hasn't

**Verified:**
- TypeScript compiles clean, all 33 automated tests pass (knowledge base
  shape, scoring engine, scheduler, recommender, encryption round-trips,
  real file I/O, export generation).
- The live GitHub Pages deployment's CI pipeline runs typecheck + tests +
  build on every push before publishing.
- Manual browser walkthroughs of the core flows (audit creation, programme
  generation, clause explorer, checklist/evidence generation, gap
  assessment, audit trails, AI Assistant, encryption unlock/lock cycle).

**Not verified:**
- No real user (auditor) has used this for an actual live audit yet.
- No load/scale testing.
- No formal accessibility or penetration testing.
- No legal/compliance review of the ISO clause interpretations — the
  knowledge base includes explicit `assumptions` fields flagging anywhere
  the standard's wording was ambiguous and required an interpretive
  choice for audit-planning purposes (see `docs/ROADMAP.md` for the list).

---

*Questions worth putting to a reviewer: Is the rule-based "AI Assistant"
framing honest/clear enough, or should it be renamed until an LLM is
actually integrated? Is public-repo + client-side-only storage an
acceptable long-term security posture for this use case, or does it need
an actual backend with real access control? What would meaningfully
improve the audit-planning workflow itself, independent of the tech
stack?*
