# Conditional formatting

Power BI's native **fx** conditional-formatting dialog is **not available** to
table/matrix-mapped custom visuals (a Microsoft platform restriction), and HTML
Studio uses a table mapping. Instead you have two routes:

1. **Rule JSON** in the formatting pane — evaluated per row by the visual.
2. **A DAX colour measure** in the *Data* well — surfaced in templates.

## Rule JSON

**Format pane → Conditional formatting → Enabled**, then **Rules (JSON)** is an
array. Each matching rule contributes to the row's inline style / classes, which
you apply via `{{cfStyle}}` / `{{cfClass}}` on the row element (in *Per row*
mode the row wrapper gets them automatically).

### Comparison rules

```json
[
  { "field": "Revenue", "op": ">", "value": 1000,
    "style": { "color": "#0a7", "fontWeight": "bold" }, "class": "is-high" },
  { "field": "Status", "op": "==", "value": "Late",
    "style": { "background": "#fde7e9" } },
  { "field": "Score", "op": "between", "value": 40, "value2": 70,
    "style": { "borderLeft": "3px solid #f5a623" } }
]
```

| `op` | Match |
| --- | --- |
| `>` `>=` `<` `<=` | numeric |
| `==` `!=` | case/space-insensitive string equality |
| `contains` | substring (case-insensitive) |
| `between` | `value` ≤ cell ≤ `value2` |

`style` keys (camelCase or CSS): `color`, `background` / `backgroundColor`,
`fontWeight`, `fontStyle`, `border`, `borderLeft`, `textAlign`, `opacity`
(unknown keys pass through as-is).

### Colour-scale rules

```json
[
  { "scale": { "field": "Score", "min": 0, "max": 100,
               "minColor": "#fde7e9", "maxColor": "#d1e7dd" } }
]
```

- Optional mid stop: `"mid": 50, "midColor": "#ffffff"`.
- `"target": "color"` applies the scale to text instead of the background
  (default `"bg"`).
- `field` defaults to the rule's `field` if you also set one.

### Using the result

*Per row* mode — nothing to do, the wrapper carries `style="{{cfStyle}}"` and
the classes.

Templates — apply them yourself:

```handlebars
{{#each rows}}
  <tr style="{{cfStyle}}" class="{{cfClass}}"><td>{{content}}</td><td>{{Score}}</td></tr>
{{/each}}
```

Bad JSON is reported in the **diagnostics panel** (Format pane → Diagnostics →
Show diagnostics panel).

## DAX colour measure

Create a measure that returns a colour and drop it in the **Data** well:

```DAX
Status Color = SWITCH(TRUE(),
  [Actual] >= [Target], "#1a7f37",
  [Actual] >= 0.8 * [Target], "#bf8700",
  "#cf222e")
```

Reference it in the template by its name — `{{Status Color}}` — or, when the
field name ends in `Color` / `Colour` / `Background` / `Bg` / `Fill`, use the
convenience aliases `{{cfColor}}` / `{{cfBg}}`:

```handlebars
{{#each rows}}
  <div class="hf-row" style="border-left:4px solid {{cfColor}}">{{content}}</div>
{{/each}}
```

You can also compute a colour inline with the
[`colorScale`](helpers.md#colour) helper, no rule needed.
