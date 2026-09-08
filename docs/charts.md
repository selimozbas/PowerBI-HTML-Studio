# Charts

An element with a `data-hf-chart` attribute becomes an interactive
[uPlot](https://github.com/leeoniya/uPlot) canvas chart. uPlot is bundled
(~45 KB) — nothing is fetched — so charts render offline and in
**Export to PDF / PowerPoint**.

```handlebars
<div data-hf-chart='{"type":"line","x":"content","y":["Actual","Target"],"height":180}'></div>
```

The element is sized to its own width; give it a container with a width and it
resizes with the visual.

## Spec

`data-hf-chart` is a JSON object:

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `type` | `"line"` \| `"spline"` \| `"area"` \| `"bar"` | `"line"` | series style |
| `x` | string | — | field name for the x values / category labels; when omitted or non-numeric, the row index is used and `x` (if given) becomes the axis labels |
| `y` | string \| string[] | — | one or more field names for the series |
| `data` | number[][] | — | inline data instead of rows: `[[x…], [y1…], [y2…], …]`. When present, `x` / `y` are ignored |
| `height` | number | `160` | pixels |
| `legend` | boolean | `true` when >1 series | show the legend |
| `colors` | string[] | theme accents | series colours (hex) |

## From bound rows

The chart reads the same `rows` the template does. Put the chart in a
**single-block** template (so all rows are available) rather than a per-row one:

```handlebars
<div class="card"><div class="card-body">
  <h6 class="card-title">Actual vs Target by month</h6>
  <div data-hf-chart='{"type":"area","x":"Month","y":["Actual","Target"],"height":200}'></div>
</div></div>
```

- `Month` numeric → used as the x scale.
- `Month` text (e.g. "Jan", "Feb") → rows are plotted by index and the month
  names label the x axis.

## From inline data

```handlebars
<div data-hf-chart='{"type":"bar","data":[[1,2,3,4],[10,14,9,16]],"height":140}'></div>
```

## Notes

- Charts render in **single-block** / non-virtualized mode. In a virtualized
  per-row list (>250 rows) charts inside rows are not built — keep charts in an
  aggregate template.
- Points are shown only when there are ≤ 30 x values.
- `bar` uses grouped bars; `area` fills under the line at ~13% opacity.
- For a tiny trend indicator rather than a full chart, use the `sparkline`
  helper or the `{{> sparkRow}}` component ([helpers](helpers.md)).
