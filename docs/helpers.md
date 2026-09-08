# Helpers

Helpers are called as `{{ name(arg, arg, …) }}`. They are pure functions that
return a primitive or a self-contained SVG string. Wrap markup-returning helpers
in triple braces: `{{{ bar(a, b) }}}`.

`list` below means an array — usually `rows` from a single-block template.
`field` is a column display name (a string in quotes). When `field` is omitted,
`list` is treated as a list of numbers.

## Formatting

| Helper | Example | Result |
| --- | --- | --- |
| `format(value, pattern)` | `format(0.1234, "0.0%")` | `12.3%` — Excel-style patterns: `0`, `0.00`, `#,##0`, `0%`, `$#,##0.00`, plus date tokens `yyyy-MM-dd`, `dd/MM/yyyy`, `HH:mm` |
| `number(value, [decimals])` | `number(1234567.5, 1)` | locale grouping — `1,234,567.5` (or `1.234.567,5` in de-DE) |
| `percent(value, [decimals])` | `percent(0.1234, 1)` | `12.3%` (scales ×100) |
| `currency(value, [ISO code])` | `currency(1000, "EUR")` | `€1,000.00` |
| `date(value, [style])` | `date(SaleDate, "short")` | locale date; styles: `short` `medium` `long` `full` `time` |
| `relativeTime(value)` | `relativeTime(DueDate)` | `in 3 days` / `2 months ago` |
| `duration(seconds)` | `duration(3661)` | `1:01:01` |

## Strings

| Helper | Notes |
| --- | --- |
| `upper(v)` / `lower(v)` / `trim(v)` | case / trim |
| `default(v, fallback)` | `fallback` when `v` is null / undefined / `""` |
| `split(str, [sep])` | `"a, b, c"` → `["a","b","c"]` (default separator `,`) — pair with `{{#each}}` |
| `join(list, [sep])` | array → string (default `", "`) |
| `initials(name)` | `"Ada Lovelace"` → `AL` |
| `json(v)` | `JSON.stringify(v)` |

## Math

`add(a,b)` `sub(a,b)` `mul(a,b)` `div(a,b)` (0 when `b` is 0)
`pct(a,b)` → `a / b * 100`
`round(v, [digits])`

## Aggregation / sort / filter

Operate over a `list` (usually `rows`):

| Helper | Returns |
| --- | --- |
| `sum(list, field)` | total |
| `avg(list, field)` | mean |
| `min(list, field)` / `max(list, field)` | extremes |
| `count(list)` | length |
| `first(list, [field])` / `last(list, [field])` | edge item (or its field) |
| `pluck(list, field)` | array of that field's values |
| `sortBy(list, field, ["asc"\|"desc"])` | new sorted array |
| `where(list, field, value)` / `whereNot(list, field, value)` | filtered array (case/space-insensitive match) |
| `top(list, n, field)` / `bottom(list, n, field)` | n highest / lowest, sorted |
| `rank(list, field, item)` | 1-based rank of `item` within `list` by `field` (desc) |
| `pctOfTotal(value, list, field)` | `value / sum(list, field) * 100` |
| `groupBy(list, field)` | `[{ key, items, count }, …]` — iterate with `{{#each}}` |

```handlebars
{{#each top(rows, 3, "Revenue")}}
  <div>#{{rank(rows, "Revenue", this)}} {{content}} — {{number(Revenue)}}
       ({{percent(pctOfTotal(Revenue, rows, "Revenue"), 1)}})</div>
{{/each}}
```

> There is no `../` parent syntax. Outer-scope variables like `rows` stay
> visible **by name** inside a loop, as long as the current item has no field
> of the same name.

## Inline visuals (SVG)

All return a self-contained `<svg>` string (or a sized wrapper) — use `{{{ }}}`.

| Helper | Example |
| --- | --- |
| `sparkline(series, [w], [h])` | `{{{sparkline("3,5,4,7,6,9", 90, 22)}}}` — `series` is a comma/space list or an array (`pluck`) |
| `bar(value, [max], [w], [h])` | `{{{bar(Actual, Target, 120)}}}` |
| `ring(value, [max], [size])` | `{{{ring(Actual, Target, 48)}}}` — donut with % label |
| `rating(value, [max], [size])` | `{{{rating(Score, 5)}}}` — star row |
| `gauge` | not a helper — use the `{{> gauge}}` component |
| `qr(text, [px])` | `{{{qr(LinkUrl, 96)}}}` — inline SVG QR code, no network |

## Colour

| Helper | Example |
| --- | --- |
| `colorScale(value, min, max, fromHex, toHex)` | `colorScale(Score, 0, 100, "#fde7e9", "#d1e7dd")` → an interpolated `#rrggbb` |

```handlebars
{{#each rows}}
  <td style="background:{{colorScale(Score, 0, 100, '#fff', '#2e7d32')}}">{{Score}}</td>
{{/each}}
```

## Cross-filter attribute

| Helper | Example |
| --- | --- |
| `selectAttr(field, value)` | `<li {{{selectAttr("Region", Region)}}}>` → emits `data-hf-select="Region:North"` (see [interactivity](interactivity.md)) |
