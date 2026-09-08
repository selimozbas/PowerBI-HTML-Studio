# Changelog

## 0.1.1 — 2026-09-08

Post-release review pass — correctness fixes, no new features.

- **Templating** — `{{#each}}` now exposes `@index` / `@key` / `@first` /
  `@last` correctly (loop-relative, not model-relative); unary `{{ !expr }}`;
  `{{else}}` outside a block is a lint error; partial params tolerate spaces
  around `=` (`{{> kpi label = Region}}`).
- **Formatting** — integer patterns (`#,##0`, `0`) no longer force two
  decimals; date-only ISO strings (`2024-03-15`) parse at local midnight
  instead of shifting a day west of UTC.
- **Helpers** — `relativeTime` reports the right unit and magnitude across the
  whole minute→year range; new scalar `maxOf` / `minOf`; `rank`, `colorScale`
  and the conditional-formatting evaluator guard against `NaN` and bad hex;
  `contains` with no value no longer matches every row.
- **Data model** — the *Sort by* field well now actually orders rows; tooltip
  values honour the column format string; two-segment `queryName` guard so
  hierarchy levels don't produce broken report filters.
- **Slicer** — an `data-hf-filter` on a measure / unresolvable field no longer
  clears every report filter.
- **Sanitiser** — `Trusted` policy now genuinely differs from `Standard` (it
  turns DOMPurify off); extra allowed tags/attributes are filtered against a
  deny-list and flagged in the diagnostics panel; stripped attributes (not just
  elements) are reported.
- **Lifecycle** — layout-only updates (resize / view-mode) skip the full
  `transform` + re-render; removing and re-adding a field restores content;
  `destroy()` is guarded and unbinds the select callback.
- **Editor** — the lint pass sees the component library, so `{{> kpi …}}` no
  longer shows a phantom "unknown partial" marker.
- **Build** — `powerbi-visuals-api` dependency pinned to `~5.11.0` to match the
  version the package actually reports at runtime (`5.11.1`'s `index.js` still
  exports `5.11.0`), so `pbiviz.json` and the bundle agree; dropped the
  misleading "certified-safe" wording (any `WebAccess` privilege rules out
  certification); added `PRIVACY.md`, `SECURITY.md`, `CONTRIBUTING.md`,
  issue templates, `.editorconfig`, `.nvmrc`; CI on Node 22 with tag builds;
  removed the unused `dataviewutils` / `tooltiputils` dev-deps and the dead
  `persistedState.editorContent` capability.

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
- **Component library** — 14 built-in partials (kpi, trend, gauge, sparkRow,
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
