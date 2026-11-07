# Archipro — Astro rewrite

The production candidate is in **app/**. The repository root still contains
the **original Webflow HTML export** and **reference/** materials for
side-by-side visual comparisons. The root HTML files are **not** the Astro
application or its deployment entrypoint.

## Stack

- Astro 7 with TypeScript, React 19 islands, and the Astro Node adapter
- Tailwind CSS 4
- shadcn/ui components built on Base UI (**no Radix**)
- Native CSS animations and small browser scripts where React is unnecessary

No new features should depend on Webflow JavaScript, jQuery, GSAP, or React
`useEffect`. Names inherited from original image assets are not runtime
dependencies.

## Run and verify

Use Node 22.12 or newer, from the `app/` directory:

```sh
npm ci
npm run build:lint-plugin
npm run lint
npm run build
npm run check:rewrite -- --require-build
npm run dev
```

For the standalone Node deployment, build and then start
`node dist/server/entry.mjs` from `app/`. Do **not** publish the root
`index.html` or root page folders as the rewritten site.

## Migration completion gate

The rewrite is **not yet certified visually equivalent** to the original
Webflow export. Compare all actual page routes against their references at
the source breakpoints, including navigation, forms, animation, keyboard use,
reduced motion, and responsive imagery.

Some detail pages still have abbreviated content; some sections still have
image placeholders. Contact, quote, and subscribe endpoints currently
validate and acknowledge submissions but do not connect to external delivery.

Remove the original export only in a separate final PR **after** route,
content, asset, interaction, and visual parity have been verified with
documented evidence. Until then it remains read-only; see ../AGENTS.md.

The runtime guard in `scripts/check-rewrite-runtime.mjs` deliberately checks
`app/src`, `app/public`, and built Astro output. It does not mistake
read-only source references for production runtime dependencies.
