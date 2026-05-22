# Shoreline Auto Glass Manager Guide

This site is intentionally simple: static files, clear sections, and no build system.

## Common Updates

### Update phone or email

Edit:

- `site/index.html`
- `site/cape-cod-windshield-replacement/index.html`
- `site/thank-you/index.html`
- `content/site-copy.md`

Search for `(774) 560-8440`, `+17745608440`, and `info@shorelineglassco.com`.

The privacy/SMS terms page also includes contact details at `site/privacy/index.html`.

### Update service area

Edit the `Service Area` section in `site/index.html`, the Cape Cod landing page at `site/cape-cod-windshield-replacement/index.html`, and the notes in `content/site-copy.md`.

Keep the wording service-area based unless Shoreline decides to publish a walk-in address.

### Update Cape Cod SEO page

The Cape Cod landing page lives at `site/cape-cod-windshield-replacement/index.html`.

Keep the page focused on real customer needs: mobile windshield replacement, Cape Cod auto glass, chip repair, door glass, rear glass, ADAS calibration, service towns, and quote scheduling. Do not repeat the same phrase unnaturally; write for customers first.

If the page URL changes, update:

- `site/sitemap.xml`
- `site/_redirects`
- Footer links in `site/index.html` and the Cape Cod page

### Update Google review link

The reviews section is live and includes two Google links:

- `Leave a Google review` opens the direct review form.
- `Read Google reviews` opens the public Google listing.

If Google ever changes the review URL:

1. Get the latest direct review URL from Google Business Profile.
2. In `site/index.html`, find the `reviews-section`.
3. Replace `https://g.page/r/CUki0l1Gt5-FEBI/review` on the `Leave a Google review` button with the new direct Google review URL.
4. If the Google listing link changes, update the `Read Google reviews` URL too.
5. Keep `target="_blank"` and `rel="noopener"` on both links.

### Replace logos

Put replacement images in `site/assets/logos/`.

The main files used by the site are:

- `shoreline-logo-horizontal.png`
- `shoreline-logo-hero.png`
- `shoreline-logo-wordmark.png`

Use the same file names when swapping assets so the HTML does not need to change.

### Edit colors and style

Colors are defined at the top of `site/assets/styles.css` in the `:root` block.

Keep button colors high contrast, especially the GlassBiller light-blue quote button.

When changing `site/assets/styles.css`, `site/assets/main.js`, or `site/assets/quote-form.js`, also bump the `?v=YYYYMMDD` version in the HTML files that load that asset. This makes browsers fetch the fresh file after Netlify deploys.

### Update Privacy Policy or SMS terms

Edit `site/privacy/index.html`.

Keep the SMS section visible and public at `/privacy/`. If Shoreline changes texting providers or use cases, update the message types, opt-out instructions, and support contact details before submitting A2P/texting paperwork.

## Lead Flow

The floating quote button is loaded from GlassBiller through `site/assets/quote-form.js`. Leads should appear in the GlassBiller leads dashboard for shop ID `2870`.

Before changing the GlassBiller code, confirm:

- Shop ID
- Required fields
- Button placement
- Redirect URL
- SMS opt-in checkbox language and whether consent is stored with each lead

The site currently asks for SMS opt-in after quote submission on `site/thank-you/index.html`. The opt-in is a Netlify form named `sms-opt-in`; check Netlify Forms for submissions before sending SMS messages. A true checkbox inside the GlassBiller-hosted iframe must be added by GlassBiller if Shoreline wants consent stored natively with the GlassBiller lead.

## What Not To Change Casually

- Do not remove `thank-you/index.html`; GlassBiller redirects there after submission.
- Do not replace the GlassBiller shop ID unless Shoreline moves accounts.
- Do not publish a physical address unless Shoreline approves it.
- Do not add unconfirmed claims like same-day service, direct insurance billing, warranties, or public rankings.
- ADAS support is approved, but avoid unverifiable wording like "best in the region" unless Shoreline has proof to cite.
