# Final Webflow removal gate (PR #7)

This repository still includes immutable Webflow HTML and CSS reference files.
They must remain available while screenshots and interactions are being
compared. Removing them is a destructive final step, **not** an automatic
result of a successful Astro build.

The non-destructive readiness check:

```sh
cd app
npm run check:readiness
```

checks source-to-Astro route coverage and validates local asset paths. It
excludes export-generated email/telephone alias HTML from the route count.

The final deletion gate:

```sh
cd app
npm run check:readiness -- --require-parity
```

deliberately fails until `app/docs/verified-visual-parity.json` contains
reviewed evidence for every mapped source page. Entries need `source`,
`reviewer`, and verified visual, responsive and interaction statuses;
the statuses must represent actual screenshots and browser tests. A green
structural check alone is not enough.

Before a destructive final PR, compare the source and rewritten pages at the
original breakpoints, including full body imagery, forms, keyboard behavior,
scroll/motion, image variants, and accessible reduced-motion mode. Resolve
differences, then request explicit approval for deletion. The final cleanup
should delete root export HTML, `reference/webflow.shared.css`, now-obsolete
migration helpers and unneeded legacy documentation, and adjust source-of-
truth instructions. Do not remove original images that the Astro app still uses
locally: they are content assets, not Webflow runtime dependencies.

Current state: **NOT VERIFIED for full-site parity; deletion blocked.**
