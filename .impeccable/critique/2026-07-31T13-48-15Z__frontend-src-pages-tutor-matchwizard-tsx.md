---
target: Frontend/src/pages/tutor/MatchWizard.tsx Step 0/1 cards
total_score: 25
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-07-31T13-48-15Z
slug: frontend-src-pages-tutor-matchwizard-tsx
---
Method: dual-agent (A: a1e47060b25c2a25c · B: a93a90e989f99c4a8)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Selected-state and step bar are clear; invalid-submit feedback is only a transient toast, no persistent card-level cue. |
| 2 | Match Between System / Real World | 3 | Naming matches mental model; color-coding did not match severity (routine vaccine = gold, surgery = alarm red) before this fix pass. |
| 3 | User Control and Freedom | 4 | "Voltar" hidden on Step 0 correctly; switching provider type resets `service` state so stale selections can't leak forward. |
| 4 | Consistency and Standards | 2 | Card structure is consistent; ring/bg color assignment by array position (not semantics) was internally inconsistent before this fix. |
| 5 | Error Prevention | 2 | `Continuar` is never disabled with nothing selected; errors are only caught reactively via toast. |
| 6 | Recognition Rather Than Recall | 4 | All options shown as cards, nothing to type or remember. |
| 7 | Flexibility and Efficiency of Use | 2 | Purely linear single path; no shortcuts, no pre-fill for returning users. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean individually; the double-gold + orphaned 5th card broke the "one focal point" read before this fix. |
| 9 | Help Recognize/Diagnose/Recover from Errors | 2 | Generic toast text only, no visual cue on which card needs attention. |
| 10 | Help and Documentation | n/a | Too simple a 2-step card decision to need documentation; per-card `desc` already substitutes. |

**Total: 25/36** (9 applicable heuristics × 4; heuristic 10 n/a).

## Design Specificity Verdict

**LLM assessment:** Low-to-medium. The Portuguese copy and provider-type framing are product-specific, but the card system itself is a generic multi-option selector. The color-rotation-by-array-position pattern actively worked against PetUno's own "gold is sparing and meaningful" brand rule rather than reflecting it.

**Deterministic scan:** `detect.mjs --json` on the source file returned `[]` (exit 0, no static findings) — expected, since the live issues found (nested-cards, sparing-gold violation) depend on rendered DOM/computed styles a source-only JSX scan can't evaluate.

**Visual overlays:** Browser-injected detector (via `live-server.mjs` + `detect.js`) found, on both Step 0 and Step 1: `overused-font`, `gradient-text`, `dark-glow`, `image-hover-transform`, and a duplicated `shape-assembled-illustration` hit — all anchored to `body`/page-chrome shared across the whole `/match` route (nav, logo, hero decoration), not introduced by the Step 0/1 card markup itself; treated as likely pre-existing/out-of-scope, not flagged as new priority issues. The one finding that mapped directly to the new markup was `nested-cards` (3× per step, once per option card) — this is the established peer-checked-radio-wrapped-in-styled-div pattern used throughout the wizard (including the pre-existing Petsitter service cards), not something novel to this diff; treated as a structural pattern choice already baked into the design system rather than a new regression, and left unchanged in this fix pass.

## Overall Impression

Step 0's card selector is solid and well-executed. Step 1's conditional partner-service cards (the new B2B branch) had two real, product-relevant problems: the Sparing Gold Rule was violated (two gold cards visible on the same Clínica screen), and the color-rotation-by-position assignment gave a pet's surgery the same alarm-red used for platform warnings, with zero softening — exactly at the flow's highest-stakes branch point. Both are now fixed.

## What's Working

1. **State hygiene on branch change**: switching provider type resets `service` immediately (line ~205), preventing a mismatched service/provider submission.
2. **Equal-height card handling**: `h-full … justify-center` keeps icons aligned across a row despite wildly different `desc` string lengths.
3. **Step-count/label adapt correctly to branch**: partner flow correctly shows "Passo 1 de 3" and skips the budget step; confirmed live.

## Priority Issues (addressed in this pass)

- **[P1] Sparing Gold Rule violated on the Clínica screen** — Vacinação and Internação both rendered gold simultaneously. Fix applied: Internação changed from `secondary` (gold) to `primary` (blue) in `PARTNER_CARD_META`, leaving exactly one gold card per screen.
- **[P1] No emotional accommodation at the flow's highest-stakes branch** — Cirurgia used alarm-red (`error-50/error-600`) purely from array position, giving pet surgery the same visual severity as a platform warning. Fix applied: Cirurgia changed to `primary` (calm blue) in `PARTNER_CARD_META`.
- **[P2] 5-card Clínica grid produced an orphaned 3+2 row** — `grid-cols-2 sm:grid-cols-3` with 5 items left Internação isolated with visible empty space beside it. Fix applied: Step 1's card container changed from a fixed grid to `flex flex-wrap justify-center` with percentage-based card widths, so any remainder row centers instead of leaving a gap — verified live (Cirurgia/Internação now render centered as a balanced last row).
- **[P2] Focus-visible ring contrast (~2.8:1, below the 3:1 non-text minimum)** — `peer-focus-visible:ring-primary-300` was too faint for low-vision keyboard users. Fix applied: bumped to `ring-primary-500` on both Step 0 and Step 1 cards.
- **[P3] Decorative emoji not marked `aria-hidden`, and `⚕️` rendered as a broken glyph on Windows** — Fix applied: added `aria-hidden="true"` to all Step 0/1 emoji containers; swapped Cirurgia's emoji from `⚕️` to `🩹` (verified renders correctly).

## Persona Red Flags

**Sam (accessibility-dependent user):** Keyboard-focus ring was present but under-contrast (now fixed to `ring-primary-500`). Decorative emoji lacked `aria-hidden` (now fixed). No `aria-live` region for the Step 0 toast validation error — a screen-reader user who tabs past Step 0 without selecting anything gets no reliably-announced reason the "Continuar" click did nothing (not fixed in this pass — would require adding a live region, a larger scope change than a design-review fix pass; flagged for a future accessibility hardening pass).

**Casey (distracted mobile user):** The 5-card Clínica grid's orphaned row is now fixed (centers on all breakpoints). Continuar still gives no in-context indication of what's missing when tapped prematurely (toast only) — not fixed in this pass, same reasoning as above.

## Minor Observations

- `PARTNER_CARD_META` icon circles use `bg-{hue}-100` while the Tinted-Pair Badge Rule specifies `{hue}-50` for badges — these are icon avatars, not badges, so not a direct rule violation, but worth reconciling if they're meant to share a token in a future pass.
- The color-rotation pattern in `SERVICES` (petsitter) and `PARTNER_CARD_META` (partner) still don't follow an identical sequence — acceptable since colors are now assigned by service semantics (routine vs. serious) rather than position, but worth a note for future consistency.

## Provocative Questions

1. Now that Cirurgia/Internação read calm blue instead of alarm red, does the Clínica flow need a one-line reassurance copy under the Step 1 heading (e.g., "Vamos te conectar com o cuidado certo, com calma") for tutors researching their pet's surgery — or does the color fix alone carry enough of that signal?
2. The petsitter set has 6 service cards, over the ≤4 cognitive-load guideline — was there ever a decision to cap visible options, or does this simply inherit whatever list the admin/backend defines? Worth revisiting in a future `/impeccable distill` pass if the option count keeps growing.
