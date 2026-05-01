# Shoreline Auto Glass Website

Static lead-generation website for `www.shorelineglassco.com`.

## What is included

- `site/index.html` - the full public homepage.
- `site/thank-you/index.html` - redirect target after GlassBiller quote submission.
- `site/assets/styles.css` - all site styling.
- `site/assets/main.js` - mobile menu and current year behavior.
- `site/assets/logos/` - Shoreline brand assets copied from the provided files.
- `netlify.toml` and `_redirects` - Netlify deploy configuration.
- `docs/` - manager and deployment handoff notes.
- `content/site-copy.md` - plain-English copy reference for maintainers.

## Deployment target

Recommended: Netlify static site.

The site does not require a build command. Netlify should publish the repository root.

For a mock/staging URL, deploy the same folder to Netlify first and use the free Netlify subdomain, for example:

`https://shoreline-auto-glass.netlify.app`

After everyone approves the mock, connect `www.shorelineglassco.com` by changing DNS records.

## Local preview

From this folder, run:

```bash
python3 -m http.server 4173
```

Then open:

`http://127.0.0.1:4173/`

## Critical integrations

GlassBiller is installed in `site/index.html` near the bottom of the file with:

- `shop-id="2870"`
- fixed quote button
- bottom-left placement via `button-position="left"`
- redirect to the current site's `/thank-you/` page, so staging and production both work

Do not test-submit real customer data unless Shoreline approves that test.
