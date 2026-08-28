# POP discovery implementation

Scope: public-site technical discoverability, not a guarantee of ranking, indexing or recommendations.

## Canonical facts

- Brand: The Pop Moment by UNIKMO; an AntiBalcony experience.
- Canonical domain remains https://antibalcony.com. No new domain is assumed purchased or connected.
- Free POP: reviewed social-link page, no hosted/copied video and no guaranteed social feature.
- Keep it: USD 199; Go public / NASDAQ request: USD 549; applicable tax and delivery additional.
- NASDAQ is not bookable inventory. Availability, creative approval, licensed capture and final scope/quote must be confirmed first.
- Extra-card pricing remains the provisional rate recorded in POP_LEAN_OFFER.md; this pass does not approve a new price.

## Implemented coverage

- Server-rendered definitions, scope and FAQs; no bot-specific content or hidden keyword blocks.
- Organization, UNIKMO Brand, WebSite, WebPage, Service/Offer and FAQPage JSON-LD; FAQ answers share one source with visible HTML.
- AboutPage and guide CollectionPage; visible guide breadcrumbs with BreadcrumbList.
- Explicit relationship between new POP experience and retained AntiBalcony archive; no invented legal identity, social profiles, awards, reviews or provider partnership.
- Unique canonicals and descriptive metadata on public content pages, including route-specific Open Graph/X text.
- Preserved archive URLs; updated obsolete commercial claims; internally linked guide hub.
- Production robots allow search crawlers including OAI-SearchBot and PerplexityBot. Training-bot policy is unchanged. Bot user agents are not authentication and no firewall is weakened.
- Sitemap excludes transactions, private card URLs and individual POP pages. No per-request fabricated modification dates.
- Card/detail pages keep noindex and gain X-Robots-Tag/no-referrer headers. They remain crawlable so crawlers can see noindex. A shareable token is not identity authentication; noindex cannot guarantee confidentiality or removal from third-party caches.
- Preview deployments: noindex header across routes, robots deny all, empty sitemap. Vercel's preview protection is retained.
- Optional /llms.txt generated from the same public facts. Experimental convenience only, not a substitute for normal SEO.

## Verification

After `npm run build`, run `npm run test:discovery`. Tests fetch real built HTML, parse JSON-LD, compare visible FAQs, follow every public sitemap URL, check canonical/description/OG/X parity, simulate search user agents, inspect privacy headers and check preview header configuration. `npm run test:pop` additionally tests published/unpublished/private record boundaries using an isolated local database double, not production data.

For a reachable deployment: `node scripts/discovery-check.mjs https://DEPLOYMENT_HOST --preview` for a preview, or omit `--preview` for the production domain. A protected preview must be opened by an authorized viewer; do not disable protection merely for a test.

## Release gates not implied by code completion

1. Deploy and verify the exact preview commit. Production needs separate approval.
2. On the approved production release, verify HTTPS, the canonical host, actual crawler access through Vercel/CDN, HTML, robots, sitemap and noindex boundaries. User-agent simulation does not prove access from real crawler IPs.
3. Verify the owned domain in Google Search Console and Bing Webmaster Tools; submit the sitemap and inspect public landing pages. No account setup or indexing submission is claimed by this implementation.
4. Run Google's Rich Results Test for supported types and Schema.org Validator for the whole graph. Service markup and FAQ markup do not guarantee a rich result.
5. Check real indexed pages, referrals and several brand/category prompt phrasings after crawling. Cross-model recommendation tests and external authority/citations remain unverified, not "fully discoverable".
6. Keep legal-review, operational intake and licensed-capture gates in POP_LEAN_OFFER.md. Metadata does not activate those services.

## Primary guidance checked

- https://developers.google.com/search/docs/appearance/ai-features — ordinary SEO fundamentals; visible text/structured data consistency; no special AI markup required; indexing is not guaranteed.
- https://developers.openai.com/api/docs/bots — OAI-SearchBot is for search; GPTBot training controls are separate.
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers — search crawler controls and verified IP requirements for firewall rules.
- https://schema.org/Service — service/offer vocabulary.
