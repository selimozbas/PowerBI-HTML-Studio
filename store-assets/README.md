# AppSource / Partner Center listing assets

Not shipped in the visual. Used only for the marketplace submission.

| File | Partner Center field |
| --- | --- |
| `icon-300.png` | Offer listing **icon** (300×300) |
| `screenshot-1-dashboard.png` | Screenshot 1 — component library / KPI scorecard (1280×720) |
| `screenshot-2-editor.png` | Screenshot 2 — built-in template editor with live preview |
| `screenshot-3-conditional.png` | Screenshot 3 — table→cards, conditional formatting, HTML slicer |
| `sample/` | Ingredients + steps to build the required sample `.pbix` in Power BI Desktop |
| `icon-20.png` / `icon-40.png` | smaller renders, if a crisp in-visual `assets/icon.png` is wanted |

The `*.html` / `shot-frame.css` files are the sources the PNGs were rendered
from (headless Chrome at exact pixel sizes). The screenshots are faithful
renders of the visual's actual Bootstrap-based output; ideally recapture them
from Power BI Desktop once the sample report is built.

Privacy policy is served at
`https://selimozbas.github.io/PowerBI-HTML-Studio/privacy.html`
(source: `privacy.html` at the repo root, GitHub Pages).
