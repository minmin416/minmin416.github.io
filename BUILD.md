# Optimized site build

The source remains ordinary GitHub Pages-compatible Jekyll. `Check and optimize site` builds Jekyll, bundles/minifies JavaScript and minifies CSS and HTML, tests the result, and produces an `optimized-site` artifact on every PR and main push. No source maps are generated; a map file/reference causes the build to fail. Layout, ARIA attributes, structured data, RSS and text remain readable by browsers and agents.

This is minification, not encryption or copy protection. Browsers must receive CSS/JavaScript to display the page, and this public repository intentionally exposes source and history.

## Local checks

- `npm ci`
- Build Jekyll to `_site` using GitHub Pages' Jekyll environment (or `jekyll build`).
- `npm run build` optimizes that disposable output.
- `npx playwright install chromium` then `npm test` tests public-post search and the optimizer. Set `CHROMIUM_PATH` to a system Chromium executable if needed.

Do not commit `_site`, test output, private material, credentials, or unapproved writing.

## Deployment handoff

This PR deliberately does **not** change the live Pages publisher or deploy an artifact. Search works with the existing branch-based Jekyll deployment when merged. To serve optimized output, the site owner must coordinate switching Pages to GitHub Actions and adding an approved Pages artifact/deploy job after these build/test steps. Until that switch, the automatic optimized artifact is verified but is not the served site. Keep inquiry/backend deployment changes separate.
