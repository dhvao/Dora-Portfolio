# Website — artwork portfolio

This Desktop `website` folder is the working project. The earlier copy at `C:/Users/TomaKuzmic/work/scroll-template` is historical and is not synchronized with this folder.

Private site: https://scroll-study-template.rowden-5595.chatgpt.site

## Current direction — 23 October 2026

The user asked to retain the animated right-hand scroll ruler, replace the old template layout, and organize the photographs from both supplied transfer folders into a real portfolio. The result is a layered archive: **home → collection → series → artwork**, plus a searchable full archive and a separate reference shelf.

The old front-page skeleton is superseded. Its historical handoff is preserved in `docs/template-handoff-2026-10-15.md` for context, not as current instructions.

The artist name **Dora Kuzmić** was inferred from supplied filenames and is a working name. Artwork and series titles are descriptive editorial labels, not confirmed official titles. Artist biography, exact media, dates, physical dimensions, prices, and contact information have not been supplied and were not invented. These can be added when confirmed.

## Collections and image accounting

| Collection | Series | Works |
| --- | --- | ---: |
| Digital works | Colour & body; Street notes; Graphic stories; Animal lines | 40 |
| Studies in red | The red city; Rooms & windows | 17 |
| From the studio | City & structure; Figure studies | 14 |

All **78 supplied files** are accounted for: **71 artwork entries + 4 alternate exports + 3 reference images**. Four near-identical compositions share artwork pages with their alternate exports. The three architectural reference images are separated from the portfolio because their authorship is unconfirmed; two visibly include saved-image controls and third-party signatures.

See `content/GROUPING.md` for the review, every series membership, alternate pairs, and classification rationale. `content/source-inventory.json` records the original file paths, source folders, dimensions, sizes, and SHA-256 hashes. Original source ID 22 has a truncated-file warning but was decoded successfully and visually inspected; the source is preserved unchanged.

## Preview

From this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. Stop with Ctrl+C. Use a server when working with the nested pages.

The website itself is plain HTML, CSS, and JavaScript with no runtime dependencies, framework, backend, or installation step. A small Python generator maintains the many static pages. Python, Pillow, and Python Playwright are installed on this machine.

## File map and source of truth

```text
website/
  AGENTS.md                       Guidance for future agents
  README.md                       Current handoff
  .openai/hosting.json             Existing private Site identity
  content/
    curation.json                 Artist name, collections, series, ordering, captions, variants
    source-inventory.json         Original image provenance and stable IDs
    GROUPING.md                   Image review and classification decisions
  scripts/
    prepare_media.py              Preserve originals; produce two WebP sizes per image
    build_gallery.py              Generate all page HTML from the catalog
    check_site.py                 Validate coverage, links, fragments, and assets
  source-media/                   Full original files, excluded from Git and deployment
  dist/
    index.html                    Generated homepage
    collections/                  Generated collection and nested series pages
    works/                        Generated individual artwork pages
    archive/index.html            Generated searchable archive
    references/index.html         Generated reference shelf
    assets/art/                   156 optimized WebP files: thumbnail and large for each source
    style.css                     Hand-edited portfolio layouts and responsive styling
    ruler.css                     Hand-edited original ruler styling
    app.js                        Preserved ruler animation, with short-header adaptation
    gallery.js                    Menus, enlarged image dialog, archive filters, background hook
    site-config.js                Disabled future Procreate background configuration
  docs/                           Historical template documentation
  artifacts/                      Ignored local QA scripts and screenshots
```

**Edit `content/curation.json` and `scripts/build_gallery.py` for page content and markup.** Do not hand-edit generated HTML; regeneration overwrites it. CSS and JavaScript under `dist/` are maintained directly. Do not delete `dist/` wholesale as generated output: it also contains those source files and the optimized assets.

There are currently **85 pages**: 1 home, 3 collection entrances, 8 series galleries, 71 artwork pages, 1 archive, and 1 reference shelf.

## Editing the collection

1. Change the working artist name, grouping, order, cover selections, descriptions, or captions in `content/curation.json`.
2. Regenerate and validate:

```powershell
python scripts/build_gallery.py
python scripts/check_site.py
```

3. Preview and run the relevant interaction checks below.

Image IDs are stable and correspond to source inventory entries. A series lists its primary `works`; `variants` maps primary IDs to alternate source IDs. `references` holds material outside the artwork count. Each source image has exactly one catalog role. Do not delete the alternate files just because they are visually similar.

The current generator and checker assert the 78-image/71-work inventory and use some fixed count labels. If new images are added, update those assertions and count labels, the inventory, curation, and this README together. New originals should be assigned new IDs rather than renumbering existing work URLs. Removing or renaming series also requires explicitly reviewing old generated pages so stale routes are not left behind; the builder does not delete directories automatically.

The homepage is a small selection with links into each collection. At the user's request, it has no numbered "Selected" badge or tiny total-count line beneath the hero. Each series has its own gallery; each work has a full-image page, an accessible enlarged-image dialog, and previous/next work links. Alternate exports appear below the main image. The full archive filters by collection and searches descriptive captions and series names.

Images retain their complete frame and original proportions. No generative edits, cropping, or recolouring were applied. Original photographs can include paper edges; reference screenshots retain their original interface elements. Transparent pixels in web copies are flattened onto white, and EXIF orientation is normalized.

## Image processing and originals

Originals are copied to `source-media/` preserving the transfer folder structure (about 550 MB decimal). This folder is ignored by Git and is **not uploaded with the website**. Keep it locally for future exports; a cloud source checkout alone will contain only the optimized web assets and inventory.

Web derivatives use WebP at maximum dimensions of 640px and 2000px and total about 44 MiB. Responsive image sources, intrinsic dimensions, and lazy loading keep gallery pages practical. Large artwork views use the 2000px copies.

```powershell
python scripts/prepare_media.py
python scripts/prepare_media.py --force
```

The first command skips existing derivatives. `--force` regenerates them from preserved local originals. Missing originals can be copied from their inventory paths while the Downloads folders still exist. Never delete originals after generating web copies. Run the page generator after media preparation so image source descriptors stay correct.

## Preserved scroll ruler

`dist/app.js` retains the original scroll-driven letter choreography:

- Upcoming titles wait in a bottom stack.
- Letters detach, turn vertically, and travel alongside the page.
- Near the top they follow staggered curved paths into horizontal headings.
- Previous headings become a smaller stack; reverse scrolling reverses the same geometry.
- Hover reveals a full-page map. Click or drag the ruler, or click a heading, to navigate.
- Wheel/touch input cancels smooth navigation. Keyboard controls include arrows, Shift+arrows, Page Up/Down, Home, and End.

Each page has its own measured section anchors and its own 0–100% scroll progress. The main `motion` settings remain near the top of the file. Preserve `sectionRest`, `targetFor()`, `journeyScroll()`, and its inverse settling mapping: these synchronize arrival and departure so the next title does not start early at a navigation stop.

The new artwork pages have shorter headings, so `geom.heroZone` shortens the first word's flight when necessary. This lets the hero finish before the first content navigation stop without replacing the animation. Geometry recalculates on resize, content changes, and font readiness.

Keep every section's `id`, links, and `data-label` consistent. The `#wordmark` text, `aria-label`, and first section's `data-label` must match because the hero maps its letters by index.

## Future Procreate timelapse

No timelapse has been supplied yet. A fixed, non-interactive `#art-background` layer and an optional scroll-to-video-time hook are prepared, but **disabled** in `dist/site-config.js`.

When the user provides the Procreate export:

1. Place an optimized video under `dist/assets/process/`, optionally with a poster image.
2. Set `background.video` and `background.poster` to paths relative to the site root and set `enabled: true` in `site-config.js`.
3. Adjust `opacity` and review contrast over actual art. Galleries have airy backgrounds and remain independent of this layer.
4. The hook in `gallery.js` maps page scroll progress to the video's duration. It seeks the paused, muted, inline video and waits for each seek to finish. Scrolling up reverses the drawing progress.
5. Reduced motion uses a static initial frame. This behavior should be reviewed with the actual export and poster.

The initial plan is page-relative playback: a new page starts its own drawing timeline. Decide with the user whether the effect should instead appear only on the homepage or continue between pages. Verify seeking smoothness, frame rate, file size, mobile decoding, reverse scroll, reduced motion, and text contrast using the real export. The disabled configuration was verified not to load a video; an actual Procreate video has not been tested.

## Checks

```powershell
python scripts/check_site.py
```

This checks all generated HTML's local links, image URLs, fragments, duplicate IDs, image alt attributes, page count, and coverage of the 78-image catalog.

The browser QA script used for this revision is in ignored `artifacts/browser_checks.py` and runs against the local server. It checks desktop slider arrival/rest/reverse motion, hover map, dragging, keyboard navigation, collection navigation, short artwork headers, enlarged-image closing and focus return, all collection filters, search and empty states, mobile menu, image loading, and overflow. Desktop (1440×1000), phone (390×844), and tablet (768×1024) checks passed with no JavaScript errors. Physical touch devices and other browser engines have not been verified.

For future animation checks, wait for two animation frames after setting scroll position; fixed sleeps alone can be unreliable in headless Chromium. Use a floating-point tolerance for near-zero rotations. Content changes can alter section geometry, so repeat navigation checks after changing content heights.

## Hosting and handoff

Reuse `.openai/hosting.json` and preserve its private audience:

```json
{
  "project_id": "appgprj_6ad0dffb307c8191b74bb2c8eb09c5f3",
  "static": { "directory": "dist" }
}
```

Do not register a new Site for updates. Local changes require publication to appear on the hosted URL. The missing local hosting manifest was re-established from the existing Site identity during this revision.

Read the current installed Sites skill before publication. At this handoff the version is 1.1.1:

```text
C:/Users/TomaKuzmic/.codex/plugins/cache/openai-curated-remote/sites/1.1.1/skills/sites/SKILL.md
```

Use the Sites source helper to open the existing checkout, push, and package the exact verified source before deploying. Preserve all local user changes. Credentials expire: obtain fresh access, keep it only in session memory, and pass it through hidden stdin. Do not put credentials in files, Git config, or shell arguments. The helper manages the hosted repository; no permanent local remote is required.

Windows environment notes:

- Node is available in Python Playwright's `driver/node.exe` directory, currently under `C:/Users/TomaKuzmic/AppData/Local/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/site-packages/playwright/driver/`.
- Prepend that directory and `C:/Users/TomaKuzmic/AppData/Local/Programs/Git/bin` to the helper process PATH. Git Bash works; the WindowsApps Bash previously failed on Windows script paths.
- Set `TAR_OPTIONS=--force-local` for the helper so GNU tar treats `C:/...` archive paths as local.
- Quote this Desktop path because it contains spaces. Keep deployment archives outside the repository.
- Never include `source-media/` or ignored `artifacts/` in the deployed archive. Only `dist/` and the required hosting metadata belong in the publication.

Update this README and `content/GROUPING.md` as the artist confirms names, grouping, credits, or future behavior.
