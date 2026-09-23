# MIGRATION-GUIDE.md — Webflow → Astro/TS/React/ShadCN/Tailwind

> Read `AGENTS.md` first. This guide is the executable playbook for migrating
> **every component** in the raw Webflow export to the target stack.
> Golden rules recap: English only · no `useEffect` · no Radix (Base UI via
> ShadCN `base-nova`) · no jQuery/Webflow runtime/GSAP CDN · raw `*.html`
> files are read-only reference · never touch folder permissions.

---

## Phase 0 — Know what you are migrating (component inventory)

Measured across all 69 pages (counts are raw occurrences):

| # | Webflow construct | Count | Found as |
| --- | --- | --- | --- |
| 1 | Layout grid | 784 | `w-layout-grid` |
| 2 | Link w/ hover text-swap | ~3200 | `.link-rows-wrapper` > 2× `.link-content-flex` (2nd `.is-absolute`) |
| 3 | Buttons | ~270 | `.primary-button` + `.button-dot`, `.button-icon-left/right`, `.button-content-flex` |
| 4 | Nav header + mega dropdown | 203 / 204 | `w-nav`, `w-dropdown` (`data-hover="true"`) |
| 5 | Footer + subscribe form | every page | `Footer Form` (65×), social icon fonts |
| 6 | Forms | 326 elements | `w-form`, `w-input`, `w-select`, `w-form-done`, `w-form-fail`, custom checkbox/radio |
| 7 | CMS collection lists | 53 lists / 194 items | `w-dyn-list`, `w-dyn-item`, `w-pagination` |
| 8 | Tabs | 7 widgets / 118 nodes | `w-tabs`, `w-tab-menu`, `w-tab-pane` |
| 9 | Slider | 25 | `w-slider`, `w-slider-mask`, arrows |
| 10 | Lightbox | 13 | `w-lightbox` |
| 11 | Background video | 14 | `w-background-video` (mp4/webm on CDN) |
| 12 | Cards | 224+ | `.card` (services, portfolio, blog, team, testimonial) |
| 13 | Marquee | heavy | `.marquee*` rows (brand/logo/award tickers) |
| 14 | Counters | 0 used (head-guard only) | `.counter-number-wrap.one…five` — defined in CSS/JS guard but **no page renders them**; recipe 2.13 kept for future use |
| 15 | Text reveal | 73 | `.text-reveal-paragraph` (SplitText) |
| 16 | Parallax sections | 147 mentions | `.parallax-section`, `.parallax-animation-content` (ScrollTrigger) |
| 17 | Accordion / FAQ dropdowns | 179 | custom `.dropdown-*` blocks |
| 18 | Icon fonts | heavy | `Filled/Line Rounded/Line Squared/Social Media Icon Font Brix` |
| 19 | Badges | 74+ | `data-wf--badges-tertiary--*` variants |
| 20 | BRIX promo badge | 138 | `.more-templates-*`, Lottie — **drop, not site UI** |

Build order is always: **tokens → primitives → site components → sections →
pages → collections**. Never start a page before its components exist.

---

## Phase 1 — The 7-step component migration loop (apply to every component)

Run this loop once per component, smallest first:

1. **Locate the source.** Find the component's HTML in a raw page
   (e.g. `Select-String -Path home-pages\home-v1.html -Pattern 'primary-button' -Context 0,6`).
2. **Extract its CSS.** Find every rule for its classes in
   `reference/webflow.shared.css`:
   `Select-String -Path reference\webflow.shared.css -Pattern '\.primary-button' -Context 0,12`
   (the file is minified — match `\.class[^{]*\{[^}]*\}` with regex if needed).
3. **Map to tokens.** Replace raw values with the tokens already in
   `app/src/styles/global.css` (colors, spacing, radii, tracking). If a value
   has no token, add one named after the Webflow variable
   (`--core--sizes--margins--sm` → `--space-sm: 24px`), never a magic number.
4. **Choose the implementation type:**
   - **Pure presentational** → `.astro` component, Tailwind classes only.
   - **Interactive** (dropdown, tabs, slider, lightbox, accordion, mobile
     menu, form) → React island in `app/src/components/islands/` built on
     **Base UI** primitives via ShadCN (`npx shadcn@latest add <x>`), hydrated
     with `client:visible` (default) or `client:idle` (header/footer).
   - **Scroll/reveal animation** → CSS first; tiny Astro `<script>` with
     `IntersectionObserver` only when CSS can't express it. Never `useEffect`.
5. **Rebuild the DOM 1:1.** Same visual structure, same content, same hover /
   focus / active states, responsive at Webflow breakpoints
   (991px tablet, 767px mobile-landscape, 479px mobile). Strip `data-w-id`,
   `data-wf-*`, `w-*` classes and Webflow-generated `style` attributes.
6. **Verify.** `npm run lint`, `npm run build`, then Playwright MCP: screenshot
   raw page vs `astro dev` page at 1440/991/767/479 and diff.
7. **Register it.** Add the component to the checklist at the bottom of this
   file so nothing is migrated twice.

Directory layout for migrated code:

```text
app/src/
  components/ui/        # ShadCN (Base UI) primitives — CLI-managed
  components/site/      # Header.astro, Footer.astro, Link.astro, …
  components/sections/  # Hero.astro, Marquee.astro, CtaForm.astro, …
  components/islands/   # React islands: NavMenu.tsx, Faq.tsx, …
  layouts/  content/    lib/  styles/
```


---

## Phase 2 — Component playbooks (A → Z)

### 2.1 Link with hover text-swap (`components/site/Link.astro`) — do this FIRST
Webflow renders two stacked copies of the label; the second is
`.is-absolute` (`opacity: 0`) and slides/fades in on hover. Migrate as pure CSS:

```astro
---
const { href, label, dark = false } = Astro.props;
---
<a href={href} class:list={["group relative inline-flex overflow-hidden", dark && "text-neutral-100"]}>
  <span class="transition-transform duration-300 group-hover:-translate-y-full">{label}</span>
  <span aria-hidden="true" class="absolute inset-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">{label}</span>
</a>
```
Used ~3200× — every nav item, button label, footer link. No JS, no island.

### 2.2 Buttons (`components/site/SiteButton.astro` or ShadCN `button` variants)
`.primary-button` = pill, dot (`.button-dot`) that scales on hover, arrow
icons left/right (`.button-icon-left/right`). Extend `components/ui/button.tsx`
with `variant: "primary" | "outline" | "secondary"` already present; add the
dot + icon-swap as CSS (`group-hover:` on `rounded-full` dot). Keep the
Webflow `--radius-sm: 24px` pill. Match hover/active (icon slides in from
`translate3d(-8px,0,0)` → `0`).

### 2.3 Header + mega dropdown (`components/site/Header.astro` + `islands/NavMenu.tsx`)
`w-nav` with `w-dropdown data-hover="true"` (open on hover, `data-delay="0"`)
and a 4-column mega grid (`.nav-menu-grid-4-columns`) plus hamburger
(`.hamburger-menu-line`) under 991px.
- `npx shadcn@latest add navigation-menu` (Base UI Menu/Popover — supports
  hover intent without effects; state lives in the primitive).
- Desktop: hover-open mega menu; mobile: full-screen overlay menu island,
  hamburger lines animate via CSS `aria-expanded` selectors.
- Hydrate with `client:idle`. Sticky/blur-on-scroll: CSS `position: sticky` +
  a 5-line Astro `<script>` toggling a `data-scrolled` attribute.

### 2.4 Footer (`components/site/Footer.astro`)
Dark section, logo, nav columns, social icons, subscribe form
(`Footer Form`, email `w-input` + `w-button`). Static Astro except the form
(2.6). Social icon font → lucide (`Facebook`, `Instagram`, `Linkedin`) or
inline SVG downloaded to `public/assets/icons/`.

### 2.5 Icon fonts → lucide-react / inline SVG
The 4 BRIX icon fonts have no Unicode meaning in code — during migration,
render the raw page, read each glyph visually, and map to the closest
`lucide-react` icon (`ArrowUpRight`, `Check`, `Play`, …) or download the
equivalent SVG from the CDN. Keep a mapping table in `app/src/lib/icons.ts`.
Never ship the `.woff` icon fonts.

### 2.6 Forms (`islands/SubscribeForm.tsx`, `islands/ContactForm.tsx`, `islands/QuoteForm.tsx`)
Source forms: `Footer Form`, `CTA V1 Form`, contact forms v1–v3,
`request-a-quote` (multi-field with `w-select` Service + custom radio/checkbox).
- `npx shadcn@latest add input textarea select checkbox radio-group label`
- Success/error = Webflow's `w-form-done` / `w-form-fail` blocks → React
  `useState` on `onSubmit` (`event.preventDefault()`, `fetch`, then set
  status — event-handler state, **not** `useEffect`).
- Static-host friendly: post to a placeholder `action="/api/contact"` and
  document that the endpoint is wired at deploy time (Formspree/Astro action).
- Validation: native `required`/`type="email"` + Base UI Field.

### 2.7 Cards (`components/site/cards/*`)
One `.card` base → variants: `ServiceCard`, `PortfolioCard` (image +
hover zoom + arrow badge), `PostCard` (image, category badge, date),
`TeamCard` (photo, role, socials), `TestimonialCard`. Pure Astro + Tailwind;
image hover zoom = `group-hover:scale-105 transition-transform`.

### 2.8 Tabs (`islands/Tabs.tsx` ← `w-tabs`)
`npx shadcn@latest add tabs`. Map `w-tab-menu` → `TabsList`,
`w-tab-pane` → `TabsContent`. Base UI Tabs manages selection internally — no
effects. Used in services/process/pricing sections.

### 2.9 Slider / testimonial carousel (← `w-slider`)
Dependency-free: CSS `scroll-snap` track + prev/next buttons wired by a small
Astro `<script>` (`track.scrollBy({left: …})`). Only upgrade to a React island
if autoplay/drag is required — then Embla (`embla-carousel-react`), still
without `useEffect` (its API is ref-callback based).

### 2.10 Lightbox (← `w-lightbox`, 13 uses)
`npx shadcn@latest add dialog` → `islands/Lightbox.tsx`. Trigger = image
thumbnail; Base UI `Dialog` handles focus trap/escape/scroll-lock without
effects. For video lightboxes, mount the `<video>` only while open via
`Dialog.Portal` conditional render.

### 2.11 Background video (← `w-background-video`, 14 uses)
Native HTML, zero JS:

```astro
<video class="absolute inset-0 h-full w-full object-cover" autoplay muted loop playsinline
  poster="/assets/video/hero-poster.jpg">
  <source src="/assets/video/hero.webm" type="video/webm" />
  <source src="/assets/video/hero.mp4" type="video/mp4" />
</video>
```
Download both transcodes + poster from the CDN during asset localization (Phase 5).

### 2.12 Marquee (← `.marquee*`)
Pure CSS infinite loop. Duplicate the list in markup (`aria-hidden` on the copy):

```css
@keyframes marquee { to { transform: translateX(-50%); } }
.marquee-track { display: flex; width: max-content; animation: marquee 30s linear infinite; }
.marquee:hover .marquee-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
```
Match the original duration by measuring px/s in the raw page (DevTools).

### 2.13 Counters (← `.counter-number-wrap.one…five`)
> **Phase 0 finding:** counters are defined in the CSS/JS head-guard but no
> raw page actually renders them. Skip this component unless a future design
> needs it; the recipe below is kept for reference.

The export hides counters until JS runs (`visibility: hidden` guard in
`<head>`). Migrate with a framework-free Astro `<script>`:

```astro
<span class="counter" data-target="250">0</span>
<script>
  const io = new IntersectionObserver((entries) => {
    for (const e of entries.filter((x) => x.isIntersecting)) {
      const el = e.target; io.unobserve(el);
      const target = Number(el.dataset.target); const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1500, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.4 });
  document.querySelectorAll(".counter").forEach((el) => io.observe(el));
</script>
```

### 2.14 Text reveal (← `.text-reveal-paragraph`, SplitText)
Split into words **at build time** in Astro frontmatter (no runtime SplitText):
`text.split(" ")` → `<span>` per word with `animation-delay: i * 40ms` +
`@keyframes reveal-up { from { opacity: 0; transform: translateY(1em) } }`,
triggered by CSS scroll-driven animations (`animation-timeline: view()`) with
an IntersectionObserver `.is-visible` fallback for older browsers.

### 2.15 Parallax (← `.parallax-section`, ScrollTrigger)
CSS scroll-driven: `@supports (animation-timeline: scroll())` →
`transform: translateY()` keyframes on the background layer; fallback = static
image (acceptable graceful degradation, no JS needed).

### 2.16 Accordion / FAQ (← custom `.dropdown-*`, 179 uses)
`npx shadcn@latest add accordion` → Base UI Accordion keeps open-state
internally. Chevron rotates with `group-data-[open]:rotate-180`.

### 2.17 Pagination (← `w-pagination`, 6 uses)
Static: numbered `<a>` links generated by `getStaticPaths` `paginate()` in
Astro. No client JS.

### 2.18 Explicitly DROPPED
`.brix-badges-wrapper` / `.more-templates-*` Lottie promo, `webflow.js`,
jQuery, `webfont.js` (replaced by `@fontsource-variable/inter-tight`),
GSAP CDN bundles, all `data-w-id` IX2/IX3 bindings, password-page lock.

---

## Phase 3 — CMS collections (replaces `w-dyn-list` / `w-dyn-item`)

Create Astro Content Collections in `app/src/content/` mirroring the Webflow
collections; one Markdown/MDX file per CMS item, frontmatter = CMS fields:

| Collection | Source folder | Items | Key frontmatter fields |
| --- | --- | --- | --- |
| `services` | `services/*.html` | 15 | title, slug, excerpt, icon, image, order |
| `portfolio` | `portfolio/*.html` | 4 | title, client, location, year, services[], gallery[] |
| `posts` | `blog-posts/*.html` | 7 | title, slug, category, date, author, heroImage, readingTime |
| `categories` | `blog-categories/*.html` | 3 | title, slug, description |
| `team` | `team/*.html` | 8 | name, role, photo, socials, bio |

Steps per collection:
1. Define the schema in `src/content.config.ts` (`z.object({...})`).
2. Extract content from each raw HTML detail page into `.md` files
   (title from `<h1>`, meta from the page head, body from the rich-text block).
3. Index page: `getCollection()` → grid of cards. Detail pages:
   `getStaticPaths()` → `src/pages/services/[slug].astro` etc.
4. Related-items rails ("More posts", "Other services") = filtered
   `getCollection()` at build time.

## Phase 4 — Page migration workflow (repeat for all 69 routes)

Order: `home-v1` → `index.astro` first (it is the design-system showcase),
then about/team/services/portfolio indices, then CMS detail templates, then
blog, then contact/landing/utility, then 401/404.

Per page:
1. Read the raw HTML top-to-bottom; list its sections
   (`Select-String -Pattern '<section'`).
2. For each section, reuse an existing `components/sections/*` or create it
   via the 7-step loop (Phase 1).
3. Assemble the page in `app/src/pages/**` with `Base.astro` (SEO props:
   title, description, og:image — copy from the raw `<head>`).
4. Replace every CDN URL with a localized `/assets/…` path (Phase 5).
5. `npm run lint && npm run build` → Playwright MCP screenshot diff at
   1440/991/767/479 against the raw file opened via `file://` or a static
   server → fix until visually identical.
6. Tick the page in the checklist below.

## Phase 5 — Asset localization

```powershell
# Collect every unique CDN asset URL from the export:
$urls = Get-ChildItem -Recurse -Filter *.html |
  Get-Content -Raw |
  ForEach-Object { [regex]::Matches($_, 'https://cdn\.prod\.website-files\.com/[^")\s]+') } |
  ForEach-Object { $_.Value } | Sort-Object -Unique
# Download each into app\public\assets\<images|icons|video>\ and rewrite
# references to /assets/... (do this during each component's step 5/6).
```
Keep original filenames (they contain the content hash — stable and unique).

## Phase 6 — Definition of done (per component AND per page)

- [ ] `npm run lint` — 0 errors (anti-slop included)
- [ ] `npm run build` — clean
- [ ] Playwright MCP visual diff at 4 breakpoints — identical
- [ ] No `useEffect` / `@radix-ui/*` / `webflow.js` / jQuery / GSAP
- [ ] No CDN hotlinks left on the page
- [ ] `prefers-reduced-motion` respected for every animation
- [ ] antislop-ui review passed (no generic AI-slop patterns)

## Component checklist

- [x] Link (hover text-swap) — `components/site/Link.astro` · [x] SiteButton — `components/site/SiteButton.astro` · [x] Badge — `components/site/Badge.astro` · [x] Icon mapping — `lib/icons.ts` + `SocialIcon.astro` (brand icons as inline SVG)
- [x] CircleButton — `components/site/CircleButton.astro` (bonus, needed by cards) · [x] marquee/reveal-up keyframes + reduced-motion guard in `global.css`
- [x] Header + mega menu — `site/Header.astro` (CSS hover dropdown, 4-column mega grid) · [x] Mobile menu — `[data-open]` script + morphing hamburger · [x] Footer + SubscribeForm — `site/Footer.astro` + `islands/SubscribeForm.tsx`
- [x] Input/Textarea/Select/Checkbox/Radio (ShadCN Base UI) · [x] ContactForm — `islands/ContactForm.tsx` · [x] QuoteForm — `islands/QuoteForm.tsx`
- [x] ServiceCard · [x] PortfolioCard · [x] PostCard · [x] TeamCard · [x] TestimonialCard — all in `components/site/cards/`
- [x] Tabs — `islands/SiteTabs.tsx` · [x] Accordion/FAQ — `islands/FaqAccordion.tsx` · [x] Slider — `site/Slider.astro` (scroll-snap + script) · [x] Lightbox — `islands/Lightbox.tsx` · [x] BackgroundVideo — `site/BackgroundVideo.astro`
- [x] Marquee — `site/Marquee.astro` · [x] Counter — SKIPPED (unused in raw export, Phase 0 finding) · [x] TextReveal — `site/TextReveal.astro` · [x] Parallax — `parallax-layer` utility · [x] Pagination — `site/Pagination.astro`
- [ ] Collections: services, portfolio, posts, categories, team
- [ ] Pages: 69/69 (track per-page status in AGENTS.md migration status)

