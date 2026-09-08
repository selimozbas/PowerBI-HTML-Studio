# Components

Components are **partials** — reusable sub-templates called with
`{{> name key=value …}}`. HTML Studio ships a small library, and you can add or
override entries in **Format pane → Content → Partials**.

Every parameter is an expression evaluated in the calling context, so you pass
fields (`value=Actual`), literals (`unit="$"`) or helper results
(`value=sum(rows,"Actual")`).

## Built-in library

| Component | Parameters | Renders |
| --- | --- | --- |
| `kpi` | `label`, `value`, `target` *(opt)*, `unit` *(opt)* | a card: caption, big number, and a progress bar coloured green/amber vs `target` |
| `stat` | `label`, `value`, `icon` *(opt, Bootstrap-Icons name)* | compact icon + number + caption row |
| `progress` | `label`, `value`, `max` | label, `value / max`, and a progress bar |
| `ringStat` | `label`, `value`, `max` | a 64px donut with a % label, caption under it |
| `trend` | `label`, `value`, `prev` | number + up/down arrow + % change vs `prev` |
| `pill` | `text`, `good` | a rounded badge, green when `text == good`, grey otherwise |
| `deltaBadge` | `value`, `base` | `+x%` / `-x%` badge, green when `value >= base` |
| `ratingStars` | `value`, `max` *(opt, default 5)* | a star row |
| `sparkRow` | `label`, `series`, `value` | label + inline sparkline + value; `series` is a comma list or `pluck(...)` |
| `gauge` | `value`, `max` | a semicircular SVG gauge with a % label |
| `comparison` | `label`, `actual`, `target` | an actual-vs-target overlaid bar with a target marker |
| `calloutCard` | `title`, `text`, `icon` *(opt)*, `variant` *(opt: `secondary` `primary` `success` `warning` `danger` `info`)* | a Bootstrap alert with an icon |
| `avatarList` | `names` (comma-separated) | overlapping initials circles |
| `timelineItem` | `time`, `title`, `text` | a dated timeline entry with a left rule |

### Examples

```handlebars
<div class="row g-2">
  {{#each rows}}
    <div class="col-sm-6 col-lg-3">{{> kpi label=content value=Actual target=Target}}</div>
  {{/each}}
</div>

{{#each rows}}{{> sparkRow label=content series=History value=Actual}}{{/each}}

{{> calloutCard variant="warning" icon="exclamation-triangle"
     title="Attention" text="Backlog is above threshold"}}

{{#each rows}}{{> timelineItem time=EventDate title=content text=Detail}}{{/each}}
```

## Defining your own

In **Format pane → Content → Partials**, one `@partial <name>` line per
component, followed by its template:

```
@partial priceTag
<span class="badge text-bg-light border">
  {{currency(value, default(ccy, "USD"))}}
</span>

@partial statusRow
<tr class="{{cfClass}}"><td>{{label}}</td><td>{{> priceTag value=amount}}</td></tr>
```

- Partials can call helpers and **other partials** (built-in or user), so you
  can compose small pieces.
- A user partial named `kpi` **replaces** the built-in `kpi`.
- The Monaco editor autocompletes `> ` with the full component list; the live
  preview and gallery use the built-ins.

## Notes

- Components use Bootstrap 5 classes (`card`, `badge`, `progress`, `alert`,
  `text-bg-*`, spacing utilities) and Bootstrap-Icons (`<i class="bi bi-…">`),
  both bundled — see [styling.md](styling.md).
- SVG components (`gauge`) and SVG helpers use the theme variables
  `--hf-accent` / `--hf-track` so they match the report.
