# DoraHacks submission package — Signal Atlas
**Event:** Build with CMC: API Hackathon Round 2, November–December 2026
**Deadline:** December 9, 2026, 23:59 UTC
**Maker:** Samer Tallauze
**Recommended track:** Markets and Trading Tools

## Title
Signal Atlas — Explainable Market Intelligence Powered by CoinMarketCap

## Tagline
See the signal. Verify the source.

## Short pitch
Crypto prices tell you *what* moved, not whether the market is moving together. Signal Atlas turns CoinMarketCap's live market data into a transparent market-health snapshot: breadth, median momentum, sentiment and market-cap participation. Researchers can inspect the math, filter a live screener, build an asset watchlist, simulate downside scenarios, and verify the exact API responses behind the dashboard. An advanced tokenized-RWA module adds issuer concentration and token-wrapper price dispersion.

## Description
Most crypto dashboards rank tokens by performance but make it difficult to distinguish broad-market participation from a handful of dominant assets moving the headline number. Tokenized RWAs add a second layer of complexity: multiple issuers and on-chain wrappers may trade around the same tokenized aggregate price, yet retail users rarely have a comparable, neutral view.

Signal Atlas provides five interconnected workflows:
- **Market Health Index:** a reproducible four-factor heuristic built from CMC top-100 rankings, Fear & Greed, median returns and equal-vs-cap-weighted performance. This is an explanatory diagnostic, NOT a predictive signal.
- **Market Breadth Heatmap:** instantly see which ranked assets advanced or declined, with click-to-watch interaction.
- **Asset Screener:** filter and sort prices, volumes, market caps and price changes. Export observations as CSV.
- **Portfolio Scenario Lab:** choose assets, vary a uniform shock, and view purely hypothetical equally weighted P/L.
- **RWA Intelligence:** investigate tokenized assets with CMC RWA list, batched quote details, issuer records, wrapper dispersion and turnover when the event-issued CMC API key is configured.

### Why CMC was essential
CMC supplies ranked cross-chain quotes and volume from one consistent source, CMC's own sentiment and index datasets, and a harmonized issuer-level RWA catalogue with per-wrapper token details. The API lets independent builders combine general market signals and tokenization research without inventing missing data or juggling exchange-specific ticker mappings.

### Technical details
Responsive, accessible HTML/CSS/JavaScript front end; server-side Node.js CMC adapter on Vercel; deterministic and testable analytics module; 90-second server cache; fixed upstream allowlist; server-only secret handling; resilient partial-data states; explicit synthetic demo labels; local watchlists; CSV exports. The source includes unit and mocked HTTP contract tests plus GitHub Actions CI.

### Links
- **Product demo:** https://signal-atlas-cmc-2026.vercel.app
- **Public GitHub:** https://github.com/samertall/tools/tree/main/cmc-signal-atlas
- **DoraHacks project URL:** [Add only after the project has actually been submitted]
- **Short demo video:** [Add after recording and publishing]
- **X/Twitter post:** [Add actual public X post URL after publishing]

### Explicit endpoints
**Keyless:** `/public-api/v3/cryptocurrency/listings/latest`, `/public-api/v1/global-metrics/quotes/latest`, `/public-api/v3/fear-and-greed/latest`, `/public-api/v1/altcoin-season-index/latest`, `/public-api/v3/index/cmc100-latest`.

**Authenticated:** `/v5/real-world-assets/assets/list`, `/v5/real-world-assets/quotes/latest`, `/v5/real-world-assets/issuers/list`.

### Required real API proof
Open the live deployed product, click **API evidence**, and paste or screenshot the observed `200` response with CMC timestamp and excerpt. If the dashboard shows API unavailable, **do not** submit an illustrative example as proof. Capture working flow with a 60–90 second video, then post link to the final DoraHacks project.

## 75-second video storyboard
0–8 sec: hero and problem: “A green chart does not mean a healthy market.”
8–22 sec: live CMC timestamp + breadth score breakdown + source evidence.
22–34 sec: breadth mosaic and identify narrow vs broad participation.
34–46 sec: screener filter and watchlist, export.
46–58 sec: select scenario lab, adjust -10% shock, explain this is illustrative math.
58–67 sec: RWA explorer (only if actual Startup-tier credentials work, otherwise omit).
67–75 sec: show API evidence + GitHub code and closing tagline.

## Responsible API feedback (review and update after real tests)
**Enabled:** Keyless publicly documented CMC routes make live prototypes possible without placing credentials in a browser. Standard response envelopes reduce integration complexity. Authenticated RWA routes centralize token and issuer records.

**Friction to assess and document after testing:** The keyless API uses a shared IP pool, which complicates demos in shared serverless environments. RWA list response contains aggregate asset quotes, whereas token-level details require a second batched Quotes Latest call. Missing/null token prices limit dispersion comparisons. An explicit completeness indicator for token/issuer coverage would support safer analytics.

**Do not claim:** User research, profitability, realized financial outcomes, confirmed live RWA API calls or successful API responses unless directly evidenced.

## X post — publish only after you have your DoraHacks URL and video
🚀 Built Signal Atlas for #BuildwithCMC — an explainable market intelligence platform powered by CoinMarketCap.

✅ Live market breadth & health diagnostics
✅ Transparent API evidence
✅ Crypto screener, watchlists & scenario lab
✅ Tokenized RWA research

Live demo: https://signal-atlas-cmc-2026.vercel.app
Demo video: [VIDEO_URL]
DoraHacks submission: [DORAHACKS_SUBMISSION_URL]

#BuildwithCMC #CoinMarketCap #Crypto #FinTech #BuildInPublic

## Final acceptance checklist
- [x] Public GitHub source
- [x] Production Vercel deployment created and READY
- [x] CMC endpoint names documented
- [x] API adapter, explainable calculations and mocked integration tests committed
- [x] Demo UI explicitly distinguishes live vs synthetic data
- [ ] Verify a real HTTP 200 from CMC in the deployed Evidence screen
- [ ] Activate authenticated RWA module by adding a CMC API key in Vercel env settings (optional for Markets track)
- [ ] Observe passing GitHub Actions test results
- [ ] Record and publish screen recording
- [ ] Publish DoraHacks BUIDL
- [ ] Publish X post with DoraHacks URL, demo video URL and #BuildwithCMC
- [ ] Paste X URL into submission form and confirm submission success
