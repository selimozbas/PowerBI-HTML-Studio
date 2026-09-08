# Security & limitations

## Sanitisation

Author HTML is passed through [DOMPurify](https://github.com/cure53/DOMPurify)
and turned into a DOM fragment before it is inserted — the visual never assigns
a markup string to the DOM. What is kept is controlled by the **Security**
policy:

| Policy | Sanitise | Inline SVG | `<style>` blocks |
| --- | --- | --- | --- |
| **Standard** (default) | yes | yes | yes |
| Strict (certified-safe) | yes | yes | no |
| Trusted | yes | yes | yes |
| Custom | your toggles | your toggles | your toggles |

- `data-hf-*` and `data-bs-*` attributes are always allowed. Add more under
  **Extra allowed tags / attributes**.
- **Inline `<script>`** is removed unless *Content → Allow inline `<script>`
  (unsafe)* is on — and even then the Power BI sandbox blocks any externally
  hosted script, and scripts inserted via markup do not execute per the HTML
  spec. There is no way to run arbitrary author JavaScript; use the `data-hf-*`
  / `data-bs-*` contracts instead.
- Inline event handlers (`onclick="…"`) are stripped.
- When *Show diagnostics panel* is on, removed tags are listed.

## What the Power BI sandbox blocks

The visual runs in `<iframe sandbox="allow-scripts">` (no `allow-same-origin`).
Consequences you can't work around:

| Blocked | Notes |
| --- | --- |
| External `<script src>` | no JS libraries from a CDN — that's why Bootstrap / uPlot / Monaco are bundled |
| Author `<script>` execution | markup-inserted scripts never run |
| `<object>`, `window.open`, `target="_blank"` | popups are disabled; use `http(s)` links (routed via `launchUrl`) |
| `alert` / `confirm` / `prompt` | no modal JS dialogs |
| Cookies, `localStorage` | not accessible |
| Stylesheets / fonts / images / `fetch` from arbitrary hosts | only the declared hosts (`fonts.googleapis.com`, `fonts.gstatic.com`) are allowed; embed everything else as `data:` URIs |
| `<iframe>` embedding | not rendered in Desktop; CORS-gated in the Service |

## What a table-mapped custom visual can't do

HTML Studio uses a **table** data mapping (needed for the "arbitrary many named
fields" model). Power BI does not offer these for table/matrix visuals:

- **Native fx conditional formatting** — use rule JSON or a DAX colour measure
  ([conditional-formatting.md](conditional-formatting.md)).
- **Highlight** (partial cross-highlight bars) — clicking cross-*selects*
  instead.

Also not implemented (no public visual API): programmatic drill-through and
bookmark triggers.

## Export to PDF / PowerPoint

Everything is bundled and charts are canvas/SVG, so exports are faithful. Turn on
**Performance → Optimize for export / print** before exporting a long list: it
renders every row (no windowing), sets `overflow: visible`, and hides the edit
button / diagnostics panel.

## Privacy of write-back state

`data-hf-state` values are stored with the report via `persistProperties`. They
are visible to everyone who can open the report and are not encrypted. Use them
for checklists / sign-offs, not for sensitive data.
