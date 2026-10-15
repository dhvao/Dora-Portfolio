# Scroll Study template

A dependency-free, editable website skeleton inspired by the navigation mechanics at getartcraft.com. Original implementation; no reference-site copy, images, logos, or scripts are included.

## Preview

Run `python -m http.server 4173 --bind 127.0.0.1 --directory dist` from this folder, then visit http://127.0.0.1:4173. You can also open `dist/index.html` directly.

## Customize

- `dist/index.html`: section structure, placeholder media and text, navigation labels. Each section's `data-label` supplies its animated ruler title. Keep section IDs and anchor links in sync.
- `dist/style.css`: colors and sizing in `:root`, responsive layouts, placeholder styling.
- `dist/app.js`: `motion` near the top controls letter stagger, curve, transition distance, hover delay, and damping. The ruler measures section positions automatically.

## Interaction

Scroll in either direction to move headings from the bottom queue onto the vertical rail and into the top stack. Hover over the right edge to reveal the full page map. Click or drag the map, or click a section name, to navigate. Focus the ruler with Tab and use arrows for fine control, Shift + arrows for larger steps, Page Up/Down, Home, and End. Touch dragging works on the ruler. Reduced-motion preferences replace letter flights with immediate changes.

No content, dependencies, analytics, accounts, or external assets are required. Replace the visible placeholder blocks when content is ready.
