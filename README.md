# HTML Studio — a Power BI custom visual

Render column or measure values as **HTML and SVG** on the report canvas — a
spiritual successor to the classic *HTML Viewer* / *HTML Content* visuals, with
a templating engine, a component library, interactive charts, Bootstrap 5 and a
built-in Monaco editor.

MIT licensed. Not affiliated with or endorsed by Microsoft.

## What it adds over a plain HTML renderer

| Area | Feature |
| --- | --- |
| Content | CSP-safe **templating engine** — `{{field}}`, `{{#each rows}}`, `{{#if a > b}}`, helpers (`format`, `bar`, `ring`, `sparkline`, `rating`, math/string) |
| Content | **Named data fields** — drop extra measures in *Data* and reference them as `{{Revenue}}`; no DAX string concatenation |
| Content | **Aggregation helpers** — `sum` / `avg` / `top` / `where` / `sortBy` / `rank` / `pctOfTotal` / `groupBy` … subtotals, leaderboards and grouped sections without DAX |
| Content | **Partials + component library** — `{{> kpi label=… value=… target=…}}`; ~15 built-in components (kpi, trend, gauge, sparkRow, pill, ratingStars…), extend/override via the *Partials* setting |
| Styling | **Rule-based conditional formatting** authored as JSON (comparisons + colour scales), applied per row without DAX; a DAX colour measure surfaces as `{{cfBg}}` / `{{cfColor}}` |
| Styling | **Style presets** (Cards / Minimal / Dark / Newspaper / Accent tiles) and a **Security policy** preset (Standard / Strict / Trusted / Custom) |
| Styling | **Export/print mode** — expands virtualized rows, drops chrome, `overflow: visible` for full-fidelity PDF/PowerPoint export |
| Content | **Markdown mode** — GitHub-flavoured, per row or per block, still sanitised |
| Charts | **Interactive uPlot canvas charts** — `<div data-hf-chart='{"type":"line","x":"Month","y":["Actual","Target"]}'>`; line / spline / area / bar, driven by bound rows or inline data, resized with the visual |
| Charts | `{{qr(url, size)}}` — inline SVG QR code, no CDN |
| Interactivity | **Sandbox-safe components** — tabs & accordion via `data-` attributes, state persisted with `persistProperties` |
| Interactivity | Cross-filter by row **or by field value** (`data-hf-select="Region:North"`), multi-select, dimming, right-click context menu, `http(s)` links via `launchUrl` |
| Interactivity | Default Power BI **tooltips** for measures in the Tooltips field well |
| Interactivity | **HTML slicer mode** — `data-hf-filter="Region:North"` applies a real report filter (`applyJsonFilter`) so a hand-built HTML nav/list filters every other visual; `data-hf-filter-clear` resets |
| Interactivity | **Viewer write-back** — `data-hf-state="key"` on inputs / textareas / selects persists their value with the report (shared checklist / sign-off) |
| Theming | Active report theme exposed as CSS variables (`--hf-accent`, `--hf-foreground`, …) |
| Theming | **Fonts** card — Google Fonts families (`@import`, WebAccess-gated) or self-hosted `@font-face` (data-URI) |
| i18n | **Text direction** auto (from locale) / LTR / RTL; locale-aware `number` / `percent` / `currency` / `date` helpers |
| Perf | Render **memoisation** (style/resize updates skip the template engine), an optional **max rows** cap, and **windowed virtualization** past 250 rows in per-row mode |
| Format | **On-object formatting** — in format mode the content region is sub-selectable; the mini-toolbar edits font / bold / italic / underline / colour / background, and `data-hf-object="content"` exposes extra regions |
| UI kit | **Bootstrap 5 built in** — full CSS + Bootstrap Icons (webfont inlined, no CDN) always available; JS components (collapse, tabs, dropdowns, tooltips, toasts, carousel…) via `data-bs-*`, toggleable. `bootstrap.Modal` is limited to the visual's own rectangle by the Power BI sandbox. |
| Security | **DOMPurify** sanitisation with a configurable allow-list; inline `<script>` only behind an explicit unsafe toggle |
| DX | **Advanced editor** (modal dialog): Monaco with `{{ }}` syntax highlighting, field/helper/component autocomplete, starter-template gallery, live preview, a bound-**Data** tab and inline lint markers (unbalanced blocks, unknown helpers) |
| DX | In-visual **diagnostics panel**: template errors, sanitiser removals, available field names |

Open the editor from the **✎ Template** button shown on the visual while the
report is in edit mode; OK writes the template back through `persistProperties`.

Not possible in a table-mapped custom visual: Power BI's native **fx**
conditional-formatting dialog (Microsoft blocks it for table/matrix
visuals) and **Highlight** — both deliberate non-goals here.

### Authoring hooks (data- attributes)

| Attribute | Effect |
| --- | --- |
| `data-hf-select="Field:Value"` (`; Field2:Value2` to AND) | click cross-filters every row where the field(s) match; ctrl/⌘-click adds |
| `data-hf-tabs="id"` + `data-hf-tab="k"` / `data-hf-panel="k"` | tab group |
| `data-hf-acc="id"` + `data-hf-acc-panel="id"` | accordion section |
| `data-hf-object="content"` | marks a region sub-selectable for on-object formatting in format mode |
| `data-hf-chart='{…}'` | renders a uPlot chart into the element (spec: type, x, y[], data, height, legend, colors) |
| `data-hf-filter="Region:North"` | applies a report filter (HTML slicer mode) |
| `data-hf-state="key"` | remembers this input's value with the report (write-back mode) |
| `data-bs-*` | Bootstrap 5 component behaviour |

Template helper `{{{selectAttr("Region", Region)}}}` emits the first one.

## Repository layout

```
src/
  visual.ts                       IVisual entry — update() / getFormattingModel()
  settings.ts                     formatting-model cards
  dataView/transform.ts           table DataView -> model + selection IDs + column refs
  rendering/
    templateEngine.ts             AST interpreter (no dynamic code gen) + partials
    helpers.ts, collectionHelpers.ts  helper registry (format, aggregation, qr, charts…)
    conditionalFormatting.ts      rule + colour-scale evaluator
    markdown.ts                   GitHub-flavoured Markdown (marked)
    components.ts                 sandbox-safe tabs / accordion runtime
    rowWindow.ts                  windowed virtualization
    sanitize.ts                   DOMPurify -> DocumentFragment
    htmlRenderer.ts               orchestration
  components/library.ts           built-in partial component library
  framework/
    bootstrapRuntime.ts           injects bundled Bootstrap 5 CSS + wires its JS
    bootstrapCss.ts               GENERATED by scripts/embed-bootstrap.mjs (git-ignored)
    canvasCharts.ts               data-hf-chart -> uPlot
  interactivity/                  selection, slicer, form-state, tooltip, selectMatch
  onObject/subSelection.ts        on-object formatting descriptors
  theme/                          themeVars, fonts, presets
  editor/                         Monaco (no-worker) setup, hf-template language,
                                  gallery, lintTemplate
  dialog/templateEditorDialog.ts  the advanced-editor modal dialog
  i18n.ts, dom/inject.ts, ui/debugPanel.ts, landing/landing.ts
capabilities.json                 data roles, table mapping (30k window), objects
stringResources/{en-US,tr-TR}/    localization
```

The template engine performs **no dynamic code generation** — expressions are
interpreted from an AST — so the visual stays inside the Power BI sandbox and
clean for Microsoft certification.

## Develop

```bash
npm install        # also runs scripts/embed-bootstrap.mjs (prepare)
npm start          # pbiviz start — live in Power BI Desktop / Service
npm test           # vitest — pure module tests
npm run lint       # eslint + eslint-plugin-powerbi-visuals
npm run package    # produces dist/*.pbiviz
```

Requires the Power BI certificate for `pbiviz start`
(`pbiviz --install-cert`).

## Sandbox limitations (inherited from Power BI, not this visual)

External `<script src>`, `<object>`, modals/popups, cookies/localStorage and
most non-`http(s)` links are blocked by the host sandbox. `<iframe>` does not
render in Desktop and is CORS-gated in the Service.

## License

MIT
