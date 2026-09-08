# Contributing

Thanks for taking a look. This is a small project; issues and PRs are welcome.

## Setup

```bash
nvm use            # Node 22 (see .nvmrc)
npm install        # also generates src/framework/bootstrapCss.ts
npm start          # pbiviz dev server; add the visual to a report
```

First run of `pbiviz start` needs the dev cert once: `npx pbiviz --install-cert`.

## Before you open a PR

Keep all four green:

```bash
npm run lint
npm run typecheck
npm test
npm run package
```

- New pure logic (helpers, template engine, formatting, transforms) needs a
  unit test in `test/`. DOM-heavy code is exercised by the build plus a manual
  check in Power BI Desktop — say what you checked in the PR.
- Author HTML must only reach the DOM through DOMPurify (`RETURN_DOM_FRAGMENT`)
  or `DOMParser`; `eslint-plugin-powerbi-visuals` enforces this. No dynamic code
  generation.
- If you add a template helper, update `HELPER_NAMES` in
  `src/editor/templateLanguage.ts` — `test/helperNames.test.ts` fails otherwise.
- Match the surrounding style; `.editorconfig` covers indentation.

## Architecture

See [`docs/development.md`](docs/development.md) for the module map and the
design constraints (sandbox, two-tsconfig split, bundled-not-CDN).

## Releasing (maintainers)

1. Bump `version` in `pbiviz.json` (`x.y.z.0`) and `package.json` (`x.y.z`),
   add a `CHANGELOG.md` section.
2. `npm run package` — emits `dist/htmlStudio<guid>.x.y.z.0.pbiviz`, then the
   `postpackage` script copies it to `dist/html-studio-x.y.z.pbiviz`.
3. `git tag vX.Y.Z && git push --tags` (CI verifies the tag).
4. `gh release create vX.Y.Z dist/html-studio-X.Y.Z.pbiviz --notes "…"`.
