# Netlify Deployment And Squarespace DNS

## Recommended Deployment

Deploy this folder as a Netlify static site.

Settings:

- Build command: leave blank
- Publish directory: `.`
- Production domain: `www.shorelineglassco.com`

## Fastest Netlify Setup

1. Create or log in to a Netlify account.
2. For the first mock, drag this folder or `dist/shoreline-auto-glass-netlify.zip` into Netlify Drop.
3. Rename the Netlify site to something clear, such as `shoreline-auto-glass`, if available.
4. Share the Netlify preview URL, for example `https://shoreline-auto-glass.netlify.app`.
5. After approval, add `www.shorelineglassco.com` as the custom domain.
6. Add `shorelineglassco.com` as a domain alias if Netlify prompts for it.
7. Wait for Netlify to show the DNS values it wants.

## Long-Term Maintenance Option

After the mock is approved, connect Netlify to a Git repository instead of using drag-and-drop deploys. This gives Shoreline a clean change history and makes it easier for a Fiverr manager to update content safely.

## Squarespace DNS Change

The domain is currently using Squarespace records:

- Apex A records point to Squarespace IPs.
- `www` CNAME points to `ext-sq.squarespace.com`.
- Email MX points to Google and should stay untouched.

To point the website to Netlify:

1. In Squarespace Domains, open DNS settings for `shorelineglassco.com`.
2. Keep existing MX records for Google email.
3. Replace the `www` CNAME with the Netlify target, usually something like `your-site-name.netlify.app`.
4. For the apex/root domain, follow Netlify's instruction. Usually this means Netlify DNS nameservers or Netlify load balancer A records.
5. Confirm both:
   - `https://www.shorelineglassco.com`
   - `https://shorelineglassco.com`

Do not delete Google Workspace/MX records while changing website DNS.

## After DNS Connects

- Enable HTTPS in Netlify.
- Confirm apex redirects to `www`.
- Submit `https://www.shorelineglassco.com/sitemap.xml` in Google Search Console.
- Add the website URL to Google Business Profile.
- Replace the review CTA once the Google review URL exists.
