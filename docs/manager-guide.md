# Shoreline Auto Glass Manager Guide

This site is intentionally simple: static files, clear sections, and no build system.

## Common Updates

### Update phone or email

Edit:

- `site/index.html`
- `site/thank-you/index.html`
- `content/site-copy.md`

Search for `(774) 560-8440`, `+17745608440`, and `info@shorelineglassco.com`.

### Update service area

Edit the `Service Area` section in `site/index.html` and the notes in `content/site-copy.md`.

Keep the wording service-area based unless Shoreline decides to publish a walk-in address.

### Add Google review link

After Google Business Profile verification:

1. Get the direct review URL from Google Business Profile.
2. In `site/index.html`, find the `reviews-section`.
3. Replace the `href="#contact"` on the review button with the Google review URL.
4. Change the button text to `Leave a Google review`.
5. Remove the manager note below the button.

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

## Lead Flow

The floating quote button is loaded from GlassBiller. Leads should appear in the GlassBiller leads dashboard for shop ID `2870`.

Before changing the GlassBiller code, confirm:

- Shop ID
- Required fields
- Button placement
- Redirect URL

## What Not To Change Casually

- Do not remove `thank-you/index.html`; GlassBiller redirects there after submission.
- Do not replace the GlassBiller shop ID unless Shoreline moves accounts.
- Do not publish a physical address unless Shoreline approves it.
- Do not add unconfirmed claims like same-day service, direct insurance billing, warranties, or public rankings.
- ADAS support is approved, but avoid unverifiable wording like "best in the region" unless Shoreline has proof to cite.
