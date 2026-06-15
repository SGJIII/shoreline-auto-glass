# Shoreline Auto Glass Website

Static lead-generation website for `www.shorelineglassco.com`.

## What is included

- `site/index.html` - the full public homepage.
- `site/cape-cod-windshield-repair/index.html` - Cape Cod SEO landing page.
- `site/south-coast-windshield-repair/index.html` - South Coast regional SEO landing page.
- `site/south-shore-windshield-repair/index.html` - South Shore regional SEO landing page.
- `site/marthas-vineyard-windshield-repair/index.html` - Martha's Vineyard regional SEO landing page.
- `site/nantucket-windshield-repair/index.html` - Nantucket regional SEO landing page.
- `site/adas-calibration/index.html` - ADAS calibration SEO landing page.
- `site/fleet-adas-calibration/index.html` - fleet, dealership, and account calibration lead page.
- `site/insurance/index.html` - insurance claim help page for customers who want Shoreline by name.
- `site/fleet-request-received/index.html` - redirect target after fleet form submission.
- `site/thank-you/index.html` - redirect target after GlassBiller quote submission.
- `site/assets/styles.css` - all site styling.
- `site/assets/main.js` - mobile menu and current year behavior.
- `site/assets/reviews.js` - live Google reviews renderer with static fallback.
- `site/assets/quote-form.js` - shared GlassBiller quote button embed.
- `site/assets/analytics.js` - Google Analytics tag setup and event tracking.
- `site/assets/logos/` - Shoreline brand assets, including the favicon and footer full-logo artwork.
- `netlify/functions/google-reviews.mjs` - serverless Google Places reviews endpoint.
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

## Tests

Run the no-browser local test suite:

```bash
npm test
```

If `npm` is not installed, run the same test suite directly:

```bash
node --test tests/site.test.mjs
```

This checks internal links, local assets, form actions, redirect targets, sitemap URLs, JSON-LD, JavaScript syntax, key analytics events, review copy, certification copy, and known bad text. It intentionally does not submit the GlassBiller form.

Run a production smoke test without a browser:

```bash
npm run test:live
```

If `npm` is not installed:

```bash
node tests/live-smoke.mjs
```

Set `SITE_URL` to test another deployed URL:

```bash
SITE_URL=https://shoreline-autoglass.netlify.app npm run test:live
```

Or:

```bash
SITE_URL=https://shoreline-autoglass.netlify.app node tests/live-smoke.mjs
```

## Critical integrations

GlassBiller is installed through `site/assets/quote-form.js` with:

- `shop-id="2870"`
- fixed quote button
- bottom-left placement via `button-position="left"`
- redirect to the current site's `/thank-you/` page, so staging and production both work

Do not test-submit real customer data unless Shoreline approves that test.

Google Analytics 4 is installed with measurement ID `G-HD12WQSBNM`. Event tracking lives in `site/assets/analytics.js`.

The homepage reviews section displays a Common Ninja review widget first, using component ID `992c7252-797d-48aa-a2b2-3b868ca1c341`. Keep the widget configured to show stars and review text without reviewer photos.

First-party Google reviews remain available as a fallback through `/api/google-reviews`, which maps to `netlify/functions/google-reviews.mjs`. To enable the fallback in production, add `GOOGLE_PLACES_API_KEY` in Netlify environment variables and redeploy. The function defaults to Shoreline's Google place ID, `ChIJuVwlzHVX4E4RSSLSXUa3n4U`; only set `GOOGLE_PLACE_ID` if that changes.
