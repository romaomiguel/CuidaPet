---
target: Frontend/src/pages/admin/AdminServicesPage.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-01T14-53-48Z
slug: frontend-src-pages-admin-adminservicespage-tsx
---
Method: dual-agent (A: aff4621ce28a98e0f · B: a34a9bd7b9120703d)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Toasts + loading skeleton present; no inline indicator of which row is being edited once scrolled away from the form. |
| 2 | Match Between System and Real World | 3 | "Aposentar" (retire) is correct, domain-appropriate PT-BR, distinct from a hard delete. |
| 3 | User Control and Freedom | 2 | Retire fires instantly on click, no confirm step, no undo affordance beyond re-finding the row and clicking "Reativar." |
| 4 | Consistency and Standards | 2 | Diverges from `AdminUsersPage`'s established confirm+color pattern for the same class of status-toggle action; `badge-blue` applied uniformly to all three audience values, unlike `AdminPartnersPage` where badge hue maps to type. |
| 5 | Error Prevention | 1 | No confirmation, no visual differentiation from "Editar," and no warning that the service may already be selected on live partner/petsitter profiles. |
| 6 | Recognition Rather Than Recall | 2 | "Editar" opens a detached top-of-page form with no scroll-to or highlight linking it back to the row that triggered it. |
| 7 | Flexibility and Efficiency of Use | 2 | No search/filter-by-name for a catalog that will grow past a screenful; no bulk actions; new-service form always defaults to `audience: 'petsitter'` regardless of the active filter tab. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean single-list, single-form composition; nothing competes for attention. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 2 | Field errors are terse ("Obrigatório"); no server-error detail beyond a generic toast. |
| 10 | Help and Documentation | 1 | No in-context explanation that retiring only hides a service from *new* pickers while it silently persists on existing profiles/bookings. |
| **Total** | | **21/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Structurally on-brand — the screen correctly reuses `.card`, `.btn-primary`/`.btn-outline`, `.badge-*`, `Skeleton`, the react-hook-form+zod pattern, and the pill filter-tab composition lifted from `AdminServiceSuggestionsPage`. But it's a shallow copy rather than an authored screen: it skips a precedent its own sibling already set for the *same class of interaction* — `AdminUsersPage`'s suspend/reactivate toggle uses `window.confirm()` plus color-differentiated buttons, while this screen's "Aposentar" (materially similar — a status toggle on a live catalog item other profiles depend on) is a bare, unconfirmed, undifferentiated `btn-outline` click, and it ignores the design system's own `.btn-danger` class entirely. It reads as "the right Lego bricks assembled" rather than a screen someone thought through for its actual stakes (a live product catalog other records reference).

**Deterministic scan:** `detect.mjs --json` ran clean against all three changed files (`AdminServicesPage.tsx`, `App.tsx`, `Sidebar.tsx`) — exit code 0, zero findings, no false positives to adjudicate. Supplementary manual code-evidence (since no dev server was available for browser injection) found: (1) the retired-row visual state relies solely on `opacity-60` with no non-color/aria cue beyond the "Aposentado" badge text itself — a softer signal than ideal but not a pure color-only violation since the badge does carry text; (2) `toggleActive`, "Editar," "Novo serviço" have no per-action loading/disabled guard, so a user can double-click "Aposentar"/"Reativar" while a prior request is in flight (only the submit button in the form and the initial-load skeleton have guards); (3) icon usage, key props, semantic form markup, and absence of inline styles/hardcoded colors are all clean.

**Visual overlays:** Not available — no dev server was running in this isolated evaluation context, so browser injection was skipped per the skill's own fallback rule. No user-visible overlay exists for this run; the findings above rest on CLI scan plus static code reading only.

## Overall Impression

The screen is competently assembled and will not look out of place next to its siblings — visually it passes. The real gap is in the one interaction that actually matters: retiring a service is a status change with downstream consequences (existing partner/petsitter profiles may already reference it), and the screen treats it exactly like a cosmetic toggle, with no confirmation, no visual weight difference from "Editar," and no explanation of what it actually does. The single biggest opportunity is closing that gap — the fix is small (a confirm step + `.btn-danger` styling, both already available in this codebase) but the current state is a real error-prevention hole on a page an admin will use to manage a catalog other live records depend on.

## What's Working

- The list row's emoji + name/description + audience/status badge layout is a good, compact, PetUno-specific IA for a catalog, consistent with the `.card`/`truncate` visual language used elsewhere in the admin suite.
- The filter-pill + inline-toggle-form pattern is lifted verbatim from `AdminServiceSuggestionsPage`, so the mental model transfers instantly for anyone who has used that sibling screen already.
- Zod validation is correctly wired through react-hook-form with inline field errors, matching the validation pattern used across the rest of the admin screens — no ad hoc reimplementation.

## Priority Issues

**[P0] No confirmation on "Aposentar" despite an existing sibling precedent.**
Why it matters: retiring fires immediately on click and deactivates a service that, per `useServiceCatalog`'s own doc comment, may already be selected on live partner/petsitter profiles — with no undo path signposted anywhere in the UI. `AdminUsersPage` already solved this exact class of problem with `window.confirm()` on its suspend/reactivate action; this screen skips that pattern for a materially similar, higher-stakes action.
Fix: add a confirm step (native `window.confirm` for parity with `AdminUsersPage`, or a lightweight modal) that names the consequence explicitly before firing `toggleActive`.
Suggested command: `/impeccable harden`

**[P1] "Editar" and "Aposentar" are visually identical, undifferentiated actions.**
Why it matters: both are the same `btn-outline` pill, same weight, side by side in a dense action cluster — nothing signals that one is a benign edit and the other is a consequential status change. This is heuristic #5 (error prevention) failing concretely, not abstractly: a mis-click between two adjacent, visually-equal buttons is a real risk.
Fix: use the design system's own `.btn-danger` (or the muted-red treatment `AdminUsersPage` already uses) for the retire action so it reads as a different class of action at a glance.
Suggested command: `/impeccable polish`

**[P1] Editing detaches from the row that triggered it.**
Why it matters: "Editar" opens the form at the top of the page with no scroll-to and no highlight tying it back to the originating row — fails recognition-over-recall (#6) and the single-focus cognitive-load check. This gets materially worse once the catalog grows past one screen.
Fix: scroll the form into view and highlight/label it with the service being edited on edit-start, or move to inline/row-expansion editing instead of a detached top-of-page form.
Suggested command: `/impeccable clarify`

**[P2] Retiring's real effect is never explained.**
Why it matters: nothing in the UI tells the admin that retiring only removes a service from *new* selection pickers while it silently persists on profiles/bookings that already reference it — a false mental model of the action's scope, directly relevant on an Operate surface where accurate system status is the point (#1, #10).
Fix: add a one-line caption or tooltip near the retire action stating the actual scope of the effect.
Suggested command: `/impeccable document`

**[P3] Long names/descriptions truncate with no fallback to read the full text.**
Why it matters: the form allows up to 60-char names and 300-char descriptions, but the list row uses `truncate` on both with no `title` attribute or expand affordance — the exact edge case the field limits themselves invite becomes unreadable in the list.
Fix: add `title={s.name}` / `title={s.description}`, or an expand-on-hover/click affordance for long values.
Suggested command: `/impeccable polish`

## Persona Red Flags

**Alex (Power User):** No search/filter-by-name for what will become a growing catalog — only a 4-way audience pill filter. Also, creating a new service always defaults to `audience: 'petsitter'` regardless of which filter tab is currently active, forcing a redundant re-select every time Alex is working within a filtered `clinica` or `petshop` view. No bulk actions (e.g. bulk-retire) exist for managing a catalog at scale.

**Sam (Accessibility-Dependent):** The service emoji is correctly `aria-hidden="true"`, but nothing replaces it for a screen-reader user — no accessible name conveys "this service has an emoji" at all, and the truncated name/description have no accessible full-text alternative for anyone relying on visible text matching what a screen reader announces (e.g. low-vision users pairing magnification with partial screen-reader use).

**Priya (Time-Pressured Admin/Ops, project-specific):** PetUno's admin flow (per PRODUCT.md) is "manage users, petsitters, support messages, and B2B partner accounts" — someone skimming a long, growing catalog quickly is exactly who the no-confirm "Aposentar" flow bites hardest: one wrong tap silently drops a live service out of new-partner/petsitter pickers with no lasting on-screen signal beyond a toast that's already gone by the time anyone notices something changed.

## Minor Observations

- `emoji` field validation only checks string length (1–8 chars) — plain text like "novo" passes zod validation but breaks the `text-2xl` emoji-slot visual treatment in the list row.
- Retired rows use `opacity-60` dimming, a treatment `AdminPartnersPage`'s suspended-partner rows don't use (they stay full-opacity, badge-only) — a new, undocumented visual convention for "inactive" that diverges from the closest sibling pattern.
- `badge-blue` is applied uniformly to all three audience values (petsitter/clinica/petshop), unlike `AdminPartnersPage` where badge hue maps to a stable type-meaning (`badge-brand` for clinica, `badge-blue` for petshop) — inconsistent color semantics for a comparable "type" badge across sibling screens.
- No per-action loading/disabled guard on `toggleActive`, "Editar," or "Novo serviço" (only the form's submit button and the initial skeleton have guards), so rapid double-clicks on a row action are possible while a request is in flight.

## Questions to Consider

- If "Aposentar" only affects future selection and not existing profiles, is "retire" even the right mental model to present to admins — should the label and confirmation copy instead say "hide from new listings" to match what the action actually does?
- `AdminPartnersPage` uses a similar inline top-of-page form pattern for partners — has that been tested at 30+ rows, where the detachment-from-row problem this screen inherits would actually start to bite?
- Given `.btn-danger` already exists in this design system, was skipping it for "Aposentar" a deliberate call that retiring isn't dangerous, or an oversight from copying `AdminServiceSuggestionsPage`'s neutral action button?
