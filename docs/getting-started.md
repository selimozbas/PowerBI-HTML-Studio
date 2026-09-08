# Getting started

## Install the visual

**From a release build**

1. Download the latest `htmlStudio*.pbiviz` from
   [Releases](https://github.com/selimozbas/PowerBI-HTML-Studio/releases).
2. Power BI Desktop → **Insert → More visuals → Import a visual from a file**
   (or the "…" on the Visualizations pane) → pick the `.pbiviz`.
3. The HTML Studio icon appears on the Visualizations pane. Add it to a page.

**From source** — see [development.md](development.md).

## Field wells

| Well | Accepts | Purpose |
| --- | --- | --- |
| **Content** | 1 column or measure | The HTML/SVG source, or the value referenced by `{{content}}` in a template. |
| **Data (named fields)** | up to 20 columns / measures | Extra values, referenced in templates by their display name — `{{Revenue}}`, `{{Target}}`. |
| **Sort by** | up to 4 columns | Orders the rows before rendering. |
| **Tooltips** | up to 20 measures | Shown in the default Power BI tooltip when you hover a rendered row. |

The visual uses a **table** data mapping and reads up to **30 000** rows.

## Content source

**Format pane → Content → Content source**

- **Field value** (default) — the value in the **Content** field is rendered
  as-is. Use this when your column/measure already produces HTML (for example a
  DAX measure that builds a string).
- **Template** — you write a template and the visual renders it once per result
  or once per row (see *Render* below). `{{content}}` is the Content-field
  value; `{{OtherField}}` is any field in the **Data** well.

## Render

**Format pane → Content → Render**

- **Single block** — the template runs once. In *Field value* mode the row
  values are concatenated with the **Row separator** you set (`<hr/>`, `newline`,
  `\n`, …). In *Template* mode you get a `rows` array to iterate:
  `{{#each rows}} … {{/each}}`.
- **Per row** — the **Row template** (or the raw Content value) runs once per
  row and each result is wrapped in `<div class="hf-row" data-hf-row="i">`,
  which is what click-to-cross-filter and dimming hook onto. Past ~250 rows the
  visual switches to windowed rendering automatically.

## The advanced editor

In **report edit mode**, HTML Studio shows a small **✎ Template** button in the
top-right of the visual. It opens a Monaco-based editor with:

- `{{ }}` / HTML syntax highlighting
- autocomplete for your **field names**, **helpers** and **components**
- a **starter-template gallery** (KPI cards, progress list, tabs, chart card,
  component dashboard, status table)
- a **live preview** built from a sample of your bound rows
- a **Data** tab showing that sample as a table
- inline **lint markers** for unbalanced `{{#if}}` / `{{#each}}` and unknown
  helper names

Clicking **OK** writes the text back into **Body template** or **Row template**
(matching the current *Render* mode) via `persistProperties`, and switches
**Content source** to **Template**.

You can also just type into the **Body template** / **Row template** text areas
in the Format pane.

## No data

**Format pane → Content → No-data message** — text to show when no rows are
bound (and when it is empty, a short getting-started card is shown instead).
