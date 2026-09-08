# Styling

## Wrapper styles

**Format pane → Styling** sets properties on the content container:

| Option | Effect |
| --- | --- |
| Font (family / size / bold / italic / underline) | base typography |
| Font color / Background | base colours |
| Alignment | `text-align` |
| Padding (px) | inner padding |
| Overflow | `Scroll` / `Clip` / `Visible` |
| Text direction | `Auto (from locale)` / LTR / RTL — sets `dir` on the content |

## Report theme variables

With **Appearance → Expose report theme as CSS variables** on (default), these
custom properties are available to your HTML and to the SVG helpers/components:

| Variable | From |
| --- | --- |
| `--hf-foreground` / `--hf-background` | theme text / background |
| `--hf-accent` / `--hf-accent-2` / `--hf-accent-3` | theme data colours 1–3 |
| `--hf-muted` | secondary text |
| `--hf-track` | neutral background (progress tracks, borders) |
| `--hf-font` | theme font stack |

```html
<div style="color:var(--hf-foreground);border-left:3px solid var(--hf-accent)">…</div>
```

High-contrast mode is honoured (`--hf-foreground` → `CanvasText`, `--hf-accent`
→ `Highlight`, …).

## Style presets

**Appearance → Style preset** injects a ready-made, `.hf-content`-scoped
stylesheet ahead of your Custom CSS:

| Preset | Look |
| --- | --- |
| Cards | rows become bordered, rounded, shadowed cards |
| Minimal | tight type scale, hairline row dividers |
| Dark | dark surface + cards + adjusted link/secondary colours |
| Newspaper | serif type, justified text, rule dividers |
| Accent tiles | rows become gradient accent tiles with white text |

## Custom CSS

**Stylesheet → Custom CSS** is injected into the visual (after the preset,
before nothing — your rules win). Scope selectors under `.hf-content` (or your
own wrapper class) to avoid touching the diagnostics panel / edit button.

```css
.hf-content .hf-row { border-radius: 10px; transition: background .15s; }
.hf-content .hf-row:hover { background: var(--hf-track); }
.hf-content [data-hf-select].hf-selected { outline: 2px solid var(--hf-accent); }
```

`<style>` blocks inside your template also work when *Security → Allow `<style>`
blocks* is on (it is under Standard / Trusted policies).

## Fonts

**Format pane → Fonts**:

- **Google Fonts families** — comma list, optional weights:
  `Roboto, Open Sans:400;700, Cairo`. Emitted as one
  `@import url('https://fonts.googleapis.com/css2?…')`. The visual declares
  `fonts.googleapis.com` / `fonts.gstatic.com` as allowed hosts; the report
  consumer may still see a one-time permission prompt.
- **@font-face CSS** — pasted verbatim. Use it for self-hosted fonts embedded
  as data URIs, which always work (offline, export):

  ```css
  @font-face { font-family:'Inter'; src:url(data:font/woff2;base64,…) format('woff2'); }
  ```

Then set the family in *Styling → Font*, or in Custom CSS.

## Bootstrap 5

Bootstrap 5 CSS **and** Bootstrap Icons (webfont inlined) are always bundled —
use `container`, `row`/`col-*`, `card`, `badge`, `btn`, `alert`, `table`,
`text-bg-*`, spacing/flex utilities, and `<i class="bi bi-check-circle"></i>`
freely. No CDN, works in export.

Bootstrap's Reboot styles the document `<body>`; HTML Studio forces the host
`<body>` transparent so the report background and theme still show through, and
`.hf-content` keeps its own theme colours.

Bootstrap **JavaScript** components are covered in
[interactivity.md](interactivity.md#interactive-components).

## On-object formatting

In **format mode** the content region is a sub-selectable object: click it and
the mini-toolbar edits font / bold / italic / underline / colour / background
(the *Styling* card). Tag extra regions with `data-hf-object="content"` (and an
optional `data-hf-object-label="…"`).
