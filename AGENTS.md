# AGENTS.md — Archipro Webflow → Astro Migration

> **Read this file first, before any task.** Every AI agent working in this
> repository MUST follow this file. It is the single source of truth for the
> migration, the toolchain, and the quality gates. If instructions elsewhere
> conflict with this file, this file wins (then `app/AGENTS.md` for
> Astro-specific dev-server notes). For step-by-step component/page migration
> instructions, follow **`MIGRATION-GUIDE.md`**.

## Ground rules (non-negotiable)

1. **Always work in English** — code, comments, commits, docs, chat.
2. **Never modify the raw Webflow export.** All `*.html` files and the 13
   page folders at the repository root are the immutable UI/UX reference.
   Copy from them; never edit, move, rename, or delete them.
3. **Never change folder/file permissions** (no `icacls`, `chmod`, ACL edits).
4. **No `useEffect`** anywhere in migrated code. Use, in order of preference:
   CSS animations/transitions, Astro inline `<script>` (vanilla, framework-free),
   React event handlers, derived state during render, ref callbacks, and
   `key`-based remounts. Webflow interactions (`data-w-id`, IX2/IX3) become
   CSS/Tailwind animations or tiny Astro scripts — not effects.
5. **No Radix UI.** ShadCN components use the Base UI style (`base-nova`,
   `@base-ui/react`). Never add `@radix-ui/*` packages.
6. **No legacy code**: no jQuery, no Webflow runtime JS (`webflow.js`,
   IX2), no class-based React, no CommonJS, no `var`.
7. All new code lives in `app/` (the Astro project). `reference/` holds
   extracted design assets; it is read-only reference material.

## Target stack (already scaffolded in `app/`)

| Layer | Choice | Version |
| --- | --- | --- |
| Framework | Astro (static output) | ^7.3.3 |
| Language | TypeScript (`astro/tsconfigs/strict`) | — |
| Islands | React | ^19.3.0 |
| Components | ShadCN UI, style `base-nova` (Base UI, **no Radix**) | CLI ^4.21 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + `tw-animate-css` | ^4.3.3 |
| Icons | lucide-react | ^1.47 |
| Font | Inter Tight variable via `@fontsource-variable/inter-tight` — matches the Webflow original | — |
| Linting | oxlint + vendored `anti-slop` plugin (dmmulroy) | 1.85.0 |

## Raw Webflow export — structure study (the migration source)

**Template:** "Archipro" by BRIX Templates — architecture-firm site.
**Published:** 2026-04-22. **69 HTML pages**, all sharing one stylesheet
(`reference/webflow.shared.css`, 330 KB) and one font family
(**Inter Tight** 300–700). All images/SVGs are served from the Webflow CDN
(`cdn.prod.website-files.com/6883a66d1ebb4685edc545ce/...`) — download them
into `app/public/assets/` during migration; do not hotlink in the final site.

### Page inventory (route → source file)

| Section | Pages |
| --- | --- |
| Home variants | `home-pages/home-v1\|v2\|v3.html` |
| Company | `company-pages/about.html`, `company-pages/team.html` |
| Services index | `service-pages/services.html` |
| Service details (CMS, 15) | `services/*.html` (architectural-design, interior-design, 3d-rendering-visualization, …) |
| Portfolio index | `portfolio-pages/portfolio.html` |
| Portfolio details (CMS, 4) | `portfolio/*.html` |
| Blog variants | `blog-pages/blog-v1\|v2\|v3.html` |
| Blog posts (CMS, 7) | `blog-posts/*.html` |
| Blog categories (CMS, 3) | `blog-categories/{construction,design,remodeling}.html` |
| Team members (CMS, 8) | `team/*.html` |
| Contact variants | `contact-pages/contact-v1\|v2\|v3.html` (+ email/phone placeholder pages — skip) |
| Landing | `landing-pages/coming-soon.html`, `landing-pages/request-a-quote.html` |
| Template utility | `template-pages/{start-here,styles-components,changelog,licenses}.html`, root `401.html`, `404.html`, password page |

### Recurring Webflow constructs → migration mapping

| Webflow construct | Migrate to |
| --- | --- |
| `w-nav` / `w-nav-menu` header | `app/src/components/site/Header.astro` + Base UI `NavigationMenu` island |
| `w-dropdown` (hover menus) | Base UI `Menu`/`Popover` (React island, no `useEffect`) |
| `data-w-id` IX2 scroll animations, `.text-reveal-paragraph`, `.parallax-section`, counters | CSS scroll-driven animations / `tw-animate-css` / tiny Astro `<script>` with `IntersectionObserver` |
| `w-layout-grid` | Tailwind `grid` utilities |
| Lottie badge (`brix-badges-wrapper`, "More Templates" promo) | **Drop it** — BRIX template marketing, not site UI |
| CMS collections (services, portfolio, posts, team, categories) | Astro Content Collections (`src/content/`) with `getStaticPaths` |
| Utility pages (styles-components, changelog, licenses, start-here) | Keep as plain Astro pages (they document the design system) |
| SEO meta/OG per page | `src/layouts/Base.astro` with per-page props |

### Design tokens

Extracted 1:1 to `reference/design-tokens.css` (153 variables) and mapped
into the Tailwind v4 theme in `app/src/styles/global.css`. Key values:
container **1228px**, primary **#f6694b**, neutrals
`#fff/#f6f6f6/#e7e7e7/#d0d0d0/#a0a0a0/#717171/#424242/#121212`,
secondary accents `#80896d/#fef9f3/#c4afa1/#ffa693/#ced8ba`,
letter-spacing **-0.03em**, radius scale 8/16/24/32px.


## Installed agent tooling (verified working)

### Agent skills — `.agents/skills/` (project-level, 51 skills)

| Source repo | Skills installed |
| --- | --- |
| `miqdadbadjuber/anti-slop` | `antislop`, `antislop-ui`, `antislop-code`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile` — core rules in `.agents/rules/antislop.md` (R-01…R-38). Apply `antislop-ui` for every UI task. |
| `addyosmani/agent-skills` | 25 lifecycle skills: `idea-refine`, `spec-driven-development`, `planning-and-task-breakdown`, `test-driven-development`, `code-review-and-quality`, `security-and-hardening`, `performance-optimization`, `shipping-and-launch`, etc. |
| `JuliusBrussee/caveman` | `caveman`, `caveman-compress`, `caveman-explore`, `caveman-review`, `cavecrew`, `investigate-first`, `lean-build`, `migration`, `safe-refactor`, `surgical-patch`, `verify-and-stop`, … (token-efficient workflows) |
| `dmmulroy/anti-slop` | vendored as an **Oxlint plugin** at `app/tools/oxlint/anti-slop/` (see `UPSTREAM.md` there for provenance) |

### MCP servers — `.mcp.json` (project root)

| Server | Command | Verified |
| --- | --- | --- |
| `playwright` (microsoft/playwright-mcp) | `npx -y @playwright/mcp@0.0.82` | ✅ `--help` OK |
| `lexa` (anvia-hq/lexa) | `lexa mcp .` (binary at `%LOCALAPPDATA%\Lexa\bin\lexa.exe`) | ✅ indexed `app/src` (154 symbols) |
| `codedb` (justrach/codedb) | `codedb mcp` (binary at `%LOCALAPPDATA%\Programs\codedb\codedb.exe`) | ✅ CLI OK |

### Local CLIs

- `lexa 0.10.1` — local code-graph intelligence (`lexa index .`, `lexa brief "<task>"`).
- `codedb 0.2.5856` — code intelligence + MCP toolset.
- `lsp-ai 0.7.1` — LSP server for editor AI features, at
  `%LOCALAPPDATA%\Programs\lsp-ai\lsp-ai.exe` (added to user PATH). It is an
  **editor-side** tool: point your editor's LSP client at `lsp-ai` and
  configure a model backend per the project wiki; it is not an MCP server.

## Commands

```powershell
cd app
npm run dev                 # Astro dev server (use `astro dev --background` for agents)
npm run build               # production build → app/dist
npm run lint                # oxlint + vendored anti-slop rules
npm run build:lint-plugin   # re-bundle anti-slop plugin after editing vendored rules
```

## Quality gates — run before calling any task done

1. `npm run lint` — 0 errors (anti-slop rules included).
2. `npm run build` — passes with no type errors.
3. Visual parity: compare the built page against the corresponding raw
   Webflow HTML (use the Playwright MCP to screenshot both and diff).
4. `antislop-ui` review for any new UI; no generic AI-slop patterns.
5. No `useEffect`, no `@radix-ui/*`, no Webflow runtime JS — grep to prove it:

```powershell
Select-String -Path app\src\**\* -Pattern 'useEffect','radix-ui','webflow.js' # must be empty
```

## Migration status

- [x] Astro + TS + React + Tailwind v4 + ShadCN (Base UI) scaffold in `app/`
- [x] Design tokens migrated to Tailwind theme (`app/src/styles/global.css`)
- [x] Agent skills, MCP servers, and lint tooling installed & verified
- [x] **Phase 0 — inventory & extraction** (`reference/`): `page-sections.md`
  (69 pages × sections × widgets), `cms-inventory.md` (5 collections),
  `assets-inventory.txt` (595 CDN URLs), `css-facts.md` (breakpoints, type
  scale, runtime facts), `components/*.html` (21 canonical snippets)
- [ ] Shared layout: `Base.astro`, `Header.astro`, `Footer.astro`
- [ ] Page migration (69 pages; start with `home-v1` → `src/pages/index.astro`)
- [ ] Content Collections for services, portfolio, blog, team, categories
- [ ] Asset localization from Webflow CDN to `app/public/assets/`
- [ ] Visual-parity pass per page via Playwright MCP
