# Sample report — build the `.pbix`

Partner Center asks for **one `.pbix` file** that uses the visual. A `.pbix` can
only be produced by Power BI Desktop, so assemble it once from the pieces here
(~10 minutes). Save the result as **`HTML Studio - Sample.pbix`** and attach that
to the offer.

Files in this folder:

| File | Use |
| --- | --- |
| `regions.csv` | the sample dataset (8 rows: region × segment revenue vs. target) |
| `template.txt` | the HTML Studio template to paste |

## Steps

1. **Power BI Desktop → Get data → Text/CSV → `regions.csv` → Load.**
2. On the report page, **Visualizations → … (three dots) → Import a visual from a
   file** → pick `dist/html-studio-0.1.1.pbiviz`. The HTML Studio icon appears in
   the visualizations pane.
3. Add the HTML Studio visual to the canvas and drag these fields in:
   - **Content** ← `Region`
   - **Data (named fields)** ← `Segment`, `Actual`, `Target`, `Prev`, `Owner`,
     `Status`, `LastClose`, `Note`
4. In the format pane: **Content → Content source → Template**. Then click the
   **✎ Template** button on the visual (top-right, edit mode only) to open the
   editor.
5. Paste the contents of `template.txt`, click **Apply template**. You should see
   a card per region with a KPI bar, a delta badge, and a "Below plan" callout on
   the two rows that are under 80 % of target.
6. *(optional, for a richer screenshot)* add a second page: a **Clustered bar
   chart** of `Actual` by `Region`, a **Card** of `Actual`, and a slicer on
   `Segment`, so the report reads like a real dashboard.
7. **File → Save as → `HTML Studio - Sample.pbix`.**

## Notes for reviewers / users

- The visual bundles everything (Bootstrap, DOMPurify, Monaco, uPlot); no CDN
  calls. The only optional outbound request is Google Fonts, and only if you type
  a font name in *Appearance → Google font* — this sample leaves it blank.
- Author HTML is sanitised with DOMPurify by default (Standard policy).
