# HTML Studio

**A Power BI custom visual that renders your data as HTML and SVG on the report
canvas** — with a real templating engine, a component library, interactive
charts, Bootstrap 5 and a built-in Monaco editor.

It is a modern take on the classic *HTML Viewer* / *HTML Content* visuals: the
same "just show my HTML" idea, but you rarely have to build that HTML with DAX
string concatenation any more. You bind a few fields, write a small template,
and HTML Studio turns each row into markup — cards, tables, KPI tiles, badges,
timelines, charts — using the report theme, and wires up cross-filtering,
tooltips and links for you.

> MIT licensed. Not affiliated with or endorsed by Microsoft.

---

## What you can build

- **Data-driven layouts** — one HTML block for the whole result, or one per row
  (`{{#each rows}}` … `{{/each}}`), with `{{Field}}` placeholders, `{{#if}}`
  conditions and helpers.
- **KPI tiles / scorecards** without measures-as-text: `{{> kpi label=Product
  value=Actual target=Target}}` from the built-in component library.
- **Interactive charts** inside your HTML: `<div data-hf-chart='{"type":"line",
  "x":"Month","y":["Actual","Target"]}'></div>` → a real uPlot canvas.
- **A custom HTML slicer** — build a nav / button bar / tree in HTML and have it
  filter the rest of the report (`data-hf-filter="Region:North"`).
- **A checklist / sign-off panel** whose ticks are remembered with the report
  (`data-hf-state="…"`).
- **Markdown** content, **conditional formatting** by JSON rules or colour
  scales, **Bootstrap 5** components (`data-bs-toggle="collapse"` …),
  **Google Fonts** / `@font-face`, **RTL**, and locale-aware number / date
  formatting.

## Quick start (report authors)

1. Add the visual to a report (Power BI Desktop: **Get more visuals → Import a
   visual from a file** and pick the `.pbiviz` from
   [Releases](https://github.com/selimozbas/PowerBI-HTML-Studio/releases)).
2. Drop a column or measure onto the **Content** field well. If its value is
   already HTML, you'll see it rendered.
3. To build markup from data, open the **Format** pane → **Content** → set
   **Content source** to **Template**, and (in report edit mode) click the
   **✎ Template** button on the visual to open the editor.
4. A minimal per-row template:

   ```handlebars
   {{#each rows}}
     <div class="card mb-2"><div class="card-body">
       <h6>{{content}}</h6>
       <div class="fs-4">{{number(Actual)}}</div>
       <div>{{{bar(Actual, Target)}}} {{percent(pct(Actual, Target), 0)}} of target</div>
     </div></div>
   {{/each}}
   ```

   Bind **Content** to the product name and add `Actual` / `Target` measures to
   the **Data (named fields)** well so `{{Actual}}` / `{{Target}}` resolve.

## Documentation

Full guide in [**`docs/`**](docs/README.md):

| | |
| --- | --- |
| [Getting started](docs/getting-started.md) | Install, field wells, content sources, the editor |
| [Templating](docs/templating.md) | The `{{ }}` language: interpolation, blocks, `{{#each}}`, partials, context |
| [Helpers](docs/helpers.md) | Every `{{ helper(...) }}` — formatting, aggregation, charts, QR, colour |
| [Components](docs/components.md) | The `{{> name}}` component library and how to add your own |
| [`data-*` attributes](docs/data-attributes.md) | All `data-hf-*` / `data-bs-*` hooks in one table |
| [Charts](docs/charts.md) | The `data-hf-chart` spec in detail |
| [Conditional formatting](docs/conditional-formatting.md) | JSON rules, colour scales, DAX colour measures |
| [Interactivity](docs/interactivity.md) | Cross-filter, HTML slicer, write-back, tooltips, components |
| [Styling](docs/styling.md) | Theme variables, presets, custom CSS, fonts, Bootstrap, RTL |
| [Settings reference](docs/settings.md) | Every formatting card and option |
| [Security & limitations](docs/security-and-limitations.md) | Sanitisation, the Power BI sandbox, what isn't possible |
| [Development](docs/development.md) | Build from source, project layout, tests, CI, releasing |

## Develop

```bash
npm install        # also runs scripts/embed-bootstrap.mjs (prepare)
npm start          # pbiviz start — live in Power BI Desktop / Service
npm test           # vitest — pure module tests
npm run lint       # eslint + eslint-plugin-powerbi-visuals
npm run typecheck  # strict TypeScript
npm run package    # produces dist/*.pbiviz
```

`pbiviz start` needs the developer certificate once: `pbiviz --install-cert`.
See [docs/development.md](docs/development.md).

## Design principles

- **No dynamic code generation.** The template engine parses to an AST and
  interprets it — no `eval`, no `new Function` — so the visual runs inside the
  Power BI sandbox and stays certification-friendly.
- **Everything is bundled.** Bootstrap, its icon font, uPlot, the QR generator
  and Monaco all ship inside the `.pbiviz`; nothing is fetched from a CDN, so
  it works offline and in **Export to PDF / PowerPoint**.
- **Sanitised by default.** Author HTML goes through DOMPurify before it
  touches the DOM; inline `<script>` is only kept behind an explicit toggle
  (and the sandbox blocks external scripts regardless).

## License

[MIT](LICENSE)
