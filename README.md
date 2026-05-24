# Shoreline Auto Glass Website

Static lead-generation website for `www.shorelineglassco.com`.

## What is included

- `site/index.html` - the full public homepage.
- `site/cape-cod-windshield-replacement/index.html` - Cape Cod SEO landing page.
- `site/south-coast-auto-glass/index.html` - South Coast regional SEO landing page.
- `site/south-shore-auto-glass/index.html` - South Shore regional SEO landing page.
- `site/marthas-vineyard-auto-glass/index.html` - Martha's Vineyard regional SEO landing page.
- `site/nantucket-auto-glass/index.html` - Nantucket regional SEO landing page.
- `site/thank-you/index.html` - redirect target after GlassBiller quote submission.
- `site/assets/styles.css` - all site styling.
- `site/assets/main.js` - mobile menu and current year behavior.
- `site/assets/quote-form.js` - shared GlassBiller quote button embed.
- `site/assets/analytics.js` - Google Analytics tag setup and event tracking.
- `site/assets/logos/` - Shoreline brand assets, including the favicon and footer full-logo artwork.
- `netlify.toml` and `_redirects` - Netlify deploy configuration.
- `docs/` - manager and deployment handoff notes.
- `content/site-copy.md` - plain-English copy reference for maintainers.

## Deployment target

Recommended: Netlify static site.

The site does not require a build command. Netlify should publish the `site` folder, as configured in `netlify.toml`.

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

GlassBiller is installed through `site/assets/quote-form.js` with:

- `shop-id="2870"`
- fixed quote button
- bottom-left placement via `button-position="left"`
- redirect to the current site's `/thank-you/` page, so staging and production both work

Do not test-submit real customer data unless Shoreline approves that test.

Google Analytics 4 is installed with measurement ID `G-HD12WQSBNM`. Event tracking lives in `site/assets/analytics.js`.
