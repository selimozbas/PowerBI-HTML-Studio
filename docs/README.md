# HTML Studio documentation

HTML Studio is a Power BI custom visual that renders column and measure values
as **HTML and SVG** on the report canvas. You bind fields, optionally write a
template, and the visual produces markup per row (or one block for the whole
result), styled with the report theme and wired for cross-filtering, tooltips
and links.

## Contents

1. [Getting started](getting-started.md) — install, field wells, content
   sources, render modes, the advanced editor
2. [Templating](templating.md) — the `{{ }}` mini-language: interpolation,
   `{{#if}}` / `{{#each}}` / `{{#unless}}`, comparisons, partials, the data
   context
3. [Helpers](helpers.md) — the full `{{ helper(...) }}` reference
4. [Components](components.md) — the built-in `{{> name}}` component library,
   plus authoring your own partials
5. [`data-*` attributes](data-attributes.md) — every `data-hf-*` and
   `data-bs-*` hook
6. [Charts](charts.md) — the `data-hf-chart` specification
7. [Conditional formatting](conditional-formatting.md) — JSON rules, colour
   scales, and DAX colour measures
8. [Interactivity](interactivity.md) — cross-filter, HTML slicer mode, viewer
   write-back, tooltips, interactive components
9. [Styling](styling.md) — theme CSS variables, style presets, custom CSS,
   fonts, Bootstrap 5, text direction
10. [Settings reference](settings.md) — every formatting card and option
11. [Security & limitations](security-and-limitations.md) — sanitisation,
    the sandbox, and what Power BI does not allow
12. [Development](development.md) — building from source, project layout,
    tests, CI, releasing

## Mental model

```
Fields ──► internal model ──► template engine ──► HTML string ──► DOMPurify ──► DOM
  │            (rows[])          {{ }} + partials      + helpers     (sanitise)     │
  │                                                                                │
  └── Content / Data / Sort by / Tooltips                    interactivity wired ◄──┘
                                                       (cross-filter, slicer, tooltips,
                                                        links, components, write-back)
```

- **Content** field → the HTML source, or the value referenced by `{{content}}`.
- **Data (named fields)** → extra columns / measures referenced by name,
  e.g. `{{Revenue}}`.
- The engine performs **no dynamic code generation** (no `eval`); everything
  is bundled (Bootstrap, uPlot, Monaco, the QR generator) so it works offline
  and in export.
