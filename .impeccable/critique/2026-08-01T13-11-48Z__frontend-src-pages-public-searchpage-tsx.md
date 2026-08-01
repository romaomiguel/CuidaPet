---
target: "Frontend/src/pages/public/SearchPage.tsx (+3 related files: PetsitterFilters.tsx, PartnerFilters.tsx, LandingPage.tsx — service catalog migration)"
total_score: 8
max_score: 12
na_heuristics: 2,3,5,6,7,9,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-01T13-11-48Z
slug: frontend-src-pages-public-searchpage-tsx
---
Method: dual-agent (A: design-review subagent · B: detector-evidence subagent)

## Scope

This critique covers a scoped data-source migration, not a visual redesign: 4 files were moved from hardcoded service-label constants (`serviceLabels`, `PETSITTER_SERVICES`, `PARTNER_SERVICES_BY_TYPE`) to a shared, React-Query-backed `useServiceCatalog()` hook (`Frontend/src/hooks/useServiceCatalog.ts`), prewarmed by a `queryClient.prefetchQuery(['service-catalog'], ...)` call at app boot (`Frontend/src/main.tsx`).

Files reviewed:
- `Frontend/src/pages/public/SearchPage.tsx`
- `Frontend/src/components/petsitter/PetsitterFilters.tsx`
- `Frontend/src/components/partner/PartnerFilters.tsx`
- `Frontend/src/pages/public/LandingPage.tsx`

## Design Health Score

Scoped to the 3 heuristics this diff materially touches (a pure data-source swap has no basis to move the other 7 in either direction, so they're marked n/a rather than assigned an unearned score):

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | New async dependency in the filter sidebar and active-filter pill has no loading affordance, unlike the results grid two sections over on the same page. |
| 4 | Consistency and Standards | 2/4 | PetsitterFilters/PartnerFilters are internally consistent with each other, but the migration created a new inconsistency against SearchPage's own results-grid loading pattern (`isLoading` → `SkeletonPetsitterCard`). |
| 8 | Aesthetic and Minimalist Design | 4/4 | Migration is copy/data-source only — no new visual elements, no drive-by styling changes, DESIGN.md conformance (pill radios, `badge-green`, `accent-primary-500`) fully preserved. |
| 2,3,5,6,7,9,10 | n/a | Outside this diff's scope — no new error states, navigation, help content, or recall burden introduced by a label-source swap. |
| **Total** | | **8/12 (67%)** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment (Assessment A):** The migration is honestly scoped — no invented styling, no unrelated visual changes. Where it falls short isn't specificity, it's state-completeness: the app already has a designed loading pattern for async lists on this exact page (`SearchPage`'s petsitter/partner results grid), and the migration didn't carry that pattern into the two components it newly made async (`PetsitterFilters`, `PartnerFilters`).

**Deterministic scan (Assessment B):** `detect.mjs --json` returned `[]` (0 findings, exit 0) across all 4 files, verified as a genuine clean run (not a suppressed/erroring one — cross-checked per-file invocations, ignore-rule config, and the CLI's own success/error branching). This is expected: the bundled detector targets visual "design slop" patterns (gradients, glow, marquees, bounce easing, etc.), and this diff introduces none. A clean detector run here is real but out of scope for the actual risk under review — the detector has no rule for "does a loading state exist," so its cleanliness doesn't confirm or contradict Assessment A's finding.

**Visual overlays:** Not available this run. Browser evidence was attempted by Assessment B but skipped: the backend process already listening on `:3000` in this environment serves a stale checkout (`GET /services` → 404, predates the service-catalog feature; `/auth/*` routes work, confirming it's a version mismatch rather than a bug in the reviewed code), and standing up a second, correctly-versioned backend instance for this worktree was judged more than the "trivial/fast" bar set for this critique. No live screenshot or console capture exists for this run; all findings below are from source reading.

## Overall Impression

The migration does exactly what it says: swap the data source, keep the rendering identical. It's a clean, low-risk refactor by the metric it was optimizing for (compiles, no visual drift, `detect.mjs` clean). The one real gap — no loading affordance on the newly-async filter sidebar — is a legitimate finding, but this task's plan explicitly scoped it as an accepted risk: the app-root prefetch (`main.tsx`) is expected to keep the catalog warm before these components mount in the overwhelming majority of real sessions, and the brief did not ask for additional loading-guard code beyond the literal before/after blocks it specified. That tradeoff is reasonable for this task's scope; it is recorded below as backlog, not treated as a blocking defect to fix unprompted in this pass.

## What's Working

1. **Zero invented styling.** The diff is honestly copy/data-source-only; DESIGN.md conformance (pill-shaped radios, `badge-green` tint pair, `accent-primary-500`) carries through untouched — nothing here needed a second look for off-brand drift.
2. **Single dedup'd network request.** All four call sites share `queryKey: ['service-catalog']`, so React Query collapses them into one fetch instead of a request waterfall, even though the hook is called independently in 4 places.
3. **Structural parity between PetsitterFilters and PartnerFilters.** Both consume the same `{slug, name}` shape via `catalog.byAudience(...)`, same "Todos os serviços" placement, same spacing/hover treatment — a clean, faithful 1:1 migration with no divergence between the two sibling components.

## Priority Issues

**[P1] Deep-link raw-slug flash in SearchPage's active-filter pill, contradicting the sidebar's state**
- **Why it matters:** `SearchPage.tsx` seeds `filters.service` straight from the URL on mount (`searchParams.get('service')`), independent of catalog readiness. If the catalog hasn't resolved yet (realistic for a user landing directly on `/buscar?service=banho_e_tosa&city=...` from a shared link, before the boot-time prefetch settles), `catalog.label()` falls back to the raw slug (`useServiceCatalog.ts:20`, `?? slug`) — so the `badge-green` pill briefly shows the literal string `banho_e_tosa` instead of "Banho e Tosa." Worse, in that same window the filter sidebar shows *no* radio selected for that service, because `catalog.byAudience('petsitter')` is still `[]`. The pill and the sidebar disagree about whether a filter is active, in the first second of a fresh visit.
- **Fix:** Gate the pill's text (or its render) on `!catalog.isLoading`, so it appears once already resolved rather than rendering-then-relabeling.
- **Status for this task:** Not fixed in this pass — explicitly out of scope per this task's brief, which relies on the app-root prefetch as mitigation and specified no additional loading-guard code. Recorded here for a future `/impeccable polish` or dedicated follow-up.
- **Suggested command:** `/impeccable polish`

**[P1] No loading placeholder in PetsitterFilters/PartnerFilters "Serviço" radio list — layout shift + inconsistency with the page's existing async pattern**
- **Why it matters:** `catalog.byAudience(...)` is `[]` until the query resolves, so on a cold mount the "Serviço" block renders only the always-present "Todos os serviços" radio, then jumps to N+1 rows once data lands — a layout shift directly under wherever the user's cursor/thumb is, in a control region they're actively about to use (more disruptive than a passive content shift). It's also a new inconsistency: `SearchPage.tsx` already has a designed loading state for its own results grid (`isLoading` → `SkeletonPetsitterCard`) but the sidebar, newly made async by this same migration, has no equivalent.
- **Fix:** Branch on `catalog.isLoading` and render 2-3 placeholder rows with the existing `Skeleton` primitive (`Frontend/src/components/ui/Skeleton.tsx`) inside the same `space-y-2` wrapper, reserving height.
- **Status for this task:** Not fixed in this pass — same rationale as above (explicit scope decision, prefetch as mitigation).
- **Suggested command:** `/impeccable polish`

**[P2] LandingPage hero `<select>` has the same cold-catalog gap, lower stakes**
- **Why it matters:** Same root cause, but a `<select>` with only its placeholder option is a familiar, low-anxiety pattern (no layout shift — fixed height regardless of option count), unlike a popping-in radio list.
- **Fix:** `disabled={catalog.isLoading}` on the `<select>` so a user opening it in the brief window doesn't see an empty dropdown and assume it's broken.
- **Status for this task:** Not fixed in this pass — same scope decision.
- **Suggested command:** `/impeccable polish`

**[P3] No accessibility signal that the "Serviço" radio group is still populating**
- **Why it matters:** Sighted users at least see the row count change; screen-reader users get no equivalent cue.
- **Fix:** `aria-busy={catalog.isLoading}` on the wrapping `<div>` in both filter components, ideally alongside the P1 skeleton fix.
- **Suggested command:** `/impeccable audit` (accessibility pass)

**[P3] `label()`/`emoji()` fallback conflates two different situations**
- **Why it matters:** `useServiceCatalog.ts:20-21` uses the same fallback (`?? slug`, `?? '🐾'`) for "catalog still loading" and "slug legitimately retired/unknown" (the case the hook's own doc comment describes). Callers can't distinguish the two without separately checking `catalog.isLoading` themselves.
- **Fix:** Consider an `isLoading`-aware variant or exposing found/not-found state explicitly.
- **Suggested command:** `/impeccable harden`

## Persona Red Flags

**First-time visitor from a shared link** (e.g. a WhatsApp link to `/buscar?service=banho_e_tosa&city=Curitiba`, mobile data): on a cold catalog, sees a pill reading the literal string `banho_e_tosa` — a code-looking fragment — while the sidebar simultaneously shows no service selected. Two visible signals of the same filter, disagreeing, in the first second of the page. Directly undercuts the "Trusted Playdate" polish DESIGN.md is built around.

**Slow-connection mobile user opening the filter drawer:** the mobile filters drawer is one of the most-interacted-with surfaces on `/buscar`. On throttled connections, tapping into "Serviço" during the empty window shows only "Todos os serviços" with no spinner/skeleton — unlike the results panel on the same screen, which explicitly says "Buscando..." with skeleton cards. The asymmetry reads as "this part is broken," specifically because the app already trained the user, on the same screen, to expect a loading signal.

## Minor Observations

- Detector run was clean (0 findings) across all 4 files — expected for a copy-only migration and corroborated manually (no gradient/glow/marquee/bounce patterns present).
- No `false-positive` detector findings to reconcile since none fired.
- Structural parity between `PetsitterFilters` and `PartnerFilters` is exemplary; the only difference (`name="service"` vs `name="partner-service"`) is intentional and correct (prevents radio-group collision), not a divergence.

## Questions to Consider

- Is the app-root prefetch's coverage of this risk actually verified for the deep-link case (landing directly on `/buscar?service=...` before the shell has mounted long enough for the prefetch to resolve), or is it assumed? A quick network-throttled manual test would settle Assessment A's P1 finding either way.
- If a future pass adds the skeleton/`isLoading` guards recommended above, should that become a small reusable pattern (e.g. a `<ServiceRadioList catalog={catalog} .../>` component) so `PetsitterFilters` and `PartnerFilters` don't each reimplement the same guard independently?
