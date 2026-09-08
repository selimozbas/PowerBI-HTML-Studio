# Interactivity

## Cross-highlight (`data-hf-select`)

Clicking an element with `data-hf-select` selects the matching data points — the
standard Power BI cross-highlight that dims other visuals and this one's other
rows.

```handlebars
{{#each rows}}
  <button class="btn btn-sm" {{{selectAttr("Region", Region)}}}>{{Region}}</button>
{{/each}}
```

- `data-hf-select="Region:North"` — one field/value.
- `data-hf-select="Region:North; Segment:Retail"` — **AND**; selects rows
  matching every pair.
- Ctrl / ⌘-click adds to the current selection.
- Clicking empty space (or the same element again) clears it.
- In *Per row* mode the row wrapper (`data-hf-row`) is already selectable —
  clicking a row cross-highlights it.

**Settings** — *Format pane → Interactivity*:
*Cross-filter on click* (default on), *Dim unselected (%)* (default 50),
*Right-click context menu* (default on).

`.hf-selected` is toggled on active `data-hf-select` elements — style it via
Custom CSS.

## HTML slicer mode (`data-hf-filter`)

Turns clicks into a **real report filter** — build your own slicer UI (a nav
bar, a list, a tree) in HTML.

**Enable it:** *Format pane → HTML slicer → Filter the report from
data-hf-filter elements* (off by default).

```handlebars
<div class="btn-group">
  {{#each groupBy(rows, "Region")}}
    <button class="btn btn-outline-primary btn-sm" data-hf-filter="Region:{{key}}">{{key}}</button>
  {{/each}}
  <button class="btn btn-outline-secondary btn-sm" data-hf-filter-clear>All</button>
</div>
```

- `data-hf-filter="Region:North; Region:South"` — filters to `Region IN
  ("North","South")`.
- `data-hf-filter="Region:North; Segment:Retail"` — a filter per field.
- Clicking the currently-active chip, or a `data-hf-filter-clear` element,
  removes the filter.
- The active chip gets `.hf-filter-active` (styled with an accent background by
  default).
- Only **non-measure columns** bound to *Content* / *Data* can be filtered
  (a query reference is required).

## Viewer write-back (`data-hf-state`)

Form controls with `data-hf-state="key"` have their value **remembered with the
report** — a shared checklist / sign-off, not a per-user note.

**Enable it:** *Format pane → Viewer write-back → Remember form input* (off by
default).

```handlebars
<ul class="list-unstyled">
  {{#each rows}}
  <li>
    <label>
      <input type="checkbox" data-hf-state="done.{{@index}}"> {{content}}
    </label>
  </li>
  {{/each}}
</ul>
<textarea class="form-control" data-hf-state="notes" placeholder="Notes…"></textarea>
```

- Works on `<input>` (checkbox / radio / text / …), `<textarea>`, `<select>`.
- State is stored via `persistProperties`, so it is part of the report — it
  survives refresh and a report save and is the same for everyone who opens the
  report. It is **not** encrypted or access-controlled; don't use it for
  secrets.

## Links

`http(s)` links are opened through Power BI's `launchUrl` (a new browser tab),
because the sandbox blocks normal navigation. *Format pane → Hyperlinks → Open
http/https links* (default on). Other URL schemes and `#fragment` links are left
to the browser / Bootstrap.

## Tooltips

Drop measures into the **Tooltips** field well and they appear in the default
Power BI tooltip when you hover a rendered row (*Per row* mode).

## Interactive components

**Built-in (no Bootstrap needed)** — `data-hf-tabs` / `data-hf-tab` /
`data-hf-panel` and `data-hf-acc` / `data-hf-acc-panel`
(see [data-attributes.md](data-attributes.md#built-in-tabs--accordion)).
State is persisted when *Components → Remember component state* is on.

**Bootstrap 5** — with *Format pane → Bootstrap 5 → Interactive components* on
(default), Bootstrap's `data-bs-*` API works: `collapse`, `tab`, `dropdown`,
`tooltip`, `popover`, `carousel`, `toast`, `offcanvas`, `scrollspy`.

```handlebars
<div class="accordion" id="acc">
  {{#each rows}}
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#p{{@index}}">
        {{content}}
      </button>
    </h2>
    <div id="p{{@index}}" class="accordion-collapse collapse" data-bs-parent="#acc">
      <div class="accordion-body">{{{Detail}}}</div>
    </div>
  </div>
  {{/each}}
</div>
```

`bootstrap.Modal` only covers the visual's own rectangle (a sandbox limit) — fine
in focus mode, not useful in a small tile. See
[security-and-limitations.md](security-and-limitations.md).
