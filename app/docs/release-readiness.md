# Release readiness after PR #14

**Status: pending visual approval and production receiver configuration.**

This repository keeps the checked-in Webflow reference HTML/CSS until the migrated
Astro build has manually verified visual, responsive and interaction parity.

## Automated gates

- `Verify Astro rewrite`: build, lint, structural mapping, no forbidden runtime,
  and isolated form validation/webhook contract tests.
- `Capture original vs Astro screenshots`: mobile/desktop navigation, office tabs
  and FAQ smoke tests, plus reviewable screenshot artifacts.
- `Audit every Webflow page against Astro`: 59 source routes × four viewport
  widths; 118 screenshot pairs. The summary job aggregates all four shards,
  rejects missing coverage and regressions beyond the recorded PR #12 baseline.
- `npm run check:forms-production -- --strict`: deployment-only config preflight.
  CI runs it with dummy variables, **not** real webhook secrets.
- `npm run check:readiness -- --require-parity`: refuses source removal until
  `docs/verified-visual-parity.json` contains explicit per-route human approval.

## Required before shipping to production

1. Review screenshot pairs, investigate missing headings/images and compare
   crop, font metrics, responsive spacing, motion and tab/form behavior manually.
   Count differences are diagnostics, not automatically missing UI elements.
2. Verify accessibility with real keyboard and assistive technology beyond the
   narrow Chromium smoke tests.
3. Deploy on an SSR-capable host, configure HTTPS `FORM_WEBHOOK_URL` and a
   server-only `FORM_WEBHOOK_TOKEN`, add appropriate edge spam/rate limiting,
   and confirm delivery with a controlled end-to-end recipient.
4. Validate metadata, performance and all public routes on the deployed origin.
5. Only after reviewer approval: create route-specific parity evidence and
   consider Webflow removal in a separate PR.

No source HTML is removed and no parity evidence is fabricated by this PR.
