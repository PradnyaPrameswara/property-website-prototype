# anti-slop provenance

- Source repository: https://github.com/dmmulroy/anti-slop
- Installed via the bundled `install-anti-slop` agent skill
  (`node ~/.claude/skills/install-anti-slop/scripts/install.mjs`) on 2026-09-22.
- Skill asset snapshot: vendored copy bundled with the skill (exact upstream
  commit unknown — the skill ships a pinned snapshot; treat the vendored files
  in this directory as the source of truth).
- Installed paths:
  - `tools/oxlint/anti-slop/` (vendored plugin source, TypeScript)
  - `tools/oxlint/anti-slop/dist/index.mjs` (esbuild bundle referenced by
    `.oxlintrc.json`)
- Dependencies: `oxlint@1.85.0` and `@oxlint/plugins@1.85.0` (pinned together
  as devDependencies).
- Intentional deviations:
  - The local toolchain runs Node v22.12.0, which cannot import TypeScript
    configs or TS plugin entry points (requires Node ^20.19 || >=22.18).
    Therefore `.oxlintrc.json` (JSON) is used instead of `oxlint.config.ts`,
    and the plugin entry point is bundled to `dist/index.mjs` with:
    `node node_modules/esbuild/bin/esbuild tools/oxlint/anti-slop/index.ts
    --bundle --platform=node --format=esm --external:@oxlint/plugins
    --outfile=tools/oxlint/anti-slop/dist/index.mjs`
    (npm script: `npm run build:lint-plugin`). Re-run it after editing the
    vendored rules. When Node is upgraded to >=22.18, the TS entry point can
    be referenced directly again.
  - The optional Effect plugin (`effect/`) is installed but NOT registered:
    this project has no direct `effect` dependency.
  - Vendored `vendor/eslint-stylistic/LICENSE` and `UPSTREAM.md` are preserved.
