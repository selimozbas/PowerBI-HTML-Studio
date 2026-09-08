# `data-*` attributes

HTML Studio activates behaviour on elements in your rendered HTML through
`data-` attributes. `data-hf-*` are HTML Studio's own; `data-bs-*` are
Bootstrap 5's (see [styling.md](styling.md)).

All of these attributes survive sanitisation. If you need other custom
attributes, add them under **Format pane → Security → Extra allowed
attributes**.

## Reference

| Attribute | On | Effect | Docs |
| --- | --- | --- | --- |
| `data-hf-row="i"` | *(emitted by the visual)* | marks a row wrapper in *Per row* mode; the anchor for click-to-cross-filter and dimming | [interactivity](interactivity.md) |
| `data-hf-select="Field:Value"` | any element | click **cross-highlights** every row where the field(s) match; `;`-join to AND multiple `Field:Value` pairs; Ctrl/⌘-click adds to the selection | [interactivity](interactivity.md) |
| `data-hf-filter="Field:Value"` | any element | *(HTML slicer mode)* click applies a real report **filter** (`applyJsonFilter`); `;`-join for multiple values / fields; click again to clear | [interactivity](interactivity.md) |
| `data-hf-filter-clear` | any element | *(HTML slicer mode)* click clears the visual's filter | [interactivity](interactivity.md) |
| `data-hf-state="key"` | `<input>` / `<textarea>` / `<select>` | *(write-back mode)* the control's value is remembered with the report | [interactivity](interactivity.md) |
| `data-hf-chart='{…}'` | a block element | renders an interactive **uPlot chart** into the element | [charts](charts.md) |
| `data-hf-tabs="groupId"` | container | defines a tab group | below |
| `data-hf-tab="key"` | button/link inside a `data-hf-tabs` group | a tab; the first is active by default | below |
| `data-hf-panel="key"` | element inside the group | the panel shown for `data-hf-tab="key"` | below |
| `data-hf-acc="id"` | button | an accordion header (toggles) | below |
| `data-hf-acc-panel="id"` | element | the accordion body for `data-hf-acc="id"` | below |
| `data-hf-object="content"` | any element | marks a region **sub-selectable** for on-object formatting in format mode (`data-hf-object-label="…"` sets its label) | [styling](styling.md) |
| `data-bs-toggle`, `data-bs-target`, `data-bs-dismiss`, `data-bs-ride`, `data-bs-parent`, `data-bs-placement`, `data-bs-content`, … | per Bootstrap docs | Bootstrap 5 component behaviour (collapse, tab, dropdown, tooltip, popover, carousel, toast, offcanvas, scrollspy) | [styling](styling.md) |

## Built-in tabs & accordion

These work with **Format pane → Components → Interactive components** on
(default), no Bootstrap needed. State is remembered across refresh / bookmarks
when **Remember component state** is on.

```handlebars
<div class="hf-tabs" data-hf-tabs="q">
  {{#each rows}}<button data-hf-tab="t{{@index}}">{{content}}</button>{{/each}}
  {{#each rows}}<div data-hf-panel="t{{@index}}">
    Actual {{number(Actual)}} / Target {{number(Target)}}
  </div>{{/each}}
</div>
```

```handlebars
<div class="hf-accordion">
  {{#each rows}}
  <button data-hf-acc="a{{@index}}">{{content}}</button>
  <div data-hf-acc-panel="a{{@index}}">{{{Detail}}}</div>
  {{/each}}
</div>
```

You can equally use Bootstrap's own `data-bs-toggle="collapse"` /
`data-bs-toggle="tab"` markup — see [interactivity.md](interactivity.md#interactive-components).
