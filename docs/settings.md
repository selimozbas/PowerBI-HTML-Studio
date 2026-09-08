# Settings reference

Every card in the **Format** pane and its options. Defaults in **bold**.

## Content

| Option | Values | Notes |
| --- | --- | --- |
| Content source | **Field value** / Template | render the field as-is, or run a template |
| Render | **Single block** / Per row | one render, or one per row (wrapped in `data-hf-row`) |
| Treat content as Markdown | on / **off** | GFM → HTML before sanitising |
| Row separator | text | between values in *Field value* + *Single block*; supports `\n`, `newline` |
| Body template | text | template for *Single block* mode |
| Row template | text | template for *Per row* mode |
| Partials | text | `@partial name` blocks — see [components](components.md) |
| No-data message | text | shown when no rows are bound |
| Allow inline `<script>` (unsafe) | on / **off** | keep `<script>` in output (the sandbox still blocks external scripts) |

## Styling

Font (family / size / **bold off** / **italic off** / **underline off**),
Font color **#252423**, Background **(none)**, Alignment **Left**,
Padding **8 px**, Overflow **Scroll**, Text direction **Auto (from locale)**.

## Fonts

Google Fonts families (text), @font-face CSS (text). See
[styling.md](styling.md#fonts).

## Stylesheet

Custom CSS (text) — injected into the visual.

## Conditional formatting

| Option | Values |
| --- | --- |
| Enabled | on / **off** |
| Rules (JSON) | array — see [conditional-formatting.md](conditional-formatting.md) |

## Components

| Option | Values |
| --- | --- |
| Interactive components | **on** / off — built-in tabs / accordion |
| Remember component state | **on** / off — persist active tab etc. |

## Interactivity

| Option | Values |
| --- | --- |
| Cross-filter on click | **on** / off |
| Dim unselected (%) | 0–100, default **50** |
| Right-click context menu | **on** / off |

## HTML slicer

| Option | Values |
| --- | --- |
| Filter the report from data-hf-filter elements | on / **off** |

## Viewer write-back

| Option | Values |
| --- | --- |
| Remember form input (data-hf-state) | on / **off** |

## Hyperlinks

| Option | Values |
| --- | --- |
| Open http/https links | **on** / off — via `launchUrl` |

## Security

| Option | Values |
| --- | --- |
| Policy | **Standard** / Strict (no inline styles) / Trusted (no sanitising) / Custom |
| Sanitize HTML | **on** / off *(Custom policy only)* |
| Allow inline SVG | **on** / off *(Custom)* |
| Allow `<style>` blocks | **on** / off *(Custom)* |
| Extra allowed tags / attributes | comma lists |

A non-Custom policy overrides the three toggles:
Standard = sanitise + SVG + `<style>`; Strict = sanitise + SVG, no `<style>`;
Trusted = **no sanitising** (author HTML renders as-is — parser-inserted
`<script>` still can't run, but inline `onerror` / `onload` handlers do).
A middle "off" is also reachable via **Custom**.

## Appearance

| Option | Values |
| --- | --- |
| Style preset | **None** / Cards / Minimal / Dark / Newspaper / Accent tiles |
| Expose report theme as CSS variables | **on** / off |

## Accessibility

| Option | Values |
| --- | --- |
| ARIA label | text — describes the visual for screen readers |

## Performance

| Option | Values |
| --- | --- |
| Max rows rendered | 0–30000, **0 = all** |
| Optimize for export / print | on / **off** — render all rows, `overflow: visible`, hide chrome |

## Bootstrap 5

| Option | Values |
| --- | --- |
| Interactive components (collapse, tabs, …) | **on** / off — Bootstrap's `data-bs-*` JS |

## Diagnostics

| Option | Values |
| --- | --- |
| Show diagnostics panel | on / **off** — template errors, sanitiser removals, field names |
