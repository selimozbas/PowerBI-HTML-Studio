# Changelog

## 0.1.0 — 2026-09-08

First public version. Renders column/measure values as HTML and SVG on the
report canvas with:

- **Templating engine** — CSP-safe AST interpreter (`{{ }}`, `{{#if a > b}}`,
  `{{#each}}`, `{{#unless}}`, `{{> partial key=expr}}`), named *Data* fields,
  `{{cfBg}}` / `{{cfColor}}` aliases for DAX colour measures.
- **Helpers** — `format` / `number` / `percent` / `currency` / `date`
  (locale-aware), math & string, `sum` / `avg` / `top` / `where` / `sortBy` /
  `rank` / `pctOfTotal` / `groupBy`, `colorScale`, `relativeTime`, `duration`,
  `qr`, `sparkline` / `bar` / `ring` / `rating`.
- **Component library** — ~15 built-in partials (kpi, trend, gauge, sparkRow,
  pill, ratingStars, timelineItem, …); extend via the *Partials* setting.
- **Charts** — `data-hf-chart` → interactive uPlot canvas (line / spline /
  area / bar).
- **Markdown** mode (GitHub-flavoured).
- **Conditional formatting** — JSON rules (comparisons + colour scales), no DAX.
- **Interactivity** — cross-filter by row or field value (`data-hf-select`),
  HTML slicer mode (`data-hf-filter` → `applyJsonFilter`), viewer write-back
  (`data-hf-state`), tooltips, context menu, `launchUrl`, tabs / accordion /
  carousel.
- **Bootstrap 5** + Bootstrap Icons bundled (no CDN); JS components toggleable.
- **Theming** — report-theme CSS variables, Google Fonts / `@font-face`, RTL,
  style presets (Cards / Minimal / Dark / Newspaper / Accent tiles).
- **Security** — DOMPurify with policy presets (Standard / Strict / Trusted /
  Custom).
- **Performance** — render memoisation, windowed virtualization past 250 rows,
  max-rows cap, export/print mode.
- **On-object formatting** for the content region.
- **Advanced editor** — Monaco modal dialog with the `hf-template` language,
  autocomplete, starter-template gallery, live preview, bound-data tab and
  inline lint markers.
- Localization: `en-US`, `tr-TR`.
