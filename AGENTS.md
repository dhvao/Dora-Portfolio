# Working in this project

Read `README.md` first. This Desktop `website` folder is the working copy for future changes.

- Preserve the user-approved scroll ruler and section synchronization. The old template layout was replaced at the user's request on 23 October 2026.
- Page HTML is generated from `scripts/build_gallery.py` and `content/curation.json`; edit those sources and regenerate. CSS and JavaScript in `dist/` are hand-edited. Do not delete `dist/` wholesale.
- Keep section IDs, links, and `data-label` values consistent. Keep the hero wordmark and introduction label identical when renaming. Each page has its own ruler and page-relative scroll progress.
- Preserve the synchronization fix: after landing on Section 02, Section 03 must remain queued until further scrolling. Check short sections and reverse scrolling after geometry or animation changes.
- Use the existing `.openai/hosting.json` identity for publication and preserve the current audience. Follow the installed Sites skill when publishing.
- All 78 source images must remain accounted for: 71 artworks, 4 alternate exports, 3 references. Keep alternate exports with their work; keep reference images out of the artwork collection. Grouping and descriptive titles are editorial and can be corrected by the artist.
- Preserve `source-media/` originals; they are intentionally ignored by Git and excluded from the deployed site. Never stage this directory. Web derivatives are in `dist/assets/art/`.
- Run `python scripts/build_gallery.py` and `python scripts/check_site.py`, plus relevant browser checks described in the README. Keep the static architecture unless requested functionality needs more.
- The Procreate timelapse is a future feature: its optional fixed background hook is disabled in `dist/site-config.js` until a real export is provided. Do not substitute a fake timelapse.
- Preserve user changes, keep credentials out of files and shell arguments, and update the README when setup or behavior changes.
