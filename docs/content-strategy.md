# CreditMate AI content and SEO strategy

Status: working draft for task 10.4. Keyword clusters are based on the pages and
data this app already has. Search volumes have **not** been measured. Check every
cluster in a keyword tool or Search Console before spending effort on it.

## 1. Goals

1. Rank for comparison queries that match what the home page and category pages
   actually do: filtering and comparing Bangladeshi credit cards.
2. Answer the fee, interest and eligibility questions people ask before they
   apply, using guides that cite Bangladesh Bank rules.
3. Keep every factual claim traceable to a source. This follows the editorial
   rules in `src/content/guides.ts`.

## 2. Current state (what is already built)

| Area          | Page or asset                                | Search role                                                                                                                                   |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Home          | `/`                                          | Main comparison tool. Title, description, Organization and WebSite SearchAction JSON-LD. Reads `?search=`.                                    |
| Category hubs | `/category/:slug` (6 categories)             | Intent pages: travel, cashback, premium, student, business, no annual fee. Breadcrumb JSON-LD, related guides.                                |
| Card pages    | `/card/:bankSlug/:cardSlug`                  | One page per card. Title, canonical, breadcrumb JSON-LD, FinancialProduct JSON-LD. Listed in the sitemap when `SITEMAP_CARDS_API_URL` is set. |
| Guides        | `/guides`, `/guides/:slug` (4 guides)        | Educational content. Article, BreadcrumbList and FAQPage JSON-LD. Visible FAQ section.                                                        |
| Tools         | `/perfect-card-finder`, `/reward-calculator` | Quiz and net-value calculator.                                                                                                                |
| Glossary      | `/glossary`                                  | Term definitions.                                                                                                                             |
| About         | `/about`                                     | Trust and mission page.                                                                                                                       |
| Comparison    | `/compare`                                   | Side-by-side view of cards chosen on the home page.                                                                                           |

Technical SEO in place:

- `public/robots.txt` and `public/sitemap.xml` are written by
  `scripts/generate-sitemap.mjs`. The script runs before every `npm run build`.
- Canonical URLs are set on each page using `window.location.origin`.
- Open Graph and Twitter summary tags are set on each page.

**Known limit.** This is a client-rendered SPA with no prerender step. Crawlers
that do not run JavaScript will see only the HTML shell from `public/index.html`.
Page-specific titles and JSON-LD appear only after the app runs. Before investing
in long-tail content, decide whether to add prerendering or SSR. Without it, the
guides and category pages are less visible than their copy deserves.

## 3. Keyword clusters

Each cluster has a primary intent, a target page, and example queries. Queries
are examples to test, not confirmed demand.

### Cluster A: Credit card comparison (commercial, high intent)

- Target: `/` and `/compare`
- Example queries: "compare credit cards Bangladesh", "best credit card in
  Bangladesh", "credit card comparison BD"
- Angle: filter by fee, interest and lounge access, then compare up to four
  cards side by side.

### Cluster B: Category intent

- Target: `/category/<slug>`, one page per category
- Travel: "travel credit card Bangladesh", "airport lounge credit card
  Bangladesh"
- Cashback: "cashback credit card Bangladesh"
- Premium: "premium credit card Bangladesh", "high annual fee credit card"
- Student: "student credit card Bangladesh"
- Business: "business credit card Bangladesh", "corporate credit card"
- No annual fee: "no annual fee credit card Bangladesh"

Note: the cashback, student and business categories are keyword matches on
card names and terms (see `src/config/categories.ts`). Their descriptions say
so. Do not write copy that implies the data is more precise than that.

### Cluster C: Fees and costs (informational, pre-application)

- Target: `/guides/understanding-annual-fee-waivers`, `/guides/choosing-your-first-credit-card`
- Example queries: "annual fee waiver credit card Bangladesh", "credit card
  interest rate Bangladesh", "credit card late payment fee Bangladesh", "cash
  advance fee credit card"

### Cluster D: Basics and eligibility (informational, top of funnel)

- Target: `/guides/choosing-your-first-credit-card`, `/guides/credit-card-vs-debit-card`
- Example queries: "how to get a credit card in Bangladesh", "credit card vs
  debit card Bangladesh", "credit card eligibility Bangladesh", "CIB report
  credit card"

### Cluster E: Benefits (informational, travel)

- Target: `/guides/maximizing-lounge-access-benefits`
- Example queries: "airport lounge access credit card Bangladesh", "Priority
  Pass credit card Bangladesh" (check the guide's sources before using bank
  names in titles)

### Cluster F: Tools and reference

- Target: `/reward-calculator`, `/perfect-card-finder`, `/glossary`
- Example queries: "credit card reward calculator Bangladesh", "credit card
  finder quiz", "credit card terms glossary"

### Cluster G: Card and bank names (navigational)

- Target: `/card/<bank>/<card>` pages
- Example queries: "<bank name> credit card", "<card name> fees". Card pages
  are generated from API data, so titles and descriptions come from that data.

## 4. Planned pages

Status key: **built** exists in the repo. **Planned** is proposed, not built.

| Priority | Page                                                 | Cluster | Status  | Notes                                                                               |
| -------- | ---------------------------------------------------- | ------- | ------- | ----------------------------------------------------------------------------------- |
| 1        | Guide: how to read a credit card schedule of charges | C       | Planned | Uses Bangladesh Bank's schedule of charges, which the existing guides already cite. |
| 2        | Guide: credit card interest and the grace period     | C, D    | Planned | Explains the 25 percent cap and how the interest free period works.                 |
| 3        | Guide: cash advance vs purchase                      | C       | Planned | Covered in one section of the first-card guide. Could become its own page.          |
| 4        | Guide: lost card and dispute steps                   | D       | Planned | Covers the seven working day rules in the existing sources.                         |
| 5        | Bank hub pages (one per bank in the data)            | G       | Planned | Groups cards by issuer. Needs stable bank slugs and a card count.                   |
| 6        | Glossary terms as individual pages                   | F       | Planned | Only if the glossary gets enough organic traffic to justify it.                     |

Do not add a page for a term that no card or guide uses.

## 5. Content standards

- Every fee, rate or eligibility figure must come from a source in the page's
  `sources` array. This is the rule in `src/content/guides.ts`.
- FAQ answers must restate text that is already on the page. FAQPage markup
  must match visible content.
- Keep the Flesch-Kincaid grade of guide copy below 8.0. The markdown copies in
  the backend repo (`docs/user/`) are checked by the readability scripts there.
  Mirror any copy change into those files.
- Titles stay under 60 characters where possible. Descriptions stay under 160.
- Say what the app does and does not do. For example, the guides say that the
  filter panel lives on the home page.

## 6. Cadence

Proposed. Adjust after the first quarter of Search Console data.

- **Monthly:** publish or update one guide or planned page. Check Search Console
  for queries with impressions and no clicks, and fix titles or descriptions.
- **Monthly:** check that every category and guide still appears in the sitemap
  after a build, and that the card count matches the API when it is configured.
- **Quarterly:** re-check every fee, rate and rule against the cited source and
  update `updated` dates in `src/content/guides.ts`. Bank fee pages change
  often, so verify each cited URL still resolves.
- **On regulatory change:** when Bangladesh Bank issues a new circular on card
  operations, review the first-card, fee-waiver and credit-vs-debit guides
  within two weeks.

## 7. Measurement

Track these in Search Console and the existing analytics events (page view,
card detail view, filter apply, card select):

- Impressions and clicks for each cluster's example queries
- Clicks from `/guides` and `/category/*` to `/` and `/compare`
- Share of card detail views that come from search engines

Targets are not set. Set them after one quarter of baseline data.

## 8. Operating the sitemap

- `npm run generate:sitemap` writes `public/sitemap.xml` and `public/robots.txt`.
- Set `SITE_URL` (or `REACT_APP_SITE_URL`) to the public origin before each deploy.
  It defaults to `http://localhost:3000` and prints a warning when unset.
- Set `SITEMAP_CARDS_API_URL` to the card list endpoint to include card pages.
  If it is unset or unreachable, the script logs a warning and writes the sitemap
  without card URLs.
- The committed `public/` files reflect the local default origin. The build
  regenerates them, so deployed files use the deploy-time origin.
