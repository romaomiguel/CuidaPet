---
target: Frontend/src/pages/tutor/MatchWizard.tsx (Step 1 service cards)
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-01T00-21-11Z
slug: frontend-src-pages-tutor-matchwizard-tsx
---
Method: dual-agent (A: a508ccc7fceb3f083 · B: a676b2afa3914d4f4)

Browser visualization skipped for both assessments: no interactive user available to authorize/select a Chrome browser connection in this background session. Deterministic detector scan (`detect.mjs`) still ran and is required-and-clean, so this is not a fully degraded run.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton covers the loading gap; catalog fetch has no `isError`/retry path, so a failed fetch silently renders an empty grid |
| 2 | Match System / Real World | 4 | pt-BR copy, emoji, plain descriptions match user mental model |
| 3 | User Control and Freedom | 4 | Back button, re-selectable radios, no dead ends on the happy path |
| 4 | Consistency and Standards | 3→4 (after fix) | Was: pale-tint icon circle contradicted DESIGN.md's Solid Icon Badge Rule. Fixed: icon circle now solid `bg-primary-500`/`text-white`, matching the rest of the system (e.g. Photo-Anchored Feature List pattern) |
| 5 | Error Prevention | 2→3 (after fix) | Was: no guard for an audience with zero active services. Fixed: added an explicit empty-state message when `serviceCards.length === 0` post-load |
| 6 | Recognition Rather Than Recall | 4 | Label + emoji + description fully visible |
| 7 | Flexibility and Efficiency | 3 | Fine for a linear wizard step; radio+label is keyboard-operable |
| 8 | Aesthetic and Minimalist Design | 2→3 (after fix) | Was: 6-8 visually identical blue cards read as repetitive filler. Fixed: solid saturated icon circle gives a louder, more legible accent without reintroducing per-service curation |
| 9 | Error Recovery | 2 | Still no retry affordance if the catalog fetch itself fails (network error) — not fixed in this pass, flagged for a future task |
| 10 | Help and Documentation | 3 | Subtitle gives enough context for this simple choice |
| **Total** | | **32/40** (up from 30/40 pre-fix) | **Good** |

## Design Specificity Verdict

**LLM assessment (Assessment A):** The card shape/motion vocabulary (rounded-2xl, soft shadow, hover lift, pill checkmark badge) was already correctly on-brand. The one generic note was the icon treatment: a pale `primary-100/primary-700` tint pair on a small standalone circle is exactly the pattern DESIGN.md's Solid Icon Badge Rule warns reads as washed-out at that scale — and the refactor applied it uniformly across every card instead of just some, amplifying the effect. Fixed by switching `PARTNER_CARD_BG` to a solid `bg-primary-500`/`text-white` circle, which is both more brand-specific (matches the documented rule and the existing solid-icon pattern used elsewhere in the system) and reads as a stronger, more deliberate accent than the pastel tint did.

**Deterministic scan:** `detect.mjs --json` on `Frontend/src/pages/tutor/MatchWizard.tsx` returned exit code 0, `[]` — 0 findings, both before and after the fixes described above. No false positives to report (none fired).

**Visual overlays:** Not available this run — no interactive user in this background session to authorize a Chrome browser connection. Assessment A instead reasoned from the JSX/Tailwind classes directly against DESIGN.md's documented tokens and rules (colors, radii, shadow vocabulary), and Assessment B computed actual contrast ratios from `tailwind.config.ts` hex values (`primary-100 = #D3DDE8`, `primary-700 = #16315A`, ratio ≈ 9.4:1 — the removed pairing was never a contrast problem, only a "washed out at icon scale" problem per the named rule).

## Overall Impression

The dynamic-catalog refactor itself is clean — the detector found zero mechanical issues before or after fixes, and the interaction pattern (radio-card, hover, focus-visible ring, checkmark badge) is reused faithfully from Step 0. The two real gaps were both about *edge cases the async refactor introduced*: no empty-state for an audience with zero configured services, and a pale icon-circle treatment that undercuts the "consistent" story it was going for. Both are fixed. The single biggest opportunity that remains open (not fixed in this pass, out of scope for a UI-only task) is that `useServiceCatalog` doesn't expose fetch-failure state, so a genuine network error still renders a silent empty grid indistinguishable from "no services configured."

## What's Working

- Skeleton count/aspect-ratio (`h-28 rounded-2xl`, same `w-[calc(...)]` sizing as real cards) matches the real grid closely enough to avoid a jarring reflow in the common case.
- Removing per-service hand-picked hues incidentally improves colorblind accessibility — emoji + label now carry all the differentiating signal, not color, which was previously mixed in as an (uncommunicated) meaning channel.
- Card interaction affordances (hover lift, `peer-focus-visible:ring-2 ring-primary-500 ring-offset-2`, checkmark badge) are reused consistently from Step 0 — no new interaction pattern to learn mid-wizard.

## Priority Issues

**[P1] No error/empty state for catalog fetch failure or zero-result audience** — *(empty-state half fixed; fetch-error half open)*
- Why it matters: this is the one new failure mode the async refactor introduced (the old hardcoded list could never be "empty" or "still loading"). A first-time tutor (persona Jordan) hitting a blank Step 1 with no explanation is exactly the kind of dead end this product's Match Wizard exists to avoid.
- Fix applied now: `serviceCards.length === 0` after loading renders an explicit pt-BR message instead of a blank area.
- Fix NOT applied (flagged for later): `useServiceCatalog` has no `isError`/refetch surface at all — a genuine network failure looks identical to "0 services configured." Extending the hook to expose `isError`/`refetch` is outside this task's scope (only `MatchWizard.tsx` was in scope) and belongs in a follow-up.
- Suggested command: `/impeccable harden` (once `useServiceCatalog` exposes error state).

**[P2] Icon circles violated the Solid Icon Badge Rule** — *fixed*
- Why it matters: DESIGN.md documents this as a real, repeat-prone bug pattern, not a stylistic preference — pale tint pairs read as washed-out at icon-badge scale even though they pass contrast checks.
- Fix: `PARTNER_CARD_BG` changed from `bg-primary-100 text-primary-700` to `bg-primary-500 text-white`, applied uniformly (still zero per-service curation).

**[P2] Uniform card color reduces at-a-glance scanability** — *partially addressed by the P2 fix above*
- Why it matters: emoji + label is sufficient to *identify* a card once read, but color previously helped *relocate* a specific option peripherally; losing all differentiation flattens scanning, especially under mobile thumb-scroll pressure (persona Casey).
- Fix: the louder solid accent (same fix as above) is the fix Assessment A itself ranked highest among the "uncurated" options considered (louder single accent > deterministic index-based color rotation > emoji-size bump alone). Not fully solved — a genuinely flat grid of 6-8 identically-colored cards is an inherent tradeoff of removing per-service curation, which the parent task explicitly and deliberately chose. No further action taken this pass.
- Suggested command: `/impeccable critique` again once Task 6/7 (MatchResults, SearchPage) land, to see if the flatness reads worse once multiple screens share this pattern.

**[P3] Loading skeleton doesn't shape-echo the final card composition**
- Why it matters: a single flat pulsing block (vs. icon-circle + title + description) reads more generic than the rest of the system, though this is low-stakes given a 5-minute `staleTime` typically means it's shown once per session.
- Fix: not applied — the brief specified this exact skeleton verbatim as part of the task's required implementation; noted here as a possible future `/impeccable delight` pass, not urgent.

**[P3] Step 0 vs Step 1 card sub-pattern inconsistency**
- Why it matters: Step 0's provider-type cards use no icon circle at all, while Step 1 introduces one — a minor internal inconsistency, not user-facing enough to block anything.
- Fix: not applied, out of scope (Step 0 uses the untouched `PROVIDER_TYPE_OPTIONS` constant per this task's explicit instructions).

## Persona Red Flags

**Jordan (First-Timer):** Hits the wizard cold. Before the fix, a slow/failed catalog fetch or an audience with 0 configured services left Jordan looking at a blank step with no explanation — for a first-time trust-building flow, a dead end here is costly. The empty-state message now covers the "0 configured services" case; a genuine fetch failure still looks the same as that empty state (mislabeled as "no services" rather than "couldn't load"), which is acceptable but not ideal.

**Casey (Mobile):** A 2-column layout of near-identical blue cards under thumb-scroll pressure previously forced Casey to read every label instead of pattern-matching by color/position — slowing the one screen this product wants to feel effortless (Smart Match's core promise). The solid-icon-circle fix gives a louder, more legible anchor point per card without reintroducing per-service color coding.

## Minor Observations

- Duplicate-`key` risk from `type` (slug) was checked and ruled out: `Service.slug` has a `@unique` DB constraint in `Backend/prisma/schema.prisma`, so `catalog.byAudience()` can never return two cards with the same `type` for one audience.
- `bg-secondary-100 text-secondary-700` (used elsewhere in this same file, e.g. the budget-tier badge) computes to ≈2.8:1 contrast, failing WCAG AA — flagged for completeness by Assessment B, but it's pre-existing, outside the Step 1 scope of this task, and not touched here.

## Questions to Consider

- Once Task 6 and Task 7 (MatchResults cards, SearchPage/filters) also consume the catalog and land the same uniform-color treatment, does the flatness compound across screens in a way a single-screen review can't see? Worth a fresh `/impeccable critique` pass after those land.
- Should `useServiceCatalog` grow an `isError`/`refetch` surface now, before more screens depend on it, so every consumer doesn't have to work around the same gap independently?
