# CSS & runtime facts (extracted from reference/webflow.shared.css + raw pages)

## Breakpoints (Webflow media queries actually used)
| Query | Tailwind equivalent |
| --- | --- |
| `min-width: 1920px` | custom `3xl` |
| `min-width: 1440px` | custom `2xl`-ish |
| `max-width: 991px` | `lg`/`md` boundary (tablet; nav collapses here) |
| `max-width: 767px` | `md`/`sm` boundary (mobile landscape) |
| `max-width: 479px` | `<sm` (mobile portrait) |

Container: `--global--container--default: 1228px` (`container-default`), inner
`inner-container` wraps most sections.

## Fonts
- Site font: **Inter Tight** 300/400/500/600/700 (Google Fonts via webfont.js
  in raw; migrated to `@fontsource-variable/inter-tight` in `app/`).
- 4 BRIX icon fonts (glyph mapping needed during component migration —
  see MIGRATION-GUIDE 2.5; never ship these):
  - `Line Rounded Icon Font Brix` → `...5de_line-rounded-icon-font-brix.woff2`
  - `Line Squared Icon Font Brix` → `...5df_line-squared-icon-font-brix.woff2`
  - `Filled Icon Brix` → `...5e1_filled-icon-brix.woff2`
  - `Social Media Icon Font Brix` → `...6f3_Social-Media-Icon-Font-Brix.woff`

## Type scale (display-N → px; weight 500, tracking -0.03em, line-height 1.25)
display-1 14 · display-2 16 · display-3 18 · display-4 20 · display-5 24 ·
display-6 30 · display-7 36 · display-8 48 · display-9 60 · display-10 72
Headings: h1=display-8 (48px), h2=display-7 (36), h3=display-5 (24),
h4=display-4 (20), h5=display-3 (18), h6=display-1 (14).
Paragraphs: rg 16px / sm 14px / lg 18px, line-height 1.5em.

## Runtime/JS facts (what the raw site actually does)
- Every page loads jQuery 3.5, webflow.js chunks, GSAP 3.15 + ScrollTrigger +
  SplitText + Observer from CDN — **all dropped in migration**.
- A `<head>` guard hides `.text-reveal-paragraph`, `.parallax-section`,
  `.counter-number-wrap.one…five`, `.section-background-image` until JS runs.
  → In Astro, use the opposite pattern: visible by default, animate in with
  CSS `animation-timeline: view()` / IntersectionObserver.
- **Counters are never actually used** — no page contains
  `class="counter-number-wrap"` in body markup (only the head guard mentions
  them). Skip 2.13 unless a design later needs it.
- **Marquee** is driven by a per-page inline `<script>` animating
  `.marquee-scroll-item` elements (GSAP Observer-free loop). Markup classes:
  `.marquee---logo-strip-wrapper` / `-horizontal` / `-image-wrapper`,
  `.marquee---testimonial-*`. Reference: `components/marquee.html` +
  `components/marquee-script.html` (timing/behavior). Migrate to the pure-CSS
  marquee from MIGRATION-GUIDE 2.12.
- Header is `<div class="header-wrapper w-nav" data-collapse="medium">`
  (not a `<header>` element); nav collapses at 991px ("medium").
- Forms post to Webflow (`data-wf-*` ids); `w-form-done`/`w-form-fail` blocks
  are pre-rendered siblings toggled by webflow.js.

## Assets
See `assets-inventory.txt`: 466 images, 109 SVG icons, 6 videos (mp4+webm
pairs), 4 icon fonts, 1 Lottie JSON (BRIX promo — drop), 9 misc.
