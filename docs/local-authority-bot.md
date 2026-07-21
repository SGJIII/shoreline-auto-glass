# Shoreline Local Authority Bot

## Purpose

The bot turns local SEO authority work into a repeatable monthly operating process. It finds relevant organizations, checks known citation and backlink URLs, scores opportunities, and creates a GitHub issue for human approval.

It does not send emails, submit directory forms, manufacture reviews, buy links, or publish content on third-party websites.

## Monthly outputs

Each run creates:

- `reports/seo-authority/monthly-report.md` with the approval queue and audit results.
- `reports/seo-authority/monthly-report.json` with structured results.
- `reports/seo-authority/prospects.csv` for sorting and outreach operations.
- A GitHub Actions artifact containing all three files.
- A GitHub issue named `SEO authority report - YYYY-MM`.

The `reports/` directory is intentionally ignored by Git. Reports are operational artifacts, while configuration and outreach history remain version controlled.

## Free data and tools

- OpenStreetMap Overpass API discovers public body shops, dealerships, vehicle service businesses, rental/fleet operators, and business associations near Shoreline's service hubs.
- Native Node.js checks configured public citation and backlink pages.
- GitHub Actions runs the workflow monthly at no application hosting cost.
- GitHub Issues provides the approval queue and audit trail.

OpenStreetMap data is discovery evidence, not an endorsement. A person must verify the organization before contact.

## Schedule

`.github/workflows/monthly-local-authority.yml` runs at 14:17 UTC on the first day of every month. It can also be started manually from GitHub under Actions, then Monthly local authority report, then Run workflow.

The workflow also runs when its bot code, workflow definition, or configuration changes on `main`. This validates changes immediately and refreshes the current month's issue without waiting for the next scheduled run.

## Run locally

```bash
npm run seo:authority
```

Run without public network calls:

```bash
npm run seo:authority:offline
```

No paid API key is required for the standard run.

## Configuration

Edit `config/seo-authority.json` to maintain:

- Shoreline's canonical name, phone, email, website, and review link.
- Service hubs and discovery coverage.
- Curated high-value prospects such as regional chambers.
- Public citation profile URLs.
- Exact source pages for known backlinks.

When Apple Business Connect, Bing Places, Yelp, Facebook, or the AGSC directory profile becomes public, paste its exact public URL into the matching `profileUrl`. The next run will begin checking it.

When a partner publishes a link, add an entry to `knownBacklinks`:

```json
{
  "name": "Example Collision partner page",
  "sourceUrl": "https://example.com/partners/shoreline-auto-glass"
}
```

## Outreach history

Before contacting an approved prospect, add or update its row in `data/seo/outreach-log.csv`.

Available status examples:

- `research`
- `approved`
- `contacted`
- `follow-up`
- `partner`
- `declined`
- `do-not-contact`

The bot deprioritizes previously contacted organizations. Record dates, next actions, and results so future reports do not generate repeated outreach.

## Good link opportunities

Only pursue a link when it reflects something real and useful:

- A body shop or dealership lists Shoreline as its glass and calibration partner.
- A chamber includes Shoreline in a paid or verified member directory.
- A fleet or service partner publishes an accurate vendor or customer-resource page.
- A community sponsorship page recognizes Shoreline's actual participation.
- An industry organization maintains an accurate certified-member listing.

Do not request keyword-stuffed anchors. The preferred link text is `Shoreline Auto Glass` or a natural description of the actual relationship.

## Reviews

The report includes Shoreline's direct Google review link for normal post-service follow-up. Ask every eligible customer for an honest review without incentives, scripts that require a positive rating, or review gating.

The Google Business Profile Reviews API can retrieve and respond to reviews, but it requires OAuth credentials and approval for Business Profile API access. It is intentionally not required by this first version.

## Search Console

Google's Search Console API can supply monthly query and page performance after OAuth is configured. The current authority bot does not require that access. Search Console exports can continue to be reviewed independently until Shoreline chooses to store Google OAuth credentials in GitHub Secrets.

## Required human review

For each monthly approval issue:

1. Confirm the prospect is local, active, and relevant.
2. Check the prospect's website and existing vendor relationships.
3. Approve a tailored message or mark the prospect declined.
4. Record the decision in the outreach log.
5. Send outreach manually from a Shoreline-owned business account.
6. Add published link pages to `knownBacklinks` for continuing verification.
