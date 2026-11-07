# Reference image localization

Run from the repository root with Node 22:

```sh
node app/scripts/restore-original-assets.mjs --download
node app/scripts/restore-original-assets.mjs
```

The importer reads URLs only from original, immutable HTML references. It
downloads the specifically identified Home V1/V2 hero and studio imagery, the four Home V2 capsule portraits, Home V1's three service-card images, eight partner SVG logos, and inline blog figures. Downloads are limited to the
original Webflow asset host and allowed image types. Files are committed under
`app/public/assets/` and served locally, without runtime CDN requests.

The PR branch's GitHub Actions workflow runs the import and attempts to
commit image binaries. If permissions prevent that commit, run the importer
locally and commit those files. Verify the binary files exist in the PR before
switching any page to use them. This is only the first image-restoration pass:
it does not claim parity for the full source export.

The original HTML remains read-only and must not be deleted before visual
parity is independently verified.
