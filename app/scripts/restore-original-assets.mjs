#!/usr/bin/env node
/** Development-only importer of selected original assets from immutable HTML. */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const importMode = process.argv.includes("--download");

const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"]);

const selected = [
  ["team/sophie-moore.html", "6883f7a04928dd9615ba2bba_6-front-door-design-ideas-2-1-archipro-webflow-template.jpg"],
  ["team/maya-collins.html", "6883f8bb9e957b590f3c3da3_15-stunning-floor-designs-2-1-archipro-webflow-template.jpg"],
  ["team/lilly-woods.html", "6883f893969d9194e90eb00c_wood-furniture-care-guide-2-1-archipro-webflow-template.jpg"],
  ["team/john-carter.html", "6883f917e707caf6ffe02ac7_top-25-color-trends-2026-2-1-archipro-webflow-template.jpg"],
  ["team/andy-smith.html", "6883f8e69ddb3ed27658de9d_easy-diy-home-improvements-2-1-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "68894269d79943dcb4fbee77_designing-places-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688942340e598afe2c3207bf_hero-linear-bg-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a5b011779274c81245d83_inside-firm-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "688a6171d71781a6b334e10a_house-los-angeles-default-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a61718ec0d002ab83b0ec_remodelation-brooklyn-heights-default-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a6171582e13e9e033a23c_office-architecture-in-manhattan-default-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a6171841adbdeae71a9fa_house-los-angeles-small-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a61710be6a71eadb6e440_remodelation-brooklyn-heights-small-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a61711f0f6088a0bd259b_office-architecture-in-manhattan-small-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a6e143964a243bff7c382_modern-lounge-setup-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "692dea0f3690d8c3a8b5b7ba_lily-woods-avatar-image-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "692dea0fc0e65e45b0a42fd0_john-carter-avatar-image-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "692dea0f1b454905b95b07cf_sophie-moore-avatar-image-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "692dea0f0a1383ce5c76ea11_andy-smith-avatar-image-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "692dea0f67f8815052591c4e_sandy-houston-avatar-image-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "692dea0f0b45bcb02883a2e4_matt-cannon-avatar-image-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "692dea0f71b184755cc05b23_lily-woods-avatar-image-archipro-webflow-template-1.jpg"],
  ["home-pages/home-v1.html", "688a50ccb8be7acefbef0b1b_exterior-design-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a50cbfbe8559898958990_construction-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a50cc8c4226dcdd1fe747_decoration-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a93b259161daf15717fec_cozy-seating-area-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688aa7b404595ae5e675ddd1_modern-living-room-with-neutral-furniture-archipro-webflow-template.jpg"],
  ["home-pages/home-v2.html", "688b7f7f418671842860c671_minimalist-sofa-and-wooden-tables-in-cozy-workspace-archipro-webflow-template.jpg"],
  ["home-pages/home-v2.html", "688b7f7f791f6a07788377f6_cozy-modern-bedroom-archipro-webflow-template.jpg"],
  ["home-pages/home-v2.html", "688b7f7f379d69d8ed4f0844_minimalist-home-office-archipro-webflow-template.jpg"],
  ["home-pages/home-v2.html", "688b7f7f20cad57262c1485a_cozy-beige-living-room-archipro-webflow-template.jpg"],
  ["home-pages/home-v2.html", "688a9eec0d0ee3ae45ae0fee_exterior-design-default-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a9eec7e977e290017bd94_decoration-default-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a9eec66950241e75c1b2c_construction-default-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a9eec9cc56e22f468af13_interior-design-default-archipro-webflow-template.png"],
  ["company-pages/about.html", "688bd943c34df2b494161ec7_scenic-mountain-terrace-archipro-webflow-template.jpg"],
  ["company-pages/about.html", "689236ac5b61c147e4a4a8b3_inside-the-firm-archipro-webflow-template.jpg"],
  ["contact-pages/contact-v1.html", "6890c4e864be09da847d095d_slider-image-v1-archipro-webflow-template.png"],
  ["contact-pages/contact-v1.html", "6890c4e82ae78e79eb36f57e_our-work-gallery-v2-archipro-webflow-template.png"],
  ["contact-pages/contact-v1.html", "6890c4e748959810d151280e_our-work-gallery-v1-archipro-webflow-template.png"],
  ["contact-pages/contact-v1.html", "6890c4e7f9f8eddbe1e5cc09_our-work-gallery-v3-archipro-webflow-template.png"],
  ["contact-pages/contact-v1.html", "6890c4e8e6da5a01d347d511_our-work-gallery-v4-archipro-webflow-template.png"],
  ["company-pages/about.html", "68923500f2996c45c70b924f_heart-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "6883dda4eac60697f741f8c5_couch-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "68923500740745ee512937c0_user-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "68923500b759f4bedda504a0_lightbulb-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "68923500e8af7fe380307475_plant-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "689235002dc5cf80340e4de9_check-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "6890c4e8a2c26923a14b0ec3_new-york-archipro-webflow-template.png"],
  ["company-pages/about.html", "6890c4e823680e8f3da558f4_amsterdam-archipro-webflow-template.png"],
  ["company-pages/about.html", "6890c4e8bb449e828fb0404a_london-archipro-webflow-template.png"],
  ["company-pages/about.html", "6890c4e7531b467e094035cf_ottawa-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688b9d50b83ea2f28adb8d92_modern-mountain-house-archipro-webflow-template.jpg"],
  ["home-pages/home-v3.html", "688ba1cfb2fe90b531b2c5e8_exterior-design-service-tab-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688ba1cfd1a172fbe30baf47_decoration-service-tab-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688ba1cf6c5e7ce8a4ce59a2_construction-service-tab-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688ba1d0a2b1e979b70994f4_interior-design-service-tab-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688bb709d55545ae80fca6b9_minimalist-beige-sofa-setup-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688bbda917c91ae1c476a15e_neutral-toned-room-archipro-webflow-template.jpg"],
  ["landing-pages/request-a-quote.html", "688cec0508b46eca979d69f9_warm-toned-wooden-desk-setup-archipro-webflow-template.jpg"],
  ["service-pages/services.html", "6883ebb52cda0f2ca511c3e3_building-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb9e36a962086f14ee01_couch-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb8dfb8369d9d99c6480_urban-planning-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb7864dc34eb1560b958_screen-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb6263b889a133ffdbfe_file-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb502e58b3ff6e8f05c8_chart-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb3ca7cb6e1a1beb7838_project-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb1b34f6f261f56fff99_leaf-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eb072e7a39cf594618fc_update-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eaed235828617a7e5326_home-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883ead86ab2c33c6f23228b_home-design-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eabc8917aa579b7c8e98_chair-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883eaa2b086c13b1925c1c3_tree-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6894cc985443645f5b216514_design-icon-archipro-webflow-template.svg"],
  ["service-pages/services.html", "6883ea051edb3d9f8947b037_roller-paint-brush-icon-archipro-webflow-template.svg"],
  ["template-pages/start-here.html", "689271a8d837381c3e41a711_archipro-webflow-template-and-ui-kit-color.png"],
  ["template-pages/start-here.html", "689271a8657bd2dd453331a1_archipro-webflow-template-and-ui-kit-typography.png"],
  ["template-pages/start-here.html", "689271a8a5261ee97b4ccefc_archipro-webflow-template-and-ui-kit-custom-fonts.png"],
  ["template-pages/start-here.html", "69321ef8c2e2a569eca111e6_archipro-webflow-template-and-ui-kit-icons-and-graphics.jpg"],
  ["template-pages/start-here.html", "689271a80d37cef0503c8ef4_archipro-webflow-template-and-ui-kit-static-content.png"],
  ["template-pages/start-here.html", "689271a80d37cef0503c8edc_archipro-webflow-template-and-ui-kit-cms-content.png"],
  ["template-pages/start-here.html", "689271a860d2483e927d9e37_archipro-webflow-template-and-ui-kit-cms-collection.png"],
  ["template-pages/start-here.html", "689271a88d4d1b3bc7b406d9_archipro-webflow-template-and-ui-kit-cms-page.png"],
  ["template-pages/start-here.html", "689271a874c98aadac677c03_archipro-webflow-template-and-ui-kit-animations.png"],
  ["template-pages/start-here.html", "69321ef82a65c44a99890d09_archipro-webflow-template-and-ui-kit-responsive-design.jpg"],
  ["template-pages/start-here.html", "69321ef88afac1ab0aeb6cad_archipro-webflow-template-seo-settings.jpg"],
  ["template-pages/start-here.html", "69321ef8ac5929e2f968069a_archipro-webflow-template-and-ui-kit-backups.jpg"],
  ["blog-posts/12-design-tricks-for-picking-the-perfect-home-color-palette.html", "6883f14e8186959d7311f9fe_john-carter-avatar-archipro-webflow-template.png"],
  ["blog-posts/15-mind-blowing-floor-designs-to-make-your-home-look-great.html", "6883ef2c4d80b2d747e7a0fe_maya-collins-avatar-archipro-webflow-template.png"],
  ["blog-posts/clever-diy-home-improvements-you-can-easily-do-anytime.html", "6883f0969ed1f80d9fa7c95d_andy-smith-avatar-archipro-webflow-template.png"],
  ["blog-posts/front-door-design-ideas-6-great-concepts-for-your-home.html", "6883f12012eb39451cd476d6_sophie-moore-avatar-archipro-webflow-template.png"],
  ["blog-posts/how-to-give-maintenance-to-your-wooden-furniture-the-full-guide.html", "6883f0c64e63a9b69a4da066_lilly-woods-avatar-archipro-webflow-template.png"],
  ["contact-pages/contact-v3.html", "6890de8cf77ab5a2a50f1826_new-york-ny-thumbnail-archipro-webflow-template.jpg"],
  ["contact-pages/contact-v3.html", "6890de8c18b6c782b80bb6f1_ottawa-ca-thumbnail-archipro-webflow-template.jpg"],
  ["contact-pages/contact-v3.html", "6890de8ccfd27e3771025405_amsterdam-nl-thumbnail-archipro-webflow-template.jpg"],
  ["contact-pages/contact-v3.html", "6890de8c179c56edf965857a_london-uk-thumbnail-archipro-webflow-template.jpg"],
  ["contact-pages/contact-v3.html", "6891226cfe88763e007c2b1d_our-work-gallery-01-archipro-webflow-template.png"],
  ["contact-pages/contact-v3.html", "6891226cd5753dcbf00e6524_our-work-gallery-02-archipro-webflow-template.png"],
  ["contact-pages/contact-v3.html", "6891226c5dc27dfb5eed2ea7_our-work-gallery-03-archipro-webflow-template.png"],
  ["contact-pages/contact-v3.html", "6891226cd24b8ef80dd86676_our-work-gallery-04-archipro-webflow-template.png"],
  ["contact-pages/contact-v3.html", "6891226c853598b071a304b8_our-work-gallery-05-archipro-webflow-template.png"],
  ["contact-pages/contact-v3.html", "6891226c5eef108eaf49f8bd_our-work-gallery-06-archipro-webflow-template.png"],
  ["blog-pages/blog-v1.html", "6883f9491f1a3770faa02b07_12-tricks-perfect-color-palette-3-2-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v1.html", "688d318046b61808abd0ddea_newsletter-archipro-webflow-template.png"],
  ["blog-pages/blog-v1.html", "6883f91a5e6286524e3af299_top-25-color-trends-2026-1-1-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v1.html", "6883f8eac806d91bce627b41_easy-diy-home-improvements-1-1-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v1.html", "6883f8bf006e7664454be2ae_15-stunning-floor-designs-1-1-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v1.html", "6883f896516c83a0de52b9a5_wood-furniture-care-guide-1-1-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v1.html", "6883f7a4f0e6d9749c037ad9_6-front-door-design-ideas-1-1-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v2.html", "6883f94e796d145654776ac1_12-tricks-perfect-color-palette-2-1-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v3.html", "688d42520c02f884c86fcff0_our-blog-archipro-webflow-template.png"],
  ["blog-pages/blog-v3.html", "6883f90f7e8cd68bd6b46e83_top-25-color-trends-2026-3-2-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v3.html", "6883f8e21f7c1c43849ac72a_easy-diy-home-improvements-3-2-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v3.html", "6883f8b747069b9ac5a309f0_15-stunning-floor-designs-3-2-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v3.html", "6883f88ec3e8f2d92924c821_wood-furniture-care-guide-3-2-archipro-webflow-template.jpg"],
  ["blog-pages/blog-v3.html", "6883f79cda015d4f717e36da_6-front-door-design-ideas-3-2-archipro-webflow-template.jpg"],
  ["contact-pages/contact-v2.html", "6890ff65e70d6583d6a8d3ce_world-map-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "688bc1a81469d314fbcb7039_circle-logo-archipro-webflow-template.svg"],
  ["contact-pages/contact-v2.html", "688bc1a8239880f5f4397cf9_account-verified-archipro-webflow-template.svg"],
  ["contact-pages/contact-v2.html", "688bc164282839afb27ca4b5_work-thumbnail-v1-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "688bc1648d9c192ee8b48944_work-thumbnail-v2-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "688bc164708cc934f5f81e7f_work-thumbnail-v3-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6890ff65bd48b361c53af1d1_avatar-user-v1-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6890ff65f049f4f556a3416d_avatar-user-v2-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6890ff65116aae79c5821c0e_avatar-user-v3-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6883dda4c1f87854848857c2_envelope-icon-archipro-webflow-template.svg"],
  ["contact-pages/contact-v2.html", "6883dda6f2e27d87ebd3a469_phone-icon-archipro-webflow-template.svg"],
  ["contact-pages/contact-v2.html", "6883dda679ee33db288eb53b_message-icon-archipro-webflow-template.svg"],
  ["contact-pages/contact-v2.html", "6890ff6586d8a2d1c92de66d_canada-flag-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6890ff6581202a2eae3cd93a_eeuu-flag-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6890ff652a55cd09a6aa52e5_england-flag-archipro-webflow-template.png"],
  ["contact-pages/contact-v2.html", "6939da3f24c5e246714d3a59_netherlands-flag-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a71fb142f345fde59935c_lets-talk-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a71fb40e5592f8f5f6e5b_we-start-creating-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a71fbd7f0943428664083_time-to-build-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688aab66eed9538f8533544b_lets-talk-tab-image-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688aab6635a8d6af3bf99e73_we-start-creating-tab-image-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688aab67b033e5878d73f15c_time-to-build-tab-image-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688baf889b365be36edf7cf1_lets-talk-accordion-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688baf88fbd0ee4629a88cd3_we-start-creating-accordion-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688baf8844fa57e225875894_time-to-build-accordion-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f736ba3faadf02781f4_minimalist-bedroom-hero-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f73c7632f2e0ff7b0b3_modern-living-room-hero-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f734866d06a9c67bd1d_wooden-dining-table-hero-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f7371c3c0dcf19aa5a7_minimalist-bathroom-hero-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "6883d9dcf978a79188aaafeb_vireon-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc8be2d0a7690019e7_linkora-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc74f4793a5b09b481_converra-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc0175aafefd64b4f6_nexora-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc31f0406c374e6c3f_syncell-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc48a8579a5efd16f3_socium-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc4717347feac9ab9b_bridgr-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dd971331992c54bd48_netspire-logo-company-archipro-webflow-template.svg"],
];

function imageSources(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"[^>]*>/gi)].map((match) => match[1]);
}

function filename(url) {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:" || parsed.hostname !== "cdn.prod.website-files.com") {
    throw new Error("Unapproved source: " + url);
  }

  const name = decodeURIComponent(basename(parsed.pathname)).replaceAll(" ", "-");

  if (!/^[A-Za-z0-9_.-]+$/.test(name) || !allowed.has(extname(name).toLowerCase())) {
    throw new Error("Unapproved image name: " + name);
  }

  return name;
}

function localPath(name) {
  const folder = name.includes("-logo-company-") ? "brand/partners" : "img";

  return join(root, "app", "public", "assets", folder, name);
}

const assets = new Map();

for (const [page, name] of selected) {
  const html = await readFile(join(root, page), "utf8");

  const url = imageSources(html).find((candidate) => filename(candidate) === name);

  if (!url) throw new Error("Original image not found in " + page + ": " + name);

  assets.set(name, url);
}

// The source root is a template preview, not Home V1. Localize its
// page-preview screenshots from the immutable index.html export.
const previewHtml = await readFile(join(root, "index.html"), "utf8");

for (const url of imageSources(previewHtml)) {
  const name = filename(url);

  if (name.includes("-architecture-firm-webflow-template.")) {
    assets.set(name, url);
  }
}

for (const name of (await readdir(join(root, "blog-posts"))).filter((item) => item.endsWith(".html"))) {
  const html = await readFile(join(root, "blog-posts", name), "utf8");

  const start = html.indexOf('class="rich-text w-richtext"');

  if (start < 0) continue;

  const end = html.indexOf("</section>", start);

  const segment = html.slice(start, end < 0 ? undefined : end);

  for (const url of imageSources(segment)) {
    if (!allowed.has(extname(filename(url)).toLowerCase())) continue;

    assets.set(filename(url), url);
  }
}

async function present(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

let downloaded = 0;

let missing = 0;

for (const [name, source] of [...assets].sort(([a], [b]) => a.localeCompare(b))) {
  const path = localPath(name);

  if (await present(path)) continue;

  if (!importMode) {
    console.error("MISSING " + path);

    missing += 1;

    continue;
  }

  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(30000) });

    if (!response.ok) throw new Error("HTTP " + response.status);

    const type = response.headers.get("content-type") ?? "";

    if (!/^(image\/|application\/octet-stream)/i.test(type)) throw new Error("Unexpected type " + type);

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length === 0 || bytes.length > 20_000_000) throw new Error("Unexpected asset size " + bytes.length);

    await mkdir(dirname(path), { recursive: true });

    await writeFile(path, bytes);

    downloaded += 1;
  } catch (error) {
    missing += 1;

    console.error("MISSING " + name + ": " + String(error));
  }
}

console.log("Original images required: " + assets.size + "; downloaded: " + downloaded + "; missing: " + missing);

if (missing) process.exitCode = 1;
