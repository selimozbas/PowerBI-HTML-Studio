# Development

## Prerequisites

- Node.js 22+ (see `.nvmrc`; CI runs on 22)
- `npm install` — this also runs `scripts/embed-bootstrap.mjs` via the `prepare`
  script, generating `src/framework/bootstrapCss.ts` (git-ignored)
- For `pbiviz start`, install the developer certificate once:
  `npx pbiviz --install-cert`

## Scripts

| Command | Does |
| --- | --- |
| `npm start` | `pbiviz start` — dev server; add the visual to a report in Desktop / Service |
| `npm test` | Vitest — pure module tests (`test/`) |
| `npm run typecheck` | `tsc -p tsconfig.strict.json` — strict, incl. `test/` |
| `npm run lint` | ESLint + `eslint-plugin-powerbi-visuals` |
| `npm run package` | `pbiviz package` → `dist/*.pbiviz` |
| `npm run embed-bootstrap` | regenerate the vendored Bootstrap CSS |

`prestart` / `prepackage` / `prepare` re-run `embed-bootstrap` automatically.

## Two `tsconfig` files

- `tsconfig.json` — used by `pbiviz`. `strict: true` **but**
  `strictNullChecks: false` + `strictPropertyInitialization: false`, because the
  pbiviz-generated `visualPlugin.ts` doesn't satisfy strict-null.
- `tsconfig.strict.json` — full strict, for `npm run typecheck` and CI. Keep
  both green.

## Project layout

```
src/
  visual.ts                       IVisual — update() / getFormattingModel(),
                                  wires model -> render -> DOM -> interactivity
  settings.ts                     formatting-model cards
  dataView/transform.ts           table DataView -> model (rows, fieldNames,
                                  columnRefs, selectionIds, tooltip items)
  rendering/
    templateEngine.ts             AST parser + interpreter, partials
    helpers.ts, collectionHelpers.ts  helper registry
    format.ts                     number / date pattern formatter
    charts.ts                     inline-SVG mini charts (sparkline/bar/ring/rating)
    conditionalFormatting.ts      rule + colour-scale evaluator
    markdown.ts                   GFM via marked
    components.ts                 built-in tabs / accordion runtime
    rowWindow.ts                  windowed virtualization
    sanitize.ts                   DOMPurify -> DocumentFragment
    htmlRenderer.ts               orchestration
  components/library.ts           built-in partials
  framework/
    bootstrapRuntime.ts           inject bundled Bootstrap CSS + wire its JS
    bootstrapCss.ts               GENERATED (git-ignored)
    canvasCharts.ts               data-hf-chart -> uPlot
  interactivity/
    selection.ts, selectMatch.ts  cross-highlight
    slicer.ts                     data-hf-filter -> applyJsonFilter
    formState.ts                  data-hf-state -> persistProperties
    tooltip.ts                    host tooltip service
  onObject/subSelection.ts        on-object formatting descriptors
  theme/themeVars.ts, fonts.ts, presets.ts
  editor/                         Monaco (no-worker) setup, hf-template language,
                                  gallery, lintTemplate
  dialog/templateEditorDialog.ts  the advanced-editor modal dialog
  i18n.ts, dom/inject.ts, ui/debugPanel.ts, landing/landing.ts
capabilities.json                 data roles, table mapping (30k window), objects
stringResources/{en-US,tr-TR}/    localization
scripts/embed-bootstrap.mjs       Bootstrap CSS -> src/framework/bootstrapCss.ts
```

## Design constraints

- **No dynamic code generation.** The template engine parses to a node tree and
  walks it. This keeps the visual inside the sandbox and certification-friendly.
- **Author HTML never becomes a markup-string assignment.** It goes through
  DOMPurify (`RETURN_DOM_FRAGMENT`), and the visual's own chrome is built with
  `DOMParser`. `eslint-plugin-powerbi-visuals` enforces this.
- **Everything is bundled.** Bootstrap + its icon font, uPlot, `qrcode-generator`
  and Monaco all ship in the `.pbiviz`; no runtime CDN fetches.
- **The Monaco editor is bundled, not lazy-loaded.** A pbiviz visual has a
  single entry bundle — webpack `import()` split points are not served by the
  sandbox host, so `openTemplateEditor` can't code-split Monaco into a chunk.
  Monaco (no-worker build) therefore adds ~900 KB gzip to every load whether or
  not a viewer opens the editor. This is a deliberate trade-off; the alternative
  (`monaco-editor-core` with the hf-template language reimplemented) was judged
  not worth the regression risk for a non-certified visual.
- Bootstrap's minified CSS can't go through the fixed pbiviz `less-loader`
  pipeline, so `scripts/embed-bootstrap.mjs` inlines it (and the icon woff2) into
  a generated TS string injected at runtime.

## CI

`.github/workflows/build.yml` runs on push, PR and `v*` tags: `npm ci` →
`lint` → `typecheck` → `test` → `npm run package` (so `postpackage` gives the
friendly artifact name), and uploads the `.pbiviz` (30-day retention). A fresh
`npm ci` triggers `prepare`, so the generated Bootstrap CSS is produced in CI
too.

## Releasing

1. Bump `version` in `pbiviz.json` (`x.y.z.0`) and `package.json` (`x.y.z`),
   update `CHANGELOG.md`.
2. `npm run package` — `pbiviz` emits `dist/htmlStudio<guid>.x.y.z.0.pbiviz`
   (the GUID-based name it always uses); the `postpackage` script then copies
   it to the friendlier `dist/html-studio-x.y.z.pbiviz`.
3. `git tag vX.Y.Z && git push --tags` (CI re-verifies the tagged tree).
4. `gh release create vX.Y.Z dist/html-studio-X.Y.Z.pbiviz --notes "…"` (notes
   from the new `CHANGELOG.md` section).

## Tests

Pure modules are unit-tested (template engine, helpers, collection helpers,
partials, markdown, conditional formatting, select-match, slicer filter
building, lint, gallery templates, presets, renderer output). DOM-heavy pieces
(virtualization, Bootstrap, Monaco, on-object) are validated by the build and
need manual checking in Power BI Desktop / Service.
