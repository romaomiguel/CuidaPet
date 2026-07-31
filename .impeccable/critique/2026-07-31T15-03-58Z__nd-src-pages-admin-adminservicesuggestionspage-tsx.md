---
target: Frontend/src/pages/admin/AdminServiceSuggestionsPage.tsx
total_score: 24
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
timestamp: 2026-07-31T15-03-58Z
slug: nd-src-pages-admin-adminservicesuggestionspage-tsx
---
Method: dual-agent (A: a0bd8bad2396d0130 · B: a0d9bf0e447532baf)

## Scope

Review of the new Admin screen `Frontend/src/pages/admin/AdminServiceSuggestionsPage.tsx` (lists petsitter/partner-submitted service suggestions, Pending/All toggle, per-row "mark reviewed" action), focused on layout, empty state, and the pending/all toggle, compared against `AdminPartnersPage.tsx`'s established conventions. Not a full-app audit.

## Heuristics Table (n/a: #7 Flexibility, #10 Help/Docs — narrow single-purpose triage screen)

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3/4 | No pending count surfaced on the toggle |
| 2 | Match System / Real World | 4/4 | Clear pt-BR copy, role/name/date context per row |
| 3 | User Control and Freedom | 1/4 | "Marcar revisado" is one-way, no reopen |
| 4 | Consistency and Standards | 3/4 | Heading/badge/toggle match perfectly; card-list vs. table divergence from sibling Admin screens |
| 5 | Error Prevention | 2/4 | No confirmation before an irreversible status change |
| 6 | Recognition Rather Than Recall | 4/4 | Status badge + metadata fully visible |
| 8 | Aesthetic and Minimalist Design | 4/4 | Clean, no clutter |
| 9 | Error Recovery | 3/4 | Generic toast text, consistent with codebase norm |
| **Total** | | **24/32** | **Good (75%)** |

## Design Specificity Verdict

**LLM assessment (Assessment A)**: Genuine product-specific craft, not boilerplate. It reuses the house pill-toggle pattern (verified byte-for-byte against `SearchPage.tsx:156`), the exact heading formula (`text-3xl font-bold text-ink` / `text-muted mt-2`) and the Tinted-Pair badges (`badge-yellow`/`badge-green`) from `AdminPartnersPage.tsx` and `index.css`. Doesn't read as copy-pasted from a generic template.

**Deterministic scan (Assessment B)**: `detect.mjs --json` on the target returned exit code 0, empty findings array — no mechanical violations. Class-level cross-check confirmed: container (`container mx-auto max-w-6xl`), header block, and empty-state block classes are byte-identical to `AdminPartnersPage.tsx`. Badge classes (`badge-yellow`, `badge-green`) confirmed defined in `index.css` lines 114-119 — no dangling references. `npx tsc --noEmit` exits clean, no errors.

## Overall Impression

Solid, consistent execution of a narrow admin triage screen. The toggle and container-width issues found during the pre-critique pass (nested `.btn-primary`/`.btn-outline` pills instead of the established segmented-tab pattern; `max-w-4xl` instead of the app-wide `max-w-6xl`) were fixed before this critique ran and both assessments independently confirmed the fixes are now class-for-class consistent with the rest of the app. The one real gap this critique surfaced — a missing empty-state helper line present in `AdminPartnersPage` — was fixed as part of this same pass. Remaining findings are legitimate but out of this task's scope (no `unmarkReviewed`/reopen endpoint exists to implement against) or a defensible content-driven layout choice (card list vs. table).

## What's Working

1. The empty-state string branches cleanly on filter (`Nenhuma sugestão {filter === 'pending' ? 'pendente' : 'ainda'}`) — one line correctly handling two distinct empty states, now paired with a matching helper subtext per filter.
2. The toggle (post-fix) is a precise, dual-verified match to the established `clsx`/`bg-white`/`shadow-sm` segmented-pill pattern used in `SearchPage.tsx` — no drift, confirmed by grep across the codebase.
3. Badge and outline-button usage follows the Tinted-Pair Badge Rule and the Pill Rule from DESIGN.md exactly — notably *more* compliant than `AdminUsersPage`/`AdminSupportMessagesPage`, whose action buttons use non-pill `rounded-lg`.

## Priority Issues

- **[P1] No reopen/undo for "mark reviewed."** What: once marked reviewed, a suggestion can't be reverted from this screen. Why it matters: the closest structural analog in the codebase, `AdminSupportMessagesPage`, supports toggling back ("Reabrir") for the identical pending↔resolved shape; an admin who mis-clicks here has no recovery path. Fix: would require a new `unmarkReviewed`/status-toggle capability on the backend and service layer — not defined in this task's interfaces (`adminList`/`markReviewed` only). **Disposition: out of scope for this task; logged as a backlog item for a future task**, not implemented now.
  - Suggested command: `/impeccable harden` (once a backend toggle endpoint exists).

- **[P2] List renders as stacked cards, not a table, diverging from every sibling Admin list screen.** What: `AdminPartnersPage`, `AdminUsersPage`, and `AdminSupportMessagesPage` all render their lists inside a bordered `<table>`; this screen uses `.card` rows. Why it matters: an admin moving between these screens meets a different structural language mid-section. **Disposition: accepted as intentional** — the row content here is a single free-text paragraph plus a status badge, which doesn't tabulate meaningfully (no sortable columns, no multi-field rows like `AdminPartnersPage`'s Parceiro/Tipo/Cidade/Status). Forcing a table would add empty-looking columns for no benefit; the card-list format is the content-appropriate choice, matching this task's plan. Not changed.

- **[P2] Skeleton doesn't mirror the final row's shape.** What: loading skeleton is 4 uniform `h-16` blocks; `AdminPartnersPage`'s skeleton mimics the real row's avatar/text/badge geometry. Why it matters: a small layout-shift/polish gap on load. **Disposition: left as-is** — minor, low-risk-to-touch, and matches the plan's given code; logged for a future `/impeccable polish` pass rather than reworked here.

- **[P3] No pending count surfaced on the toggle.** What: "Pendentes" has no count, unlike `PetsitterDashboardPage`'s `Pendentes (${pending})`. Fix, if picked up later: show count for faster triage. Not implemented now (would need a lightweight count endpoint or client-side derivation across both filter states).

## Persona Red Flags

**Alex (power-user admin, triaging daily)**: no count on "Pendentes" forces a click just to check if anything's outstanding; no bulk "mark all reviewed" for a backlog. Slower than it needs to be at scale, but acceptable for current suggestion volume.

**Sam (keyboard/screen-reader dependent)**: toggle buttons have no `aria-pressed`/`role="tablist"` — true of every sibling toggle in the app (SearchPage, PetsitterDashboardPage), so this is a systemic, pre-existing gap, not unique to this screen. Not fixed here to avoid an out-of-scope, cross-cutting a11y change in a single-screen task.

## Minor Observations

- Long free-text descriptions have no line-clamp/truncation — acceptable for an admin review context; worth revisiting if suggestions get long.
- Loading state, empty state, and toggle are now fully verified consistent with the rest of the Admin section after the two pre-critique fixes (container width, toggle pattern) and the one critique-driven fix (empty-state helper text).

## Disposition for this task

Two defects found before this formal critique (container width `max-w-4xl` → `max-w-6xl`; toggle using nested `.btn-primary`/`.btn-outline` instead of the established segmented-pill pattern) were fixed and independently re-verified consistent by both Assessment A and B. One additional gap surfaced by Assessment B (missing empty-state helper subtext) was fixed in this same pass. The remaining P1/P2/P3 items are genuine but out of this task's scope (require new backend capability, or are a defensible content-driven layout choice, or are systemic/pre-existing across the app) — logged here as a backlog for future `/impeccable harden` / `/impeccable polish` passes rather than acted on unilaterally.
