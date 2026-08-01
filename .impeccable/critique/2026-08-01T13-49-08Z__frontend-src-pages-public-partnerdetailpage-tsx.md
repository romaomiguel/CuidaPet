---
target: Frontend/src/pages/public/PartnerDetailPage.tsx + PetsitterDetailPage.tsx (icon-to-emoji alignment, scoped critique)
total_score: 0
max_score: 0
na_heuristics: 1,2,3,5,6,7,9,10
p0_count: 0
p1_count: 0
timestamp: 2026-08-01T13-49-08Z
slug: frontend-src-pages-public-partnerdetailpage-tsx
---
Method: dual-agent (A: general-purpose design review · B: general-purpose detector + evidence)

**Scope note**: This is a scoped critique, not a full-surface review. Task 9 of the dynamic-service-catalog plan swapped fixed Lucide icons for `catalog.emoji(s)` on the "Serviços" badges in `PartnerDetailPage.tsx` (`w-11 h-11` circle) and `PetsitterDetailPage.tsx` (`w-12 h-12` circle). Both agents were scoped to one question: does the vector-icon-to-emoji-glyph swap break vertical/horizontal centering inside the colored circular badge, given emoji render via the OS/browser system font (Segoe UI Emoji / Apple Color Emoji / Noto Color Emoji) rather than a pixel-crisp SVG viewBox. The icon-to-emoji architectural decision itself was out of scope (already made in an earlier task, for the same reason: an admin-created service can never exist in a hardcoded `Record<ServiceType, ReactNode>`).

### Design Specificity Verdict

Not applicable at this scope — no new composition or IA was introduced; this is a targeted icon-rendering swap inside an existing, unchanged layout.

### Verdict: No real alignment defect

Both assessments independently concluded the swap is safe:

- **Assessment A (design review)**: `items-center justify-center` centers the emoji's anonymous line box, not the raw glyph — this absorbs almost all of the container-vs-content size delta symmetrically. The residual risk (a color-emoji glyph's ascent/descent sitting a few px off nominal center, varying by platform) is real but cosmetic, not structural, and already exists unchanged in this codebase's one prior emoji-badge precedent (MatchWizard). Sizing ratio (20px emoji / 44-48px circle ≈ 0.42-0.45) tracks the prior Lucide `size={20}` closely and is proportionally consistent with MatchWizard's 24px/56px (≈0.43) badge. `aria-hidden="true"` is correctly applied since the adjacent `catalog.label(s)` text already carries the accessible name.
- **Assessment B (detector + evidence)**: `detect.mjs` returned 0 findings (exit 0) on both files. Grepped every `rounded-full flex items-center justify-center` badge in `Frontend/src` — the two reviewed files use an identical pattern to each other, and the one true emoji-in-circle precedent (`MatchWizard.tsx:240`, `w-14 h-14 ... text-2xl`) confirms the same centering approach (flexbox + font-size utility, no `leading-none`) was already shipped and accepted. No `leading-none` exists anywhere near an emoji/icon badge in this codebase today.

### What's Working

- Clean, scoped swap: only the icon content changed (`SERVICE_ICONS[s]` → `catalog.emoji(s)`), the two-tone alternating badge background (`primary-100/700` / `secondary-100/700`) and container sizing are untouched.
- `text-xl` (20px) matches the pixel size of the previous Lucide `size={20}` icon almost exactly, so the visual weight inside the badge is preserved, not just the general "icon-shaped" area.
- `aria-hidden="true"` correctly added since the visible label text already carries the accessible name — matches the MatchWizard precedent's accessibility treatment.

### Priority Issues

- **[P3] Residual cross-platform vertical wobble — pattern-wide, pre-existing, not introduced by this diff.** Neither of the two reviewed badges (nor the MatchWizard precedent) sets `leading-none`. Tailwind's default `text-xl` line-height (28px) adds half-leading that flexbox centers as a block, but the emoji glyph's exact position inside that line box is still font-metric-dependent and can read ~1-3px high on some platforms. **Fix**: add `leading-none` to the badge `div` className, ideally applied consistently across all three emoji-badge sites (`PartnerDetailPage.tsx`, `PetsitterDetailPage.tsx`, and `MatchWizard.tsx`) in one pass rather than diverging this diff from precedent. **Suggested command**: `/impeccable polish` (or fold into Task 10's read-only sweep since it touches a third file outside this task's scope). Not blocking — cosmetic, sub-3px, and doesn't regress anything Task 9 shipped.

No P0/P1/P2 issues found on the specific alignment question this critique was scoped to answer.

### Minor Observations

- `MatchWizard.tsx:240` uses `w-14 h-14 text-2xl` (a larger circle, bigger emoji, icon-above-label stacked layout) — a deliberately different composition for a card-grid selector, not a mismatch worth reconciling with the inline list-row badges reviewed here.

### Questions to Consider

- Should the pattern-wide `leading-none` polish (P3) be picked up now, deferred to `/impeccable polish`, or folded into Task 10 (the read-only label sweep) since it also touches `MatchWizard.tsx`, a file outside Task 9's scope?
