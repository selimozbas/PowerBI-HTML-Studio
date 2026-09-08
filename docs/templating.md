# Templating

HTML Studio's template language is a small, Handlebars-flavoured subset. It is
**interpreted from an AST** — it never generates or runs code dynamically — so
it stays inside the Power BI sandbox and is safe against code injection.

## Interpolation

| Syntax | Output |
| --- | --- |
| `{{ expr }}` | value of `expr`, **HTML-escaped** — use for plain text / labels |
| `{{{ expr }}}` | value of `expr`, **raw HTML** — use for helpers that return markup (`{{{bar(a,b)}}}`) **and when the field value is itself HTML** (`{{{content}}}`) |

> If your **Content** field already produces complete HTML, you usually don't
> need a template at all — leave *Content source* on **Field value** and it
> renders as-is. Only switch to *Template* when you want to build markup around
> your fields; then remember `{{{content}}}` (triple braces) to inject HTML
> rather than escape it. The gallery's *Pass through HTML* / *Wrap HTML*
> starters do exactly this.

`expr` can be:

- a **path** — `Revenue`, `row.name`, `this`, `@index`
- a **literal** — `42`, `'text'`, `"text"`, `true`, `false`, `null`
- a **comparison** — `Actual >= Target` → renders `true` / `` (empty)
- a **helper call** — `format(Revenue, "0.0%")`, nesting allowed:
  `format(add(a, b), "0")`

Operators: `===` `!==` `==` `!=` `<=` `>=` `<` `>`
(`==` / `!=` compare numerically when both sides look numeric, otherwise as
strings).

## Blocks

```handlebars
{{#if Actual >= Target}} on track {{else}} behind {{/if}}

{{#unless IsArchived}} …still active… {{/unless}}

{{#each rows}}
  {{@index}}: {{content}} — {{Actual}}
{{/each}}
```

Inside `{{#each list}}`:

| Variable | Meaning |
| --- | --- |
| `this` | the current item |
| `@index` | 0-based position |
| `@first` / `@last` | booleans |
| *(item fields)* | if the item is an object, its properties are in scope directly — `{{content}}`, `{{Actual}}` |

`{{#each}}` also accepts a helper that returns an array, so you can sort / filter
/ group inline:

```handlebars
{{#each top(rows, 5, "Actual")}} … {{/each}}
{{#each where(rows, "Region", "North")}} … {{/each}}
{{#each groupBy(rows, "Category")}}
  <h5>{{key}} ({{count}})</h5>
  {{#each items}} … {{/each}}
{{/each}}
```

## The data context

**Per-row template** (`Render = Per row`) — the row's fields are the top-level
context:

| In scope | Value |
| --- | --- |
| `content` | the **Content** field value for this row |
| `{{AnyField}}` | any field from the **Data** well |
| `@index` | the row's index in the result |
| `cfStyle`, `cfClass` | inline style / class names from [conditional formatting](conditional-formatting.md) |
| `cfBg`, `cfColor` | a bound DAX colour measure, if one is named like `…Background` / `…Color` |

**Single-block template** (`Render = Single block`) — you get:

| In scope | Value |
| --- | --- |
| `rows` | array of row objects (each shaped like the per-row context above) |
| `rowCount` | number of rows rendered |
| `totalRowCount` | number before any *Max rows* cap |
| `fieldNames` | display names of the **Data** fields |

Example single-block template with a subtotal:

```handlebars
<table class="table table-sm">
  {{#each rows}}
  <tr style="{{cfStyle}}"><td>{{content}}</td><td class="text-end">{{number(Actual)}}</td></tr>
  {{/each}}
  <tr class="fw-bold"><td>Total</td><td class="text-end">{{number(sum(rows, "Actual"))}}</td></tr>
</table>
```

## Partials (components)

`{{> name key=expr key2=expr}}` renders a **partial** — a named sub-template.
HTML Studio ships a [component library](components.md) (`kpi`, `trend`, `gauge`,
…) and you can add your own in **Format pane → Content → Partials**:

```
@partial statCard
<div class="card"><div class="card-body">
  <div class="text-secondary small">{{label}}</div>
  <div class="fs-4">{{number(value)}}</div>
</div></div>
```

Then:

```handlebars
{{#each rows}}{{> statCard label=content value=Actual}}{{/each}}
```

- Each `key=expr` is evaluated against the current context and becomes a
  variable inside the partial.
- The partial also sees the surrounding context (flattened), so `{{rows}}` etc.
  still work inside it.
- A user partial **overrides** a built-in of the same name.
- Recursion is capped at depth 20.

## Comments and whitespace

There is no dedicated comment tag — use HTML comments (`<!-- … -->`), which the
sanitiser removes from the output. Whitespace inside the template is preserved
as written.

## Markdown mode

**Format pane → Content → Treat content as Markdown** converts the produced
string (per row, or the whole block) from GitHub-flavoured Markdown to HTML
before sanitising. Handy when the source is prose or a Markdown measure; combine
with a template for structure and Markdown for content.
