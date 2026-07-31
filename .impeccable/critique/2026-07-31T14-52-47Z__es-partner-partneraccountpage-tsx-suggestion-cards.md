---
target: suggestion-form cards in PetsitterProfilePage.tsx + PartnerAccountPage.tsx
total_score: 0
max_score: 0
na_heuristics: 1,2,3,5,6,7,9,10
p0_count: 0
p1_count: 0
timestamp: 2026-07-31T14-52-47Z
slug: es-partner-partneraccountpage-tsx-suggestion-cards
---
Method: dual-agent (A: af0474558cc3cb019 · B: a80387d21997bd1a0)

## Scope

Narrow consistency review of the two new "Não encontrou seu serviço?" suggestion-form cards added to:
- `Frontend/src/pages/petsitter/PetsitterProfilePage.tsx` (preferencias tab, after "Serviços Oferecidos")
- `Frontend/src/pages/partner/PartnerAccountPage.tsx` (after "Galeria", before the main form)

Not a full-page audit — focused only on whether these two additions match their immediate neighboring cards.

## Design Specificity Verdict

**LLM assessment**: The new cards are not generic boilerplate — they reuse the product's exact established idioms (card wrapper, heading/subtitle pairing, textarea treatment, outline button) rather than inventing new patterns, which is the correct move for a low-stakes secondary widget bolted onto an existing form-heavy page.

**Deterministic scan**: `detect.mjs --json` on both files returned exit code 0 and an empty findings array — zero rule violations detected.

## What's Working

1. **Textarea is byte-for-byte identical** to the existing "Sobre Mim" bio textarea in `PetsitterProfilePage.tsx` (`w-full p-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary-400 outline-none text-sm text-ink resize-none transition-all`) — zero drift.
2. **Heading/subtitle pairing matches every sibling card** on both pages: `font-heading text-xl font-bold text-primary-700` + `text-sm text-muted -mt-1`, confirmed identical to "Serviços Oferecidos", "Animais Aceitos" (Petsitter) and "Serviços prestados" (Partner).
3. **Handler pattern faithfully copies the established convention**: try/catch(empty, axios interceptor handles real errors)/finally with a `isSubmitting*` boolean and a `toast.error` guard on empty input — matches `handleAvatarChange`/`uploadDocument` exactly.
4. Class-level cross-check (Assessment B) confirms the new card's textarea and button classNames are literally identical strings across both files, and match the surrounding `.card`-wrapped h2/textarea/button conventions already in use — consistent with intentional reuse, not a one-off.

## Priority Issues

- **[P2] Flow interruption on the Petsitter page.** The card sits between "Serviços Oferecidos" (a required, zod-validated field) and "Ambiente" — two required, topically unrelated sections — right below a "conta pendente" approval banner urging the user to finish required fields. An optional feedback widget breaking a required onboarding sequence is poor sequencing.
  - **Fix**: Consider moving the suggestion card to the end of the tab/page (after all required fields) so it doesn't interrupt the required flow.
  - **Suggested command**: `/impeccable layout`

- **[P2] No visual de-emphasis for an optional, low-stakes action.** The card carries identical visual weight (white `rounded-2xl` card, `text-xl font-bold text-primary-700` heading) to the mandatory card directly above it. Nothing signals "optional feedback" vs. "required step."
  - **Fix**: Lower visual weight (e.g. `bg-background` tint instead of full card-white, smaller heading, or an explicit "Opcional" label) so it doesn't compete with required fields.
  - **Suggested command**: `/impeccable layout`

- **[P3] Structural placement inconsistency between the two pages.** On Petsitter the card sits *inside* `<form onSubmit>`; on Partner it sits *outside* the form, before it. Functionally harmless (`type="button"`) but a maintenance/consistency smell if the two pages are meant to feel like a matched pair.

- **[P3] No local `btn-outline` precedent on `PartnerAccountPage.tsx`.** The only other `btn-outline` usages in the codebase are the document-upload buttons in `PetsitterProfilePage.tsx`. The new button correctly reuses the system-wide `btn-outline` convention, so it's consistent with the design system as a whole, just introduced cold into a file with no prior local precedent — flagged for awareness, not a defect.

## Persona Red Flag

**First-time petsitter finishing required onboarding** (pending-approval banner visible): after selecting services, they immediately hit a full-weight card asking them to describe a missing service, visually indistinguishable in authority from the required step they just completed. Risk of misreading it as another mandatory field, or getting distracted into writing free text instead of proceeding to submit the form that actually unlocks their visibility in search.

## Minor Observations

- `rows={2}` (suggestion) vs. `rows={4}` (bio) — intentional given expected input length, not an issue.
- Loading state is a text-swap (`"Enviando..."`) rather than a spinner, unlike the primary form-submit buttons — but this matches other secondary-action patterns already in these files, so it is not a new inconsistency.
- Placeholder copy is audience-appropriate per page ("Passeio noturno, transporte pet" vs. "Delivery de ração, banho a domicílio").

## Disposition for this task

No code changes applied as a result of this critique: both the deterministic detector and the class-level cross-check confirm the two cards are pixel/class-consistent with their neighbors (the review's stated scope), and the brief specified this exact markup verbatim. The P2 findings above are IA/sequencing observations for a possible future pass, not defects in visual consistency — logged here for `/impeccable layout` to pick up later rather than acted on unilaterally in this task.
