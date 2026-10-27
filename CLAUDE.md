# Robots.txt Checker

Static site (no build step) at `public/`, live at robots-txt-checker.wildfireinternet.co.uk with real users. See README for local serving and Cloudflare deploys.

- `public/js/robots.js`: vendored robots-txt-parse/guard, extended with line numbers, a default user-agent group and `explain()`. Keep `isAllowed` semantics unchanged.
- `public/js/app.js`: jQuery UI, re-checks live on every input. The rules editor is a transparent textarea over a highlighted `<pre>`, so both must keep identical font metrics and padding.
- Tests: `node --test` (covers `robots.js`).

## Browser testing

Use `playwright-cli` (on PATH) against a local server (`python3 -m http.server -d public 3000`):

- Always pass a named session, e.g. `playwright-cli -s=rtc open http://localhost:3000/`; the default session may belong to another project.
- `screenshot --filename=...` only writes inside the directory the session was opened from, so run it from the directory where you want the files.
- `eval "() => ..."` is handy for setting inputs (set `.value` and dispatch an `input` event) and reading results.
