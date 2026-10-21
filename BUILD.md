# Optimized site build and publishing

Ordinary Jekyll source remains editable and public. The workflow builds Jekyll, bundles/minifies JavaScript, minifies CSS/HTML, and runs browser checks before publishing `_site`. Source maps and source-map references fail the build. Semantic HTML, ARIA, structured data, writing search and RSS remain readable.

Minification is not encryption or copy protection. Browsers receive the CSS/JavaScript, and this repository exposes authoring source and history.

## Local checks

Run `npm ci`, build Jekyll into disposable `_site`, then run `npm run build` and `npm test`. Set `CHROMIUM_PATH` to an installed Chromium executable when needed. Browser tests cover public-only writing/search, safe no-JavaScript rendering, optimized output, XP/Vista/no-scroll layout, separate inquiry acknowledgements, durable-response gating and failure preservation. They use synthetic intercepted submissions.

Do not commit `_site`, test output, private material, credentials or unapproved articles.

## Production

Pages source is GitHub Actions. Pull requests build/test and retain a generic `optimized-site` artifact, but never deploy. A successful main push or main workflow dispatch uploads a `github-pages` artifact. A separate dependent job publishes that artifact to the existing `github-pages` environment, using only `pages:write` and `id-token:write`; the build has `contents:read`. No long-lived token is created. Deployments are serialized without cancelling an in-progress deployment.

The inquiry API is an isolated Cloudflare Worker/D1 deployment. Its credentials and private administration tools are not in this public repository. Site publishing does not deploy the API, access the inbox, or change DNS/mail. A failed API request preserves form input and never claims success.
