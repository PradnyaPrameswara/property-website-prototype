# PR #8 — Full-site Webflow / Astro parity audit

## Coverage and evidence

The source of truth remains the immutable Webflow HTML export in the repository root.
The audit discovers all **59 real source pages** dynamically (excluding 10 generated
email/phone aliases) and compares each with the equivalent Astro route.

Four viewport widths are checked: **390, 768, 991 and 1440 px**.
Each route/viewport pair reports HTTP status, H1/title/heading gaps, section count,
local image failures, image-count difference, page height, heading font metrics,
and horizontal overflow. Complete paired screenshots are captured at **390 and
1440 px**; the intermediate widths receive DOM/layout checks.

GitHub Actions runs four independent shards of the test in Chromium. Each job
publishes a `full-site-parity-shard-N` artifact containing `audit.json`,
`audit.md`, and full-page screenshots in `reference/` and `astro/`. The
reports are generated from actual browsers, not estimated from the source.
Broken loaded Astro images, route errors and horizontal overflow over 2 px
fail the shard. Differences in headings, image count and section composition
are **reported** for visual review rather than hidden or treated as pixel-parity
success.

The original Webflow export uses reveal effects and external font/asset URLs.
The audit forces unrevealed reference elements visible in the **test browser
only** and uses reduced-motion; that makes comparisons inspectable but does
not reproduce every frame of a Webflow animation. All screenshots and external
network outcomes need human review before declaring visual equality.

## This PR's targeted fixes

- Recover original About hero and studio imagery, plus six values icons and
  four city/location photos from the immutable source HTML.
- Replace About's gray image placeholders with source photography.
- Restore the six original company-value cards, office-location tabs and
  source FAQ section with existing Base UI/React components.

## Outstanding before final Webflow removal

- Review the four audit artifacts and prioritize actual page-level gaps.
- Resolve remaining image/heading/section mismatches on the other routes,
  including contact, blog, service, portfolio and team templates.
- Verify interactions and forms against the original behavior and actual
  configured backend delivery, not merely a successful HTTP response.
- Verify font, spacing, aspect ratio and content layout at the original
  breakpoints and sign off per-route evidence.
- Keep `npm run check:readiness -- --require-parity` intentionally blocked
  until all 59 routes have real, reviewed parity evidence.

The audit is not a claim of 59 pixel-identical pages. Do not delete or mutate
raw Webflow export files in this PR.
