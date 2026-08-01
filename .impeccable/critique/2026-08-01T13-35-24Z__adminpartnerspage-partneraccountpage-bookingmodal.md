---
target: Frontend service checklists (PetsitterProfilePage, AdminPartnersPage, PartnerAccountPage, BookingModal)
total_score: 10
max_score: 12
na_heuristics: 1,3,5,6,7,9,10
p0_count: 1
p1_count: 0
timestamp: 2026-08-01T13-35-24Z
slug: adminpartnerspage-partneraccountpage-bookingmodal
---
Method: dual-agent (A: general-purpose design review · B: general-purpose detector/evidence)

## Scope

Narrow follow-up critique of one UI pattern change, not a full surface audit: the migration of 4 service checklist/picker UIs (`PetsitterProfilePage.tsx`, `AdminPartnersPage.tsx`, `PartnerAccountPage.tsx`, `BookingModal.tsx`) from static `serviceLabels[slug]` lookups to the dynamic `useServiceCatalog()` hook.

## Design Health Score (renormalized — only 3 of 10 heuristics apply to this narrow scope)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 2 | Match System / Real World | 4/4 | Emoji-as-service-icon reads naturally in a pt-BR pet marketplace. |
| 4 | Consistency and Standards | 3/4 | `{s.emoji} {s.name}` text pattern is byte-identical across all 3 full-object sites; docked for two pre-existing splits made newly visible (see below). |
| 8 | Aesthetic and Minimalist Design | 3/4 | Fits DESIGN.md's warm/playful mandate; docked because container styling (pill vs. card) was never reconciled across sites. |
| 1,3,5,6,7,9,10 | — | n/a | Out of scope for this targeted follow-up. |
| **Total** | | **10/12** | Good (83%) |

## Design Specificity Verdict

Deliberate at the label level — the `{emoji} {name}` idiom and BookingModal's documented-in-practice name-only exception (raw slug, no full catalog object per item) are handled thoughtfully. Inherited rather than decided at the container level: two different "same concept" widgets (pill chip vs. rounded-2xl card) sit side by side without anyone choosing between them — pre-existing, not introduced by this change.

## What's Working
1. The `{s.emoji} {s.name}` rendering pattern (single space, emoji-first) is identical across `PetsitterProfilePage.tsx`, `AdminPartnersPage.tsx`, and `PartnerAccountPage.tsx`.
2. The React state idiom for the checklist — `checked = field.value.includes(s.slug)`, `field.onChange(checked ? .filter(...) : [...spread])`, `key={s.slug}` — was reproduced verbatim in `PartnerAccountPage.tsx` from `AdminPartnersPage.tsx`'s pattern, despite being hand-applied from a prose description rather than literal find/replace.
3. Emoji-as-icon is on-brand warmth with zero new assets, consistent with DESIGN.md's anti-corporate/anti-clinical mandate.

## Priority Issues

**[P0] Rules-of-Hooks violation in `PartnerAccountPage.tsx`** — Both Assessment A and B independently found `useServiceCatalog()` was originally called at line ~181, *after* two conditional early returns (`if (loading || !user) return …`, `if (!profile) return …`). This causes React to call a different number of hooks between the loading and loaded render passes for the same component instance — a hook-count-mismatch crash on the loading→loaded transition, not the previously-tracked "cold cache" risk. **Fixed during this task**: moved `const catalog = useServiceCatalog()` to the top of the component (right after `useAuthStore()`), matching how the other three files call the hook unconditionally before any early return (`AdminPartnersPage.tsx:33`, `PetsitterProfilePage.tsx:79` before its guard at line 254, `BookingModal.tsx:42` before any conditional return).

**[P2] Typography split (pre-existing, out of scope)** — `PetsitterProfilePage.tsx` wraps its checklist label in `<span className="font-heading font-bold">`; `AdminPartnersPage.tsx`/`PartnerAccountPage.tsx` render the label bare. Per DESIGN.md's own "Broken Heading Rule," `font-heading` maps to an unloaded Nunito Sans and silently falls back to a generic browser sans-serif — so one of the three visually-identical checklists actually renders in an undefined typeface relative to its siblings. Predates this refactor; the brief specified this markup verbatim for each file.

**[P2] Container-shape split (pre-existing, out of scope)** — `AdminPartnersPage.tsx` uses `.toggle-chip`/`.toggle-chip-active` (pill, gold active state per the Sparing Gold Rule); `PetsitterProfilePage.tsx`/`PartnerAccountPage.tsx` use ad-hoc `rounded-2xl` cards with a blue active tint. Same control, two idioms — pre-existing, now more visible since the label content is literally identical across all three.

**[P3] BookingModal's `catalog.label(s)` fallback is undocumented** — Correct, deliberate scope limit (BookingModal only has raw slugs via `petsitter.services`, not full catalog objects per item, so no emoji is available there), but a one-line comment would prevent a future contributor from "fixing" it into an inconsistency.

**[P3] Minor code-shape cosmetic** — `PartnerAccountPage.tsx` extracts `availableServices` as a named const; `AdminPartnersPage.tsx` inlines the `catalog.byAudience(...)` call in JSX. No functional difference.

## Structural Consistency Check: PartnerAccountPage.tsx (Step 3) vs. AdminPartnersPage.tsx (Step 2)

**Confirmed consistent**, independently verified by both assessments:
- `checked = field.value.includes(s.slug)` — identical in both.
- `key={s.slug}` — identical in both.
- `field.onChange(checked ? field.value.filter((v) => v !== s.slug) : [...field.value, s.slug])` — identical expression in both.
- Rendered content `{s.emoji} {s.name}`, unwrapped (no extra span) — identical in both.
- Only delta: `className` (pill classes in AdminPartnersPage vs. a `clsx(...)` card treatment in PartnerAccountPage) — pre-existing per-screen button styling, not part of the catalog-wiring logic, and not something the hand-applied port introduced.

## Detector Evidence

`node detect.mjs --json` against all 4 changed files: `[]` (zero findings, exit code 0). Independent grep spot-check of `PetsitterProfilePage.tsx` for dangling `serviceLabels`/`PETSITTER_SERVICES`/`PARTNER_SERVICES_BY_TYPE` references: no matches.

## Minor Observations
- No visual/browser inspection was performed (no dev server running in this session) — this critique is source-level only.

## Questions to Consider
- Should the pill-chip vs. rounded-card checklist idiom be unified into one canonical "service picker" component now that all three sites share identical data wiring and label content?
- Should the Broken Heading Rule (font-heading → unloaded Nunito Sans) be resolved codebase-wide before more UI work compounds the inconsistency?
