---
target: MatchResults/CardPartner/CardPetsitter service-catalog label migration - flash risk review
total_score: 0
max_score: 0
na_heuristics: 1,2,3,4,5,6,7,8,9,10
p0_count: 0
p1_count: 0
timestamp: 2026-08-01T00-37-46Z
slug: frontend-src-pages-tutor-matchresults-tsx
---
Method: dual-agent (A: general-purpose subagent a36c27dfd427e0987 · B: general-purpose subagent af439b02e29c30ecc)

## Scope note

This is a narrow, scoped critique — not a full new-surface design review. Task 6 of the dynamic-service-catalog migration plan replaced a static `serviceLabels[slug]` object lookup with `catalog.label(slug)` from the new `useServiceCatalog()` hook (React Query-backed, `staleTime: 5min`) in three presentational components: `MatchResults.tsx`, `CardPartner.tsx`, `CardPetsitter.tsx`. The brief's single explicit question: can a raw slug (e.g. `passeio_noturno`) visibly flash instead of a human label (`Passeio Noturno`) on first paint, given none of these three components has its own loading guard around the catalog fetch? Full Nielsen heuristic table and design-specificity scoring are not meaningful for a 3-file behavioral migration and were intentionally skipped, per the narrow scope both sub-agents were given.

## Verdict: Real risk, not theoretical — P2 severity

Both independent assessments agree: the flash is a genuine, reachable code path today, not a hypothetical edge case, though it is low severity because it is transient and self-correcting.

### Why it's real (not just "in theory")

- `useServiceCatalog()` (`Frontend/src/hooks/useServiceCatalog.ts`) has **no app-root warming call**. A repo-wide check shows exactly four call sites: `CardPetsitter.tsx`, `CardPartner.tsx`, `MatchWizard.tsx`, `MatchResults.tsx`. Whichever of these mounts first in a session is the one that triggers the `['service-catalog']` fetch — there is no `QueryClient` `initialData`/prefetch for it in `Frontend/src/main.tsx`, and no root-shell call.
- `serviceCatalogService.list()` hits a real network endpoint (`GET /services`), so first load always carries genuine latency, not bundled/static data.
- `label(slug)` has an unconditional fallback: `services.find(...)?.name ?? slug` — it does not consult `isLoading`, so during the fetch window it returns the raw slug, not a placeholder.
- Realistic **cold-cache entry points** exist and are ordinary user paths, not contrived ones:
  - `LandingPage.tsx` ("Petsitters em destaque") renders `CardPetsitter` gated only by its own unrelated `['petsitters','featured']` query — for a brand-new session, the home page can be the very first thing that ever triggers the catalog fetch, with the badge row committing to the DOM before it resolves.
  - `SearchPage.tsx` renders `CardPetsitter`/`CardPartner` gated by its own list query, again independent of catalog state; `/buscar` is directly bookmarkable/shareable, no dependency on visiting `LandingPage` first.
  - `MatchResults.tsx` is reachable via a query-param URL independent of `MatchWizard` (shareable/bookmarkable match-results link).
- **`MatchResults.tsx`'s own loading gate does not cover the catalog query.** The `match`/`partner-match` queries (lines ~140-153) and the catalog query are three independent `useQuery` calls with no `enabled` relationship. `isLoading` (used for the page's loading return) is derived only from the first two. `catalog.label(service)` is called unguarded at the partner-flow summary line and at the petsitter-flow summary-parts line. Today it "usually" doesn't flash only because the match/partner endpoint is plausibly heavier than a plain `GET /services` — incidental backend-timing luck, not an enforced ordering.
- In-session mitigation exists but is partial: a user who goes Landing → Match Wizard → Match Results in one sitting likely has a warm cache by the time `MatchResults` mounts (the wizard interaction takes real seconds). This does **not** help the direct-link/bookmark/refresh/first-page-of-session cases, which are ordinary, not edge-case, navigation patterns for a search-results or match-results URL.

### Detector (Assessment B) findings

- `node detect.mjs --json` on the three files: **exit 0, `[]`** — zero rule violations. Re-verified with `--no-config` to rule out suppression via `.impeccable/config.json`/`config.local.json`; same empty result. No inline `impeccable-disable` comments.
- This is expected, not a false negative: the mechanical detector is a static styling/anti-pattern scanner (spacing, color, type, motion, copy) with no rule category for React Query loading-state races. The detector being silent here doesn't clear the finding — it's simply out of the tool's domain.

### Browser evidence — not obtained, reason stated

Assessment B found a Vite dev server and NestJS backend already running from this worktree, but the backend's compiled `dist/` predated the `ServicesController`/service-catalog feature entirely (`GET /services` returned 404). B rebuilt the backend (`npm run build`, non-destructive — `prisma generate` only regenerates the client, no migrations/DB writes) to get a fresh `dist/`, but restarting the already-running backend process to serve it was blocked by the permission classifier, and B correctly stopped rather than routing around the denial. Net effect: no live repro; the finding rests on static trace of the render path (confirmed above) rather than an observed DOM screenshot. `git status` after B's work shows only the three intended source files modified — no stray artifacts.

## Strengths

1. Clean centralization — `label()`/`emoji()`/`byAudience()` replace scattered static-object indexing with one hook; all three migrated files use the identical `catalog.label(slug)` call pattern consistently.
2. Defensive fallback (`?? slug`) avoids a crash or blank UI on an unresolved catalog — a reasonable engineering default, even though it's also the literal source of the flash.
3. `staleTime: 5 * 60 * 1000` is well-tuned for near-static reference data, avoiding refetch spam once the cache is warm.

## Issues found

- **[P2] Raw-slug flash on cold cache in `CardPartner`/`CardPetsitter`.** Reachable via `LandingPage.tsx` (first-ever page view of a session) or a direct/bookmarked `/buscar` visit. Neither component reads `catalog.isLoading` before rendering `catalog.label(s)`.
  - **Why it matters**: this is the literal question the migration's authors flagged as a risk; it's most visible to a brand-new visitor on their very first screen — the worst moment for an internal-identifier string to leak through, since there's no established trust yet to read it as "probably just loading."
  - **Fix (not applied in this task — explicitly out of scope per the task brief, which asked for label-source swap only, not new loading UI)**: warm the shared cache once at the app root (single `useServiceCatalog()` call or `queryClient.prefetchQuery(['service-catalog'], ...)` in the top-level layout/App shell), which fixes all three files with one change; or, per-component, gate the badge row on `catalog.isLoading` with a small skeleton pill.
  - **Suggested command**: `/impeccable harden` (loading-state/edge-case hardening) — a natural fit for a later task in this plan, not this one.

- **[P2] `MatchResults.tsx` catalog labels aren't actually protected by the page's own loading gate**, despite reading as if they might be. The match/partner-match queries and the catalog query are independent and unguarded relative to each other; today's "usually fine" behavior is incidental backend-timing luck.
  - **Fix (deferred, same reasoning as above)**: fold `catalog.isLoading` into the page's existing `isLoading` derivation.

- **[P3] Partial-migration inconsistency, same surface.** `SearchPage.tsx` still uses the old static `serviceLabels[...]` object for active-filter-chip text, sitting right next to `CardPartner`/`CardPetsitter`, which now use the async `catalog.label()`. One label source on the same screen is instant/static, the other can lag. This is expected mid-migration debt (later tasks in the plan migrate `SearchPage.tsx`), not a new defect introduced by this task, but worth naming so it isn't mistaken for done.

- **[P3] No skeleton/placeholder specifically for the service badges during the catalog gap**, unlike the list-level skeleton (`SkeletonPetsitterCard`) used for the parent query. When the flash does occur, it reads as a bug rather than a deliberate loading state.

## Persona red flag

**First-time visitor arriving via a shared/bookmarked link** (e.g. a `/buscar?tab=clinica&city=...` or `/match-results?...` link shared by a friend, or simply landing on `/` fresh): no `LandingPage`/`MatchWizard` visited first in that session, so `['service-catalog']` has never been queried before `CardPartner`/`CardPetsitter`/`MatchResults` mount. This user has a real, non-contrived chance of seeing `passeio_noturno`-style raw slugs on the very first screen of the product they ever see.

## Minor observations

- The detector's clean pass and B's environment blocker are both worth recording for future critique runs on this surface: any future `/impeccable audit` or live browser pass on these three files will need the backend rebuilt/restarted first (`Backend/dist` was stale relative to `src/services/services.controller.ts` at review time — separate from anything this task touched).

## Disposition for this task (Task 6)

Per the task brief and orchestrating instructions, Task 6's scope is the label-source swap only (`serviceLabels[slug]` → `catalog.label(slug)`) with **no new loading UI** added to these three files — `label()`'s slug fallback is an accepted, known tradeoff for this step, not a bug to fix here. This critique's finding that the tradeoff carries a real (not just theoretical) P2-level user-visible cost is recorded for the backlog (cache-warming at app root, or a `catalog.isLoading` guard) rather than acted on in this commit.
