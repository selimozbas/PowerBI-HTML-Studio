# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for a security problem. Email
**selimozbas@gmail.com** with:

- a description of the issue and its impact,
- the minimal template / settings / data needed to reproduce it,
- the visual version (`pbiviz.json` → `version`) and host (Power BI Desktop
  build or Service).

You'll get an acknowledgement within a few days. Once a fix is ready it ships in
the next tagged release and the advisory is credited unless you ask otherwise.

## Scope

HTML Studio renders report-author-supplied HTML/SVG inside the Power BI custom
visual sandbox (`<iframe sandbox="allow-scripts">`, no `allow-same-origin`).
Relevant classes of issue:

- **Sanitiser bypass** — author markup escaping DOMPurify under the *Standard*
  or *Strict* policy in a way that runs script or makes an unexpected network
  request. (*Trusted* / *Custom with sanitising off* are opt-in "render as-is"
  modes and are out of scope by design — see `docs/security-and-limitations.md`.)
- **Injection through data** — a field value (not the template) causing markup
  or attribute injection that the template author did not intend.
- **Filter / persistence abuse** — `data-hf-filter` or `data-hf-state` writing
  somewhere it shouldn't.

Out of scope: the Power BI platform itself, the bundled third-party libraries'
own advisories (report those upstream), and anything requiring the report
author to deliberately choose a non-sanitising policy.
