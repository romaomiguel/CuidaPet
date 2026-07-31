---
target: Frontend/src/pages/public/SearchPage.tsx (3-tab toggle + PartnerFilters)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-31T14-34-40Z
slug: frontend-src-pages-public-searchpage-tsx
---
Method: dual-agent (A: afcd677a7b8aa3a48 · B: ae6d5c8c7fa5b8eb0)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Stale cross-tab filter pills (before fix) directly misrepresented current state |
| 2 | Match Between System and Real World | 4 | pt-BR labels, correct domain terms, locale-appropriate placeholder ("Cuiabá") |
| 3 | User Control and Freedom | 3 | Reset works for both filter sets; tab switch previously left the other tab's state leaked (fixed) |
| 4 | Consistency and Standards | 3 | Active-tab styling matches 2 other in-app segmented-control instances (PetsitterDashboardPage, PetsitterProfilePage); missing shadow was the one deviation (fixed) |
| 5 | Error Prevention | 3 | Good per-tab loading/error/empty branching |
| 6 | Recognition Rather Than Recall | 3 | Sticky sidebar, always-visible result count and filters |
| 7 | Flexibility and Efficiency | 3 | URL sync exists for petsitter filters but not yet for partner filters (known gap, not fixed this pass) |
| 8 | Aesthetic and Minimalist Design | 3 | PartnerFilters' intentional slimness (no price/rating) is a good minimalist call |
| 9 | Error Recovery | 3 | Distinct, well-worded error/empty copy per tab, with recovery actions |
| 10 | Help and Documentation | 2 | No inline help distinguishing why partner filters are shorter than petsitter filters |

**Total: 29/40 (Good, pre-fix baseline)** — the two P1s below were fixed after this score was computed; re-running critique would likely land higher on heuristics 1 and 3.

## Design Specificity Verdict

**LLM assessment (Assessment A):** The active/inactive tab treatment is not invented for this feature — it reuses the app's existing segmented-control language (`bg-white text-primary-700 shadow-sm` / `text-muted hover:text-primary-600`) byte-for-byte from `PetsitterDashboardPage.tsx` and `PetsitterProfilePage.tsx`. Using blue rather than gold for the active tab is correct per the Sparing Gold Rule (gold stays reserved for the "Match ideal" CTA). One design-specificity gap noted: `utils/index.ts` already defines `PROVIDER_TYPE_OPTIONS` (with 🐕/🏥/🛍️ emoji) explicitly documented as being for "o toggle de tipo na busca manual" — this exact toggle — but the toggle was hand-authored with plain text labels instead, per the task's locked implementation brief. Left as-is deliberately: the brief's plural copy ("Cuidadores/Clínicas/Petshops", appropriate for a browse-multiple context) differs from the constant's singular labels ("Petsitter/Clínica/Petshop"), so swapping would silently change approved copy — flagged for a future pass rather than auto-applied.

**Deterministic scan (Assessment B):** `detect.mjs --json` against both target files returned `[]`, exit code 0 — no static anti-patterns in the reviewed diff itself. A live-DOM browser overlay (`detect.js` injected via `live-server.mjs`) fired 7 rule hits on the full rendered `/buscar` page (overused-font, gradient-text, bounce-easing, 2x shape-assembled-illustration, dark-glow, image-hover-transform), but Assessment B could not attribute any of them to `SearchPage.tsx`'s new toggle or `PartnerFilters.tsx` (which has no SVG/img/gradient at all) — flagged as likely global-app-chrome noise, not a defect in this diff.

**Visual overlays:** No user-visible browser overlay was left running — the live-server used for injection was stopped after the console read, per protocol.

## Overall Impression

The 3-tab toggle correctly reuses an established in-app pattern rather than inventing a new one, and `PartnerFilters` is a clean, faithful sibling of `PetsitterFilters`. The real problems were not visual but state-management correctness bugs: switching tabs left the previous tab's filter chips floating over the new tab's results, and two mobile-only surfaces (the result-count CTA and the filter-active dot) were hardcoded to the petsitter count/state regardless of which tab was active. All three were fixed in this pass.

## What's Working

1. Tab active/inactive styling is a faithful reuse of the app's existing segmented-control pattern (two other instances in the codebase), not a one-off invention — genuine consistency and brand specificity.
2. `PartnerFilters` mirrors `PetsitterFilters`'s header (icon + title + result count + conditional reset), radio-list markup, and spacing rhythm closely; the missing price/rating sections read as a deliberate, correct omission for a business type with no price/rating fields, not a broken layout.
3. Per-tab loading/error/empty states are distinct and well-worded (e.g. "Nenhuma clínica encontrada" vs "Nenhum petshop encontrado" vs "Nenhum petsitter encontrado"), each with an appropriate recovery action.

## Priority Issues

- **[P1] Stale cross-tab filter pills** — What: the "Active filter pills" strip rendered unconditionally from petsitter `filters` regardless of active tab, so a price/rating chip set on Cuidadores kept floating over Clínicas/Petshops results (entities with no price/rating fields). Why it matters: reads as a visible bug to a first-time user, undermining trust that the UI reflects real state. Fix: gated the strip by `tab`, added an equivalent city/service-only pill strip sourced from `partnerFilters` for the partner tabs. **Fixed** in `SearchPage.tsx`.
- **[P1] Mobile drawer CTA and filter-dot hardcoded to petsitter state** — What: the mobile "Ver X resultados" button always read `petsitters.length`, and the `SlidersHorizontal` filter-active dot only checked `filters`, regardless of active tab. Why it matters: on Clínicas/Petshops, a mobile user sees the wrong result count on the exact button they're about to tap, and an active partner filter never lights up the indicator. Fix: both now branch on `tab`. **Fixed** in `SearchPage.tsx`.
- **[P2] Tab track missing shadow present on sibling instances** — What: the two other in-app instances of this segmented-control pattern (`PetsitterDashboardPage.tsx`, `PetsitterProfilePage.tsx`) add `shadow-sm`/`shadow-inner` to the track div; this new instance omitted it, reading as a flatter, less-finished version of the app's own established component. Fix: added `shadow-sm` to the track. **Fixed** in `SearchPage.tsx`.
- **[P2] Toggle hand-rolls labels instead of reusing `PROVIDER_TYPE_OPTIONS`** — What: `utils/index.ts` already defines a shared constant (with emoji) explicitly documented for this exact toggle; the implementation duplicates the tri-choice with plain text instead. Why it matters: a second source of truth that can drift, and loses the emoji warmth used one screen over in MatchWizard. Not fixed: the constant's singular labels differ from the brief's deliberate plural copy ("Cuidadores" vs "Petsitter"); swapping would silently alter approved copy. Suggested command: `/impeccable clarify` (copy/label consistency across MatchWizard and Search).
- **[P3] No ARIA tab semantics** — What: none of the three in-app instances of this segmented-control pattern (this one included) use `role="tablist"`/`role="tab"`/`aria-selected`. Why it matters: screen-reader users get three unlabeled buttons with no "tab 2 of 3, selected" announcement. Pre-existing, systemic — not unique to this change. Suggested command: `/impeccable audit` (accessibility pass across all segmented-control instances).

## Persona Red Flags

**Jordan (First-Timer):** Previously, tapping Clínicas could show a leftover rating/price chip from Cuidadores still floating over clinic listings — read as a bug, not an intentional feature boundary (fixed). Separately, the bare-text tabs (no emoji, no reuse of `PROVIDER_TYPE_OPTIONS`) give no visual reinforcement that this is a playful, warm bilateral marketplace moment — it looks like a generic dashboard toggle (open item).

**Casey (Distracted Mobile User):** Previously, opening the mobile drawer on a partner tab and tapping the bottom CTA showed the wrong result count (fixed). Because `PartnerFilters` is legitimately shorter than `PetsitterFilters` (2 fields vs 4), the drawer height still visibly shrinks tab-to-tab with no copy explaining why — for someone skimming, it can still read as "half my filters vanished" rather than "this business type doesn't have those fields" (open item, low severity).

## Minor Observations

- `serviceLabels` / `PARTNER_SERVICES_BY_TYPE` / `PETSITTER_SERVICES` are cleanly shared single sources of truth between the two filter components.
- `partnerFilters` (city/service) is never synced to `searchParams` — the existing `useEffect` only watches `filters`. A shared/reloaded link loses partner-tab filter state on Clínicas/Petshops even though it's preserved for Cuidadores. Not fixed this pass (out of the task's bounded scope); worth a follow-up alongside heuristic #7.
- `CardPartner`'s footer/badge placement matches `CardPetsitter`'s conventions closely — no complaint there.
- Live-DOM detector overlay fired 7 rule hits, but Assessment B could not attribute any to the reviewed files (no SVG/img/gradient in `PartnerFilters.tsx`); treated as page-wide noise, not a defect in this diff.

## Questions to Consider

- Should the Search page's tri-tab toggle switch to `PROVIDER_TYPE_OPTIONS` (with emoji) to match MatchWizard's tone, or is the current plural copy ("Cuidadores/Clínicas/Petshops") intentionally distinct enough to justify keeping a second, hand-authored label set?
- Now that a third instance of the segmented-control pattern exists, is it worth extracting a shared `<SegmentedTabs>` component with built-in ARIA semantics, rather than three independent copies drifting further apart?
- Should partner-tab filters (`partnerFilters`) get the same URL-sync treatment as petsitter filters, so a filtered Clínicas/Petshops search is shareable/refreshable?
