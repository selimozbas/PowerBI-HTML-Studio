# Privacy policy

**HTML Studio** is a Power BI custom visual. It renders the data you place in
its field wells as HTML/SVG on the report canvas. It has no backend and collects
no analytics or telemetry.

## What data the visual sees

- The rows bound to the **Content**, **Data**, **Sort by** and **Tooltips**
  field wells, plus the format strings Power BI provides for them. This data is
  processed **only inside the visual's sandboxed iframe**, in the viewer's
  browser or Power BI Desktop, to produce the rendered output. It is never sent
  off the client by the visual.
- Template text, CSS, conditional-formatting rules and other options you type
  into the format pane.

## Data the visual stores

- **Remember form input** (write-back), when you enable it, saves the values a
  viewer types into `data-hf-field` inputs back into the report definition via
  Power BI's `persistProperties` API. That state lives in the `.pbix` / dataset
  like any other visual property. It is written only if the viewer has edit
  rights; a read-only Service viewer's input is not persisted. Nothing is sent
  to any third party.

## Network requests

- The visual bundles all of its code and libraries (Monaco editor, DOMPurify,
  uPlot, Bootstrap, marked, QR generator). Nothing is loaded from a CDN.
- The **only** outbound request the visual can make is to
  `https://fonts.googleapis.com` and `https://fonts.gstatic.com`, and only when
  you enter a Google Fonts family name in **Appearance → Google font**. This
  uses the declared, non-essential `WebAccess` privilege. Leave that field blank
  and the visual makes no network requests at all. Google's handling of those
  font requests is covered by the [Google Privacy Policy](https://policies.google.com/privacy).

## Contact

Questions or concerns: open an issue at
<https://github.com/selimozbas/PowerBI-HTML-Studio/issues>.
