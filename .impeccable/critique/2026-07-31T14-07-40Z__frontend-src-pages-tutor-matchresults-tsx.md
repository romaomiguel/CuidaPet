---
target: Frontend/src/pages/tutor/MatchResults.tsx isPartnerFlow branch + CardPartner.tsx
total_score: 21
max_score: 36
na_heuristics: 5
p0_count: 1
p1_count: 1
timestamp: 2026-07-31T14-07-40Z
slug: frontend-src-pages-tutor-matchresults-tsx
---
Method: dual-agent (A: a3bea8f85001aecfb · B: a357e4097852b25bd)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading state is good, but a genuine backend failure rendered identically to a legitimate zero-result search (confirmed live) — `isError` wasn't destructured from the partner query. Fixed in this pass. |
| 2 | Match Between System / Real World | 3 | Loading subtitle claimed to analyze "avaliações" (reviews) for the partner flow even though `PublicPartnerProfile` has no rating field. Fixed in this pass (subtitle now branches by `isPartnerFlow`). |
| 3 | User Control and Freedom | 2 | Partner empty state offers only one exit (restart the wizard); petsitter empty state offers two (restart + manual browse link). No manual partner-browse page exists yet (Task 7 pending) — left as a known, tracked gap, not fixed in this pass. |
| 4 | Consistency and Standards | 2 | Card grammar (photo, hover lift, badge truncation, CTA) matches `CardPetsitter` well, but the type badge used gold (`badge-brand`) for every clínica card, breaking DESIGN.md's own Sparing Gold Rule on every load of the clínica flow. Fixed in this pass. |
| 5 | Error Prevention | n/a | Read-only results/listing surface; no user input or destructive action on this page. |
| 6 | Recognition Rather Than Recall | 4 | Service chips, type badge, address, icons all paired with visible text; nothing to memorize. |
| 7 | Flexibility and Efficiency | 1 | Up to 50 partner cards render in one flat grid with zero sort/filter/pagination. Out of scope for this task (structural, future work). |
| 8 | Aesthetic and Minimalist Design | 3 | Layout is clean; the repeated-gold issue that undermined this is fixed. Remaining risk: `avatarUrl()`'s hardcoded-green fallback avatar could make a photo-sparse partner grid look repetitive (admin-onboarded partners, no self-serve uploads) — noted, not fixed (shared util, out of this task's file scope). |
| 9 | Error Recovery | 3 | Was 1 (a hard API failure surfaced as a plausible-but-false "no partners here" message). Now has a distinct error state with retry action, confirmed via tsc + code read. |
| 10 | Help and Documentation | 1 | Nothing on this page explains to a tutor why the B2B partner flow suddenly has no ranking/score/AI framing right after the wizard sold "Match Inteligente." Not addressed — out of scope for this pass (would require copy/IA work beyond the reviewed states). |

**Total: 21/36** (heuristic 5 marked n/a; 9 applicable heuristics × 4).

## Design Specificity Verdict

**LLM assessment**: Mostly authored for PetUno — `CardPartner.tsx` deliberately reuses `CardPetsitter.tsx`'s exact card grammar (photo treatment, hover lift, badge truncation, CTA convention) rather than dropping in a generic UI-kit card. But once petsitter-specific signals (rating, availability, price) are stripped, nothing PetUno-specific was added back — no cashback/loyalty framing, no distance, no trust cue — so the card reads as "a directory listing" more than "a partner card designed for what a partner needs to communicate." The clearest concrete specificity failure was mechanical: the type badge used the gold-family `badge-brand` for every single clínica card, which DESIGN.md names explicitly as a rule violation ("Sparing Gold Rule") — not a matter of taste, a direct rule break, now fixed.

**Deterministic scan**: `detect.mjs --json` on `MatchResults.tsx` + `CardPartner.tsx` returned `[]`, exit code 0 — clean static scan, no findings.

**Visual overlays**: Browser-injected detector (`live-server.mjs` + `detect.js`) on the live empty-state view returned 6 log lines under one `[impeccable] 1 anti-pattern found` group header (count mismatch noted as observed, not reconciled): `gradient-text`, `bounce-easing`, `shape-assembled-illustration` (×2, duplicate identical text), `dark-glow`, `image-hover-transform`. All 6 were anchored only to `body` (a generic page-level selector), not to any partner-specific class or component — Assessment B flagged these as a plausible false-positive/out-of-scope concern, since they likely belong to shared page chrome/illustration (the cat-face empty-state SVG, or layout-level styling) rather than anything introduced by `CardPartner.tsx` or the new `isPartnerFlow` branch. Treated as out-of-scope for this fix pass, consistent with that assessment.

## Overall Impression

The new parceiro branch is structurally sound and visually consistent with the existing petsitter card system — someone clearly worked from `CardPetsitter.tsx` as a template rather than inventing a new pattern. The two real, product-relevant problems were both about **trust**, which is the one thing PRODUCT.md says this product cannot compromise on: (1) a backend outage was indistinguishable from "no partners exist here," directly contradicting the "Trust over reach" principle, and (2) the type badge broke the brand's own Sparing Gold rule on every card of a clínica search, diluting the "gold means something" signal the whole design system depends on. Both are now fixed. The remaining gaps (no sort/filter at scale, missing manual-browse fallback for zero-result partner searches, no explicit "why is this different from the wizard's AI framing" copy) are legitimate but larger-scoped concerns better suited to a future `/impeccable harden`/`/impeccable clarify` pass once Task 7 (SearchPage partner toggle) lands.

## What's Working

1. **Disciplined card-grammar reuse**: `CardPartner.tsx` matches `CardPetsitter.tsx`'s photo treatment (`aspect-[4/3]`), hover lift (`hover:-translate-y-1.5`, `shadow-card-hover`), badge truncation (3 chips + "+N" `badge-gray`), and "Ver perfil →" CTA convention almost exactly — a user moving between petsitter and partner results feels one coherent system.
2. **Branches loading copy correctly**: the loading headline ("Buscando parceiros na sua região…" vs "Encontrando seu match perfeito…") correctly signals "this is a directory search" vs "this is matching," now reinforced by the subtitle fix so both lines agree.
3. **Resists fabricating data**: no rating stars, no availability dot, no price badge invented for a shape (`PublicPartnerProfile`) that genuinely has none of those fields — the right call instead of padding the card with fake signals.

## Priority Issues (addressed in this pass)

- **[P0] Backend failure indistinguishable from a legitimate empty result** — `partner-match` query didn't destructure `isError`, so a failed request silently resolved to the same "😿 Nenhum parceiro encontrado" screen as a genuine zero-result search (confirmed live against a stopped backend). Fix applied: added `isError: isErrorPartners, refetch: refetchPartners` to the query, and a new distinct error branch ("📡 Não conseguimos buscar parceiros agora" + "Tentar novamente" retry action + "Refazer a busca" fallback) rendered before the empty-state check.
- **[P1] Sparing Gold Rule violated on every clínica results page** — `CardPartner`'s type badge used `badge-brand` (gold) for `type === 'clinica'`, so every card in a same-type filtered grid rendered gold simultaneously. Fix applied: changed to `badge-blue` (clínica) / `badge-gray` (petshop) — no gold used at all, since the page header already states the type and gold should stay reserved for an actual per-screen highlight if one is ever introduced.
- **[P2] Loading subtitle claimed to analyze reviews that don't exist for partners** — the subtitle "Analisando disponibilidade, localização e avaliações" was unconditional even though partners have no rating field. Fix applied: subtitle now branches (`isPartnerFlow ? 'Verificando serviços e localização' : ...`).

## Priority Issues (not addressed — out of scope for this pass)

- **[P2] Partner empty state has only one exit** (restart the wizard) vs. the petsitter empty state's two (restart + manual browse link) — no manual partner-browse page exists yet; Task 7 ("SearchPage type toggle + PartnerFilters") is still pending in the plan and is the natural place to add the equivalent link.
- **[P3] No sort/filter/pagination on a grid that can return up to 50 unranked cards** — fine at pilot scale, but doesn't hold up as the partner network grows. Best addressed once partner geodata/ratings exist.

## Persona Red Flags

**Alex (Power User)**: Hits a flat, unsorted up-to-50-card grid with no filter/sort — a jarring downshift in perceived sophistication right after the wizard's "algorithmic matching" pitch. Not addressed this pass (structural, tied to the P3 above).

**Jordan (First-Timer)**: Previously could not distinguish "genuinely no clinics here" from "the request failed" — now fixed via the new error-state branch with a "Tentar novamente" action, which gives Jordan an actionable next step instead of a false negative.

**Sam (Accessibility)**: `.card` (shared with `CardPetsitter`) has no custom `focus:` ring, unlike every `.btn-*`/`.input-*` class in the system. Left unfixed in this pass — it's a shared global class affecting every card in the app, not something scoped to this task's two files, and a broad change there needs its own review.

## Minor Observations

- The crying-cat emoji empty-state illustration is shared with the petsitter branch and, per Assessment B's browser detector run, is likely the source of the `shape-assembled-illustration`/`gradient-text`/etc. findings anchored to `body` — pre-existing shared page chrome, not introduced by this task's two files.
- `avatarUrl()`'s hardcoded-green (`#4CAF50`) fallback avatar has no relation to Trust Blue/Golden Cheer and could make a photo-sparse partner grid (admin-onboarded, no self-serve uploads) look repetitive — a shared util used everywhere, so out of this task's scope, but worth a future `/impeccable colorize` or `/impeccable harden` pass.
- Header copy ("Clínicas/Petshops na sua região", the result count line) reads naturally in pt-BR and matches the product's tone — no complaints.

## Provocative Questions

1. If the partner flow is deliberately "no ranking, no AI" by design, should the page say that explicitly, so it reads as an intentional simpler mode rather than a silent downgrade from the wizard's "Match Inteligente" promise?
2. Now that the type badge no longer uses gold, is there a genuine "one thing" left to spend PetUno's gold accent on in this grid — a "closest to you" or "recém-adicionado" card — or should this surface simply not use gold at all, ever?
3. Given B2B partners are admin-onboarded with no guaranteed photography, should the card design assume the fallback avatar is the *common* case rather than the exception, and design for that up front?
