# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Tutors (pet owners):** people looking for trustworthy pet care — boarding, walks, sitting — who currently rely on exhausting manual search, word-of-mouth, and risky informal WhatsApp arrangements.
- **Petsitters (independent caregivers/walkers):** autonomous professionals who today lose ~25% of earnings to national marketplace fees and struggle with no-shows/late payment on informal bookings.
- **Petshops and veterinary clinics (B2B partners):** local commercial establishments who benefit from referred foot traffic and cashback-driven return visits. Onboarded by admin only — no public partner self-signup.
- **Admin:** operates the platform — manages users, petsitters, partners, and support.

## Product Purpose

PetUno is a bilateral marketplace connecting pet tutors with independent petsitters/walkers and, eventually, commercial pet partners (shops, clinics). It exists to replace exhausting manual search and trust-less informal arrangements with algorithmic matching, automated safety monitoring, and guaranteed payment — while keeping fees fair enough that local independent caregivers actually keep more of what they earn.

Success is measured by tutors trusting the platform enough to book without meeting a sitter in person first, and petsitters preferring it over informal WhatsApp arrangements because payment is guaranteed and fees are lower than incumbents.


## Primary Differentiator
**Smart Match (Match Inteligente):** The core value proposition. The UI must prioritize the matching mechanism visually above all else (search, filters, or algorithmic suggestions). It is not just a feature; it is the product.

## Positioning

Differentiated from generic pet-sitting marketplaces (e.g. DogHero-style incumbents) on three mechanisms:

1. **Smart Match (5-question wizard):** replaces manual browsing with a short behavioral/contextual questionnaire (pet energy level, sociability, medical/dietary restrictions, caregiver home infrastructure) that algorithmically surfaces the right sitter.
2. **Passive safety monitoring:** geofencing that auto-detects a caregiver entering/leaving the service perimeter, and passive route tracking during walks — no manual "start/stop" button reliance on the caregiver.
3. **Circular cashback economy:** a percentage of what a tutor spends returns as in-app credit ("Lealcoins"), redeemable only at partner petshops/clinics — creating a loyalty loop that keeps spend inside the local partner network instead of leaking to outside platforms.

Fair, lower commission for early ("founding") petsitters vs. national competitors, funded in part by a B2B partner network that gets referred customers in exchange for onboarding.

## Operating Context

- Tutor flow: create account → register pets → run Match wizard → browse/search sitters → book → chat with sitter per booking → track location during service → review afterward.
- Petsitter flow: create profile → receive bookings → chat with tutor → (planned) passive location/geofence tracking during service → get paid.
- Admin flow: manage users, petsitters, support messages, and (planned) B2B partner accounts — from a dedicated admin dashboard.
- B2B partner flow (planned, not built): admin creates the partner account/login (no self-registration); partner displays an in-store QR code; tutors scan it to enter the cashback loop and are steered back to that partner to redeem Lealcoins.

## Capabilities and Constraints

**Built today (frontend + backend):**
- Auth (login/register), tutor and petsitter profiles, pet management, bookings, reviews, per-booking chat, admin dashboard (users/petsitters/support), public search and landing page, help center, partial location check-in (`LocationCheckIn` table + frontend), a Match Wizard UI (5 questions, not yet climate/infrastructure-aware).

**Explicitly not yet built (part of the intended full vision, not current state):**
- Cashback wallet and transaction ledger (Lealcoins).
- B2B partner profiles for petshops/clinics and the admin flow to create them.
- Vet emergency reserve fund and claims (Garantia Pet).
- Active geofencing (auto enter/exit detection) and autonomous route tracking — only manual/partial check-in exists today.
- Climate- and infrastructure-aware Match filters (air conditioning, yard/screened balcony, walk-time-of-day) and matching fields on `Pet`/`PetsitterProfile`.
- Founding-caregiver tiered commission structure (13% vs 18%) and Premium subscription for petsitters.

**Terminology:** "Tutor" = pet owner/customer. "Petsitter" = independent caregiver/walker. "Partner" = B2B petshop or clinic (planned). "Lealcoins" = cashback credit (planned, name may change with rebrand history).

**Market scope (open decision):** Cuiabá is the current go-to-market beachhead (regional petsitter recruitment, geo-targeted tutor marketing), not a confirmed permanent constraint on the product itself. Climate-specific matching logic and local clinic partnerships are Cuiabá-shaped today, but should not be assumed to hard-block generalizing beyond that market later — this remains undecided and should be revisited before Cuiabá-only assumptions get baked further into product logic.

**Naming (context, not open):** the product has been renamed multiple times through its history (CuidaPet → PetZelo → LealPet in various docs). "PetUno" is the current, confirmed, binding name reflected in the live app and this document. Older docs/files referencing other names describe the same product's earlier or business-planning phases, not a different product.

## Brand Commitments

- Name: **PetUno**, confirmed current and binding despite multiple prior renames across docs and code history.
- Voice: Portuguese (pt-BR) throughout the product UI.
- Assets: `logo.png`, `logo-horizontal-texto.png`, `logo-imagem.png` in `Frontend/public/`.

## Evidence on Hand

- Internal business-plan and mission documents (`PLANO DE NEGOCIOS...docx`, `MISSÃO E VALORES DO LEALPET...docx`, `missao.txt`, `plano.txt`, `ideialo.md`) describe the full intended business model, written under an earlier "LealPet" naming phase — treated as vision/positioning source material, not literal current branding.
- `gaps_implementacao.md` is a maintained, current gap analysis cross-referencing the business plan against actual code — the most reliable source for built-vs-planned status; consult it for a full item-by-item breakdown before scoping future work.
- No real testimonials, case studies, press, pricing page, or user-facing metrics exist yet — do not fabricate any of these in future work.

## Product Principles

1. **Trust over reach.** Every mechanism (guaranteed pre-payment, geofenced monitoring, vet emergency backstop) exists to make a tutor comfortable leaving a pet with someone they've never met — that comfort is the product's core value, not a side feature.
2. **Fair economics keep supply loyal.** Caregiver-side commission and B2B partner terms should stay visibly better than national incumbents; this is a stated competitive lever, not incidental pricing.
3. **Automate away caregiver friction.** Safety and reporting mechanisms (geofencing, passive tracking) are designed to require zero manual action from the caregiver — friction there is a trust risk, not just a UX nuisance.
4. **Local loop, not leakage.** Cashback and partner mechanics are designed to keep value circulating inside the local partner network rather than working like a generic discount.
5. **Vision may outpace implementation.** This product has an ambitious full business-plan scope; treat unbuilt planned mechanisms (cashback, B2B, vet fund) as real product direction when relevant, but never claim they exist in current UI/copy until built.
