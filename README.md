
Robots.txt Checker / Parser Online
==================================

A fully static site: robots.txt rules are parsed and checked in the browser, so there's no server to run.

To run locally, serve the `public` directory with any static file server, e.g.:

```bash
python3 -m http.server -d public 3000
```

Then visit http://localhost:3000

Run the parser tests with `node --test` (Node 18+, no dependencies).

## Deploying to Cloudflare

It's deployed as a Cloudflare Worker serving the static files in `public`, connected to the GitHub repo in the dashboard (Workers & Pages → Create application → Continue with GitHub) with:

- Build command: *(leave empty)*
- Deploy command: `npx wrangler deploy`

Pushes to `master` go live, and PRs get preview URLs.

Visit it live @ [robots-txt-checker.wildfireinternet.co.uk](https://robots-txt-checker.wildfireinternet.co.uk/)
