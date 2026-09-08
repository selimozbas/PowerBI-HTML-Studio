# HTML Forge — Power BI custom visual

Render column or measure values as **HTML and SVG** on the report canvas — a
spiritual successor to the classic *HTML Viewer* / *HTML Content* visuals, with
a lot more built in.

> Working name. GUID, display name and marketplace metadata are placeholders
> until first submission.

## What it adds over a plain HTML renderer

| Area | Feature |
| --- | --- |
| Content | CSP-safe **templating engine** — `{{field}}`, `{{#each rows}}`, `{{#if a > b}}`, helpers (`format`, `bar`, `ring`, `sparkline`, `rating`, math/string) |
| Content | **Named data fields** — drop extra measures in *Data* and reference them as `{{Revenue}}`; no DAX string concatenation |
| Styling | **Rule-based conditional formatting** authored as JSON, applied per row without DAX |
| Content | **Markdown mode** — GitHub-flavoured, per row or per block, still sanitised |
| Interactivity | **Sandbox-safe components** — tabs & accordion via `data-` attributes, state persisted with `persistProperties` |
| Interactivity | Cross-filter by row **or by field value** (`data-hf-select="Region:North"`), multi-select, dimming, right-click context menu, `http(s)` links via `launchUrl` |
| Interactivity | Default Power BI **tooltips** for measures in the Tooltips field well |
| Theming | Active report theme exposed as CSS variables (`--hf-accent`, `--hf-foreground`, …) |
| Security | **DOMPurify** sanitisation with a configurable allow-list; inline `<script>` only behind an explicit unsafe toggle |
| DX | In-visual **diagnostics panel**: template errors, sanitiser removals, available field names |

Planned next: Monaco advanced editor + template gallery, RTL & locale number
helpers, `@font-face` embedding, DOM virtualization for very large tables.

### Authoring hooks (data- attributes)

| Attribute | Effect |
| --- | --- |
| `data-hf-select="Field:Value"` (`; Field2:Value2` to AND) | click cross-filters every row where the field(s) match; ctrl/⌘-click adds |
| `data-hf-tabs="id"` + `data-hf-tab="k"` / `data-hf-panel="k"` | tab group |
| `data-hf-acc="id"` + `data-hf-acc-panel="id"` | accordion section |

Template helper `{{{selectAttr("Region", Region)}}}` emits the first one.

## Repository layout

```
src/
  visual.ts                 IVisual entry — update() / getFormattingModel()
  settings.ts               formatting-model cards
  dataView/transform.ts     DataView(table) -> ForgeModel + selection IDs
  rendering/
    templateEngine.ts       AST interpreter — parses to a node tree and walks it
    helpers.ts              template helper registry
    format.ts               number / date formatter
    charts.ts               inline-SVG mini charts
    conditionalFormatting.ts rule parser + evaluator
    components.ts            tabs / accordion runtime
    sanitize.ts             DOMPurify wrapper
    htmlRenderer.ts          orchestration -> HTML string
  interactivity/selection.ts selection manager + context menu binding
  theme/themeVars.ts        report theme -> CSS custom properties
  dom/inject.ts             single sanitised-HTML injection point
  ui/debugPanel.ts          diagnostics panel
  landing/landing.ts        first-run landing page
capabilities.json           data roles, table mapping (30k window), objects
pbiviz.json
```

The template engine performs **no dynamic code generation** — expressions are
interpreted from an AST — so the visual stays inside the Power BI sandbox and
clean for Microsoft certification.

## Develop

```bash
npm install
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
