# Visual and interaction QA

The screenshot workflow captures Home V1, V2 and V3 in original HTML and
the Astro rewrite at 390, 768, 991 and 1440 px. Review the paired screenshots
in the GitHub Actions artifact `home-pages-reference-vs-astro`.

The browser smoke check tests mobile open/Escape close and desktop
focus/Escape behavior.

Screenshots are diagnostic evidence, **not proof of visual equivalence**.
Original Webflow animations and externally hosted reference images may differ
in loading state. Before deleting the legacy export, extend this matrix to
every migrated route and verify layout, imagery, forms, scroll behavior,
keyboard access, and reduced-motion behavior. Keep the original export
read-only until then.
