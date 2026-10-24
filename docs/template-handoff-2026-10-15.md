# Website — project handoff

Use **this Desktop/website folder for future work**. It contains the latest published website source and its local Git history. The earlier working copy at `C:/Users/TomaKuzmic/work/scroll-template` remains as a previous copy. Changes in these folders do not sync automatically.

## Current status and intent

- Private live preview: https://scroll-study-template.rowden-5595.chatgpt.site
- Last published source: `9aec2b76db0e6b4255be09c39169d5413b64e447` (15 October 2026).
- Design reference: https://getartcraft.com. The user approved the template's overall appearance and interaction. Preserve the skeleton and animated navigation while filling in the website.
- Final subject matter, branding, copy, and media have not been supplied. All current labels and content blocks are placeholders.
- This is an original implementation of the reference's layout and interaction concepts. No reference-site copy, images, logos, or scripts are included.
- Latest fix: the next section title stays in the bottom stack when navigation lands on the previous section. In particular, Section 03 must wait when the user clicks Section 02.

## Run locally

Open a terminal in this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1 --directory docs
```

Visit http://127.0.0.1:4173. Stop with Ctrl+C. Python 3 is installed on this machine. Opening `docs/index.html` directly also works for the current implementation, but a local server is preferable for development.

There is **no installation or build step**: no package.json, framework, bundler, or backend. Files in `docs/` are both the editable source and the deployable website. Do not delete that directory as generated output.

## Files

```text
website/
  AGENTS.md              Short instructions for future agents
  README.md              This handoff
  .gitignore             Excludes QA artifacts, archives, and dependencies
  .git/                  Independent local Git history
  .openai/hosting.json    Existing Site identity and static hosting configuration
  docs/
    index.html           Page skeleton, navigation, content placeholders
    style.css            All styles, responsive rules, and placeholder visuals
    app.js               Scroll navigation and letter animation
```

Put future images, videos, or fonts under `docs/assets/` and use relative URLs. The current website requires no external assets or dependencies. No credentials are stored here. Disposable QA screenshots from the original project were not copied.

## Structure and content editing

`index.html` contains a fixed header, introduction, separator strip, four content sections, footer, and a fixed ruler on the right:

| ID | Current structure |
| --- | --- |
| `intro` | TEMPLATE wordmark, orbital outlines, empty media tiles, introduction placeholders |
| `section-1` | Heading and eight media/content cells in a two-column grid |
| `section-2` | Heading and three text columns |
| `section-3` | Heading and three gallery/media cells |
| `section-4` | Closing heading, placeholders, and return link |

Replace `.placeholder-line`, `.media-slot`, and placeholder labels as real content becomes available. The gray blocks are intentional wireframe placeholders, not loading states. Current header and footer links navigate within the template.

Each navigable section has a `data-label` supplying its animated ruler title. Keep its `id`, anchor links, and label consistent when renaming sections. The script automatically discovers `section[data-label]` and measures positions from the rendered document, so added content affects the navigation geometry.

**Hero rename requirement:** keep the text in `#wordmark`, its `aria-label`, and the introduction's `data-label` identical. The hero animation pairs these letters by index; changing only one can break it. Header and footer branding are separate text to update too.

In `style.css`, start with the `:root` variables for background, ink, lines, accent, ruler width, header height, and gutters. Responsive rules apply at 900px and 600px, with wider gutters above 1700px. Small screens use single-column content and narrower navigation typography. Preserve readable contrast and keyboard focus indicators.

## Animation architecture

`app.js` is a dependency-free IIFE. It generates individual letters and clickable hit areas for section names, plus 101 ruler ticks. It renders with `requestAnimationFrame`; scroll, resize, pointer interaction, and navigation request frames. `ResizeObserver` and font readiness trigger geometry measurements.

Normal scrolling moves section names through four stages:

1. Upcoming names wait horizontally in the bottom stack.
2. A name detaches letter by letter, rotates vertically, and travels beside its section.
3. Near the top, staggered curved letter paths form a horizontal heading.
4. Previous titles become smaller labels stacked above the current title.

Reverse scrolling uses the same geometry in reverse. Hovering the ruler morphs it into a full-page map with labels at document positions. Click or drag the ruler to navigate; pointer-down freezes the expanded mapping so the target does not shift during dragging. Section links trigger eased scroll jumps, which wheel or touch input can cancel.

Keyboard controls: Tab to the ruler; arrows for small steps, Shift+arrows for larger steps, Page Up/Down, Home, and End. Touch pointer dragging is implemented. Reduced-motion preferences disable eased jumps and replace intermediate letter flights with immediate changes.

### Timing and synchronization

The `motion` object at the top of `app.js` exposes:

| Setting | Purpose |
| --- | --- |
| `flipDistance` | Scroll distance for the vertical-to-horizontal title transition |
| `detachDistance` | Scroll distance for leaving the bottom stack |
| `sectionRest` | Rest interval after the previous section's navigation stop; currently 96px, capped relative to section spacing |
| `stagger` | Delay between letters |
| `arc` | Inward curve of letter travel |
| `hoverDelay` | Hover intent delay |
| `zoomDamping` | Overview morph speed |
| `jumpDuration` | Maximum clicked-navigation duration |

`targetFor()` defines navigation destinations. `measure()` derives a journey for each title using the previous navigation stop. `journeyScroll()` remaps the letter journey for shorter sections so the next label does not depart prematurely. Its inverse is used by the settling behavior for partially formed titles.

Keep destinations, forward mapping, and inverse settling mapping consistent. Do not fix synchronization by hiding a label only during clicks: normal scrolling, reverse scrolling, resizing, and the overview must remain coherent. Ruler ticks and the overview still represent actual document positions; only the letter journey is delayed for short sections.

## Verification

Chromium checks using Python Playwright passed for the latest synchronization change at 1440×1000, 1280×720, and 390×844. Earlier checks covered ruler dragging, keyboard controls, reduced motion, mobile overflow, and browser errors. Other browser engines and physical touch devices have not been verified.

After content or animation changes:

1. Click Section 02 and Section 03 using header and ruler links. The selected title should settle at the top; the next title should remain horizontal in the bottom stack on arrival.
2. Scroll farther. A brief resting interval should precede the next title's departure; it should then complete its transition.
3. Reverse the scroll and return to the same position. Letter geometry should match.
4. Hover the ruler, drag to another position, click labels, and leave the ruler. The normal navigation should resume correctly.
5. Check keyboard controls, reduced motion, mobile layout, horizontal overflow, and browser errors.
6. Repeat after adding media or changing section heights: the animation is content-dependent.

Python Playwright is available on this machine. For deterministic geometry checks, wait for animation frames after changing scroll position; fixed sleeps alone proved unreliable in headless Chromium. For example, in Python Playwright:

```python
page.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
```

Allow floating-point tolerance when comparing rotations near zero. Save disposable screenshots or QA scripts under ignored `artifacts/`.

## Git and hosting

This is an independent Git clone with history and no hardlinks to the previous folder. The temporary local `origin` was removed to avoid accidental pushes to that previous copy. There is no permanent Git remote. Check `git status` and preserve existing user changes before editing.

`.openai/hosting.json` retains the existing Site:

```json
{
  "project_id": "appgprj_6ad0dffb307c8191b74bb2c8eb09c5f3",
  "static": { "directory": "dist" }
}
```

Reuse this identity; do not create a replacement Site for future updates. Local edits do not automatically update the live page. Preserve private access unless the user requests a sharing change.

When publishing through Sites, read the installed skill's current instructions. At handoff time its path is:

```text
C:/Users/TomaKuzmic/.codex/plugins/cache/openai-curated-remote/sites/1.0.0/skills/sites/SKILL.md
```

The supported workflow reads the existing Site, obtains a fresh source-write credential, opens this checkout with the source helper, checks changes, then pushes and packages the exact source before saving/deploying. The helper handles the hosted repository without requiring a permanent remote here. Credentials expire: keep them in session memory and pass them through hidden stdin, never source files, Git config, or shell arguments.

Windows notes from the successful deployment:

- Node was not on the default PATH. A usable executable was bundled with Python Playwright at `C:/Users/TomaKuzmic/AppData/Local/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/site-packages/playwright/driver/node.exe`. Rediscover it if Python changes.
- Prepend `C:/Users/TomaKuzmic/AppData/Local/Programs/Git/bin` and the Node executable's directory to the helper process PATH. The default WindowsApps Bash could not resolve the packaging script; Git Bash worked.
- Set the helper process environment variable `TAR_OPTIONS=--force-local` so GNU tar treats `C:/...` archive paths as local files.
- Quote absolute paths: this Desktop directory contains spaces. Keep deployment archives outside the project and wait for successful deployment before reporting the live site updated.

The Desktop handoff adds documentation only. The website files match the published source commit above. Update this README when the structure, dependencies, behavior, or deployment workflow changes.
