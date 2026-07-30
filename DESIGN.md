---
name: PetUno
description: A bilateral pet-care marketplace connecting tutors and petsitters — professional trust wrapped in warm, rounded, playful design.
colors:
  trust-blue: "#244F8C"
  trust-blue-hover: "#1D4073"
  trust-blue-dark: "#16315A"
  trust-blue-deep: "#003773"
  golden-cheer: "#FCC019"
  golden-cheer-hover: "#F2A20C"
  golden-cheer-light: "#F2DFA7"
  surface: "#FFFFFF"
  canvas: "#FBF9F8"
  ink: "#1B1C1C"
  muted: "#434750"
  stroke: "#C3C6D1"
  success: "#34C759"
  error: "#BA1A1A"
typography:
  display:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 400
rounded:
  md: "0.75rem"
  lg: "1.5rem"
  xl: "2rem"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.trust-blue-hover}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.trust-blue-dark}"
  button-secondary:
    backgroundColor: "{colors.golden-cheer}"
    textColor: "{colors.trust-blue-deep}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "#FDD65C"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.trust-blue-hover}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: PetUno

## Overview

**Creative North Star: "The Trusted Playdate"**

PetUno's visual system does one specific job: make a tutor comfortable leaving their pet with a stranger they met through an app. That's a trust problem before it's a marketplace problem, and the design solves it by pairing an institutional, dependable blue with a warm, cheerful gold — then softening every edge in the interface until nothing reads as a logistics dashboard. Every button, input, badge, and nav item is pill-shaped (`rounded-pill`, 9999px); cards are large and gently rounded (24-32px); backgrounds carry blurred organic blobs instead of hard geometric decoration. The result reads as a professional service you'd trust with your dog, not a corporate SaaS panel and not a cartoon.

The pairing is deliberate: Deep Trust Blue grounds the system as the structural, dependable color (navbars, primary actions, headings-on-dark), while Golden Cheer is used sparingly as the "look here" color — CTAs, active states, ratings, the one badge that matters. Confirmed anti-reference: PetUno should never read as cold, clinical, or corporate — no sharp corners, no flat enterprise-blue panels, no hard black shadows.

**Key Characteristics:**
- Pill-shaped everything: buttons, inputs, badges, chips, nav links, toggle switches.
- Soft, blue-tinted ambient shadows — never pure black, never sharp-edged.
- Organic blurred blob shapes and floating blurred orbs as background texture on hero, auth, and match surfaces.
- Deep Trust Blue as structure/trust; Golden Cheer as sparing accent/action color.
- Warm neutral canvas (`#FBF9F8`), not clinical white-on-white.

## Colors

A two-color brand system (deep institutional blue + warm gold) on a warm off-white canvas, with a conventional green/red status pair layered in for state feedback.

### Primary
- **Deep Trust Blue** (`#244F8C` / `trust-blue`): the structural color — navbars, primary buttons' resting-adjacent states, links, focus rings, icon accents. Used at full saturation for anything that needs to feel dependable.
- **Trust Blue Hover** (`#1D4073` / `trust-blue-hover`): the *actual* resting background of `.btn-primary` (not the 500 value) and its natural hover/pressed ramp partner.
- **Trust Blue Dark** (`#16315A` / `trust-blue-dark`): hover state for primary buttons.
- **Trust Blue Deep** (`#003773` / `trust-blue-deep`): most often used as **text** on Golden Cheer surfaces (active sidebar link, secondary button text) for high contrast, but it's also the deepest full-bleed section background for the darkest, most conviction-carrying blocks on a page (the "become a petsitter" closing CTA, trust/mechanism sections) — one step darker than the `primary-500` sections around it.

### Secondary
- **Golden Cheer** (`#FCC019` / `golden-cheer`): CTAs that need to win the eye (hero "Find my Match" button), active sidebar/tab state, rating stars, the "brand" badge variant. Deliberately rare — it marks the one thing on a screen that most wants attention.
- **Golden Cheer Hover** (`#F2A20C` / `golden-cheer-hover`): darker hover ramp used for secondary-CTA hover in some contexts.
- Note: `.btn-secondary`'s own hover state actually goes *lighter* (`#FDD65C`, secondary-400), not darker — the resting 500 is already the most saturated point, so hover eases off rather than deepening.

### Neutral
- **Surface** (`#FFFFFF` / `surface`): cards, modals, inputs, dropdowns — the "raised" white.
- **Canvas** (`#FBF9F8` / `canvas`): page background — warm off-white, never clinical pure white.
- **Ink** (`#1B1C1C` / `ink`): primary text and headings.
- **Muted** (`#434750` / `muted`): secondary text, placeholders, icons at rest.
- **Stroke** (`#C3C6D1` / `stroke`): borders, dividers, disabled/unfilled progress segments.

### Status
- **Success** (`#34C759`): confirmation states. Note badges use plain Tailwind `green-50`/`green-700`, not this token directly — see Named Rule below.
- **Error** (`#BA1A1A`): destructive actions, error borders/text, `.btn-danger`.

### Named Rules
**The Solid Icon Badge Rule.** A small icon badge (icon inside a circle, ~40-48px) needs a solid, saturated background (`bg-primary-500`) with a `text-white` icon, not a pale tint pair (`bg-primary-100`/`text-primary-700`). At icon scale, a thin-stroke lucide icon on a low-chroma pale circle reads as washed out even when it technically passes a contrast checker — tinted pairs are for badges/pills carrying text (see the Tinted-Pair Badge Rule), not for small standalone icon glyphs.

**The Explicit White Heading Rule.** `@layer base` in `index.css` hardcodes `h1`-`h6 { color: #1B1C1C }` (ink) directly on the element selector. A parent's `text-white` does **not** cascade past this — a heading on a dark or colored section background needs its own explicit `text-white` class, every time, or it silently renders as near-black ink on a dark surface. This is a real, repeat-prone bug in this codebase, not a hypothetical: check every new heading placed on a `bg-primary-500`/`bg-primary-800`/`bg-secondary-*` surface.

**The Sparing Gold Rule.** Golden Cheer marks the one action or state that should win the eye on a given screen. If more than one element on a screen competes in gold, the hierarchy has broken down.

**The Tinted-Pair Badge Rule.** Every badge variant is a `{color}-50` background with `{color}-700` text of the *same* hue family — `badge-blue` (primary-50/primary-700), `badge-brand` (secondary-50/secondary-700), `badge-green`/`badge-red`/`badge-yellow` (default Tailwind green/red/yellow, not the custom `success`/`error` tokens). Follow the existing hue family for a new badge variant; don't introduce a new tint formula.

## Typography

**Display/Heading Font (loaded, correct default):** Fredoka (weights 400-700), applied via the `@layer base` rule on all `h1`-`h6`.
**Body Font:** Plus Jakarta Sans (weights 400-700), applied to `body`.

**Character:** Fredoka is rounded and a little bouncy — it's what makes headlines feel warm instead of institutional. Plus Jakarta Sans is clean and modern underneath it, keeping body copy legible and professional so the system doesn't tip into "childish."

### Hierarchy
- **Display** (Fredoka, extrabold, `text-4xl` → `text-6xl` responsive clamp, `leading-[1.1]`): hero H1s.
- **Headline** (Fredoka, bold/semibold, `text-2xl`-`text-3xl`): section titles.
- **Title** (Fredoka, bold, `text-base`-`text-lg`): card titles, modal titles.
- **Body** (Plus Jakarta Sans, regular/medium, `text-sm`-`text-base`): paragraph and UI copy.
- **Label** (Plus Jakarta Sans, semibold, `text-xs`-`text-sm`): badges, form labels, nav items.

### Named Rules
**The Broken Heading Rule (fix before extending).** Tailwind's `font-heading` utility is configured to `Nunito Sans` and is explicitly applied to roughly 77% of headings across the app (77 of ~100 `<h1>`-`<h3>` occurrences, in `Modal`, `CardPetsitter`, `LandingPage`, most page headers). **Nunito Sans is never loaded** — no `@import`, no `<link>` — so every one of those headings silently falls back to the browser's default sans-serif instead of Fredoka or any deliberate typeface. The remaining ~23% of headings omit `font-heading` and correctly render Fredoka via the base-layer rule. This is a real, confirmed inconsistency, not a design choice: either load Nunito Sans (if the intent was ever a Nunito Sans/Plus Jakarta Sans pairing) or stop applying `font-heading` so Fredoka's base rule applies everywhere. Don't add new `font-heading` usages until this is resolved.

`index.html` also links Google Fonts' **Inter** (weights 300-900), which is referenced by no Tailwind class or CSS rule anywhere in the project — dead weight from an earlier pass.

## Layout

Content is contained to `max-w-7xl` with `px-4 sm:px-6 lg:px-8` horizontal padding — the standard container on landing, dashboards, and search. The public header/navbar is fixed at `h-20` (80px); page content below it compensates with `pt-20`. Two shell patterns exist: `PublicLayout` (fixed top navbar + centered nav links + footer, used for marketing/search/help) and the authenticated dashboard shell (`Navbar` + `Sidebar`, sidebar fixed on desktop, off-canvas drawer on mobile via a hamburger toggle). `AuthLayout` (login/register/match) drops the sidebar entirely for a centered, blob-decorated single-column flow. Breakpoints follow Tailwind defaults (`sm`/`md`/`lg`); mobile drawers and stacked-to-row flex layouts are the primary responsive mechanism, not a custom grid system.

## Elevation & Depth

Shadows are soft, diffuse, and blue-tinted rather than neutral gray or black — depth reads as "gentle glow," never a hard drop shadow. Cards sit nearly flat at rest and lift 1-2px with a stronger, larger-radius shadow on hover, which is the system's primary motion-of-elevation cue on interactive cards (`CardPetsitter`, list items).

### Shadow Vocabulary
- **card** (`0 1px 4px 0 rgba(36,79,140,0.06), 0 4px 16px 0 rgba(36,79,140,0.06)`): resting elevation for cards.
- **card-hover** (`0 4px 12px 0 rgba(36,79,140,0.10), 0 16px 40px 0 rgba(36,79,140,0.09)`): hover/interactive elevation, paired with a `-translate-y` lift.
- **btn** (`0 2px 8px 0 rgba(36,79,140,0.20)`): primary button resting shadow; `.btn-secondary` uses the same treatment tinted with the gold's own rgba.
- **navbar** (`0 1px 0 0 #E6EEF5`): a 1px hairline, not really a shadow — the fixed header separates from content with a thin cool-toned line rather than a cast shadow.

### Named Rules
**The No-Black-Shadow Rule.** Every shadow in the system is tinted with the brand blue's rgba (`rgba(36,79,140, …)`), never neutral black. A generic `shadow-lg`/`shadow-2xl` (as used once, in `Modal`'s panel) is the exception, not the pattern to copy forward.

## Shapes

**The Pill Rule.** Every interactive control is fully pill-shaped: buttons, inputs, badges, chips, nav links, the iOS-style toggle switch. This is the single most load-bearing shape decision in the system — a sharp-cornered button or input would immediately read as off-brand.

Non-interactive surfaces (cards, modals, dropdown menus) use large, soft corner radii instead — `rounded-2xl` (24px) for cards and dropdowns, `rounded-3xl` (32px) for large hero imagery and mobile modal sheets. Decorative backgrounds break the geometric grid entirely with irregular organic blobs (`blob-shape` / `blob-shape-alt`, asymmetric `border-radius` percentages) and hand-drawn SVG wave dividers between sections — both reinforce the "warm, natural, not corporate" read.

**The Gradient Wave Rule.** A wave divider's `<path>` fill is a `<linearGradient>` running from the current section's background color to the next section's, never a flat fill matching only the next color. A flat-fill wave still reads as a hard color-block cut with a decorative edge; the gradient is what actually makes the transition feel fluid. Give the wave enough vertical room (`viewBox` height ≥120, wrapper `h-24`) for the blend to be visible rather than a thin sliver. Two implementation details that matter as much as the gradient itself: (1) the `<svg>` needs an explicit `block` class — an inline (default-display) SVG reserves a few px of baseline whitespace below it, exactly like the classic "gap under an image" bug, and that gap shows the page's base background color as a stray pale line at the seam; (2) the wrapper `<div>` should carry a solid fallback `bg-*` matching the *next* section's color, so any residual sub-pixel gap between the SVG shape and its container shows the correct color instead of a mismatch.

## Components

### Buttons
- **Shape:** fully pill (`rounded-pill`, 9999px).
- **Primary:** background Trust Blue Hover (`#1D4073`), white text, `10px 20px` padding, `0 2px 8px rgba(36,79,140,0.20)` shadow; hover darkens to Trust Blue Dark (`#16315A`) with a `scale-[1.02]` lift; active deepens further.
- **Secondary:** background Golden Cheer (`#FCC019`), Trust Blue Deep text (`#003773`) for contrast, same padding/shadow pattern; hover *lightens* to `#FDD65C` rather than darkening.
- **Outline:** white background, 2px Trust Blue border, Trust Blue text; hover fills with `primary-50`.
- **Ghost:** no border/background at rest, muted text, background tints to `canvas` on hover — used for lower-emphasis actions (e.g. "Ver como funciona").
- **Danger:** solid `error` red, white text, same pill/padding pattern as primary.
- All variants share the same focus treatment: 2px ring in the button's own hue at 40% + 2px ring-offset.

### Badges
- **Style:** small pill (`rounded-full`), `px-2.5 py-0.5`, `text-xs font-semibold`.
- **Variants:** each is a same-hue tint pair — `badge-blue` (trust-blue-50/700), `badge-brand` (golden-cheer-50/700), `badge-green`/`badge-yellow`/`badge-red` (stock Tailwind tints), `badge-gray` (canvas bg / muted text).

### Cards / Containers
- **Corner style:** `rounded-2xl` (24px).
- **Background:** `surface` white.
- **Shadow strategy:** `card` at rest, `card-hover` + `-translate-y-1.5` to `-2px` on hover for anything clickable (see Elevation & Depth).
- **Border:** none at rest; the system leans on shadow, not border, for card separation.
- **Internal padding:** `24px` (`p-6`); image-led cards like `CardPetsitter` use `p-0` on the outer card and pad only the body (`p-4`).

### Signature: Photo-Anchored Feature List
A recurring landing-page composition: a blob-shaped photo (`blob-shape`/`blob-shape-alt`) anchors the section, with short feature/step items arranged around it rather than in a uniform card grid — used for both "Como funciona o Match Inteligente" (photo left, numbered steps right) and "Nossos Serviços" (photo centered, icon+label items flanking left and right). Items in this pattern stay minimal — icon plus one line of text, no description paragraph, no buttons — the photo carries the warmth and the surrounding items stay quick to scan. Reach for this instead of a same-size card grid when a section's content is a short list orbiting one strong image. Icon badges in this pattern are solid `bg-primary-500` circles with a `text-white` icon (see the Solid Icon Badge Rule below) — not the pale tinted circles used elsewhere.

### Inputs / Fields
- **Style:** pill-shaped, white background, 2px `stroke`-colored border (`.input-field`); a borderless "flat" variant (`.input-flat`) uses a `canvas`-tinted fill instead of a visible border, for denser forms (e.g. pet profile fields).
- **Focus:** border shifts to `primary-400` plus a soft `primary-100` ring — a glow, not a hard outline.
- **Disabled:** background shifts to `canvas`, text to `muted`.

### Navigation
- **Public navbar:** fixed, white, `h-20`, hairline bottom shadow (`shadow-navbar`), centered nav links that go `muted → golden-cheer` on hover — gold, not blue, is the nav-link hover color, a deliberate departure from "blue = interactive."
- **Dashboard sidebar:** pill nav links (`sidebar-link`); active state fills solid Golden Cheer with Trust Blue Deep text and a soft shadow (`sidebar-link-active`) — the same "gold marks the current/important thing" logic as buttons.
- **Mobile:** both header and sidebar collapse to a hamburger-triggered off-canvas drawer; the public navbar's mobile menu also gets its own `animate-slide-up` entrance.

### Modal
- Bottom sheet on mobile (`rounded-t-3xl`, slides from `items-end`), centered dialog on `sm:` and up (`rounded-2xl`). Header and footer are `flex-shrink-0` and pinned outside the scrollable body (`min-h-0 overflow-y-auto` on the body) so footer action buttons are never scrolled out of view — a deliberate, commented-on layout decision in the source, not incidental.

### Signature: Ambient Blobs & Step Progress
- **Ambient Blobs** (`AmbientBlobs`): three blurred, pulsing color orbs (`blur-3xl`, staggered `animation-delay`) absolutely positioned behind auth and match-wizard content — the system's signature "warmth in the background" device, always inside a `relative overflow-hidden` container, always `-z-10` and `pointer-events-none`.
- **Step Progress** (`StepProgress`): the Match Wizard's segmented pill progress bar — filled segments in Trust Blue, unfilled in `stroke`, paired with a "Passo X de N" label and optional blue badge.

## Do's and Don'ts

### Do:
- **Do** keep every interactive control pill-shaped (`rounded-pill`). A rectangular or barely-rounded button/input is the clearest possible off-brand signal in this system.
- **Do** treat Golden Cheer as scarce — one CTA or active state per screen, per the Sparing Gold Rule. Flooding a screen with gold flattens the hierarchy it exists to create.
- **Do** tint shadows with the brand blue's rgba (`rgba(36,79,140, …)`), never plain black, per the No-Black-Shadow Rule.
- **Do** use Trust Blue Deep (`#003773`) as text on Golden Cheer surfaces — it's the system's established high-contrast pairing (hero eyebrow, active sidebar link, secondary button text), not an arbitrary dark blue pick.
- **Do** use organic blob shapes or the `AmbientBlobs` component (never a static gradient rectangle) when a surface needs decorative background warmth — hero, auth, match wizard.

### Don't:
- **Don't** design anything that reads as cold, clinical, or corporate-SaaS — that's PetUno's explicitly confirmed anti-reference. Sharp corners, flat enterprise-blue panels, and hard black shadows all violate it.
- **Don't** build against `dark:` variants or reintroduce `darkMode: 'class'` in `tailwind.config.ts` without a deliberate decision to support a dark theme. PetUno is light-only by design; the config and zero `dark:` usages now agree.
- **Don't** add more `font-heading` usage without first resolving the Broken Heading Rule above — Nunito Sans isn't loaded, so it currently does nothing but strip out the correct Fredoka fallback.
- **Don't** introduce a new badge tint formula. Follow the Tinted-Pair Badge Rule (`{hue}-50` background / `{hue}-700` text) for any new badge variant.
