
![RTC](./public/images/robots-txt-checker.png) Robots.txt Checker / Parser Online
================================

A fully static site: robots.txt rules are parsed and checked in the browser, so there's no server to run.

To run locally, serve the `public` directory with any static file server, e.g.:

```bash
python3 -m http.server -d public 3000
```

Then visit http://localhost:3000

## Deploying to Cloudflare Pages

Either connect the GitHub repo in the Cloudflare dashboard (Workers & Pages → Create → Pages → Connect to Git) with:

- Framework preset: None
- Build command: *(leave empty)*
- Build output directory: `public`

Or deploy from your machine with Wrangler (uses `wrangler.toml`):

```bash
npx wrangler pages deploy
```

Or visit this live @ [robots-txt-checker.wildfireinternet.co.uk](https://robots-txt-checker.wildfireinternet.co.uk/)
