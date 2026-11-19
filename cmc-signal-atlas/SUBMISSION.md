# DoraHacks submission package — Signal Atlas
**Event:** Build with CMC: API Hackathon Round 2, November–December 2026
**Deadline:** December 9, 2026, 23:59 UTC
**Maker:** Samer Tallauze
**Selected recommended track:** Markets and Trading Tools

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
- **Short demo video (real CMC browser recording):** https://github.com/samertall/tools/blob/main/cmc-signal-atlas/demo/signal-atlas-live-demo.mp4
- **Verified provider receipts (three genuine HTTP 200 responses):** https://github.com/samertall/tools/blob/main/cmc-signal-atlas/evidence/live-response.json
- **Public automated verification run:** https://github.com/samertall/tools/actions/runs/44496771579
- **Live overview screenshot:** https://github.com/samertall/tools/blob/main/cmc-signal-atlas/demo/screenshot-live-overview.png
- **Live API-evidence screenshot:** https://github.com/samertall/tools/blob/main/cmc-signal-atlas/demo/screenshot-api-evidence.png
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

**Observed during real integration:** The keyless CMC v3 listings response represents the USD quote as a `quote` **array of currency objects**, whereas legacy consumers often expect `quote.USD` as an object. Our original normalization silently resulted in an empty computed score although the endpoint returned 100 assets with HTTP 200. We corrected the parser and added regression tests. The keyless API also uses a shared IP rate pool, relevant for serverless infrastructure. The RWA list has aggregate values; detailed wrapper/issuer prices require an additional batched Quotes Latest call. Provider coverage and null handling should be explicit. An API-level token coverage/completeness indicator would make this easier.

**Do not claim:** User research, profitability, realized financial outcomes, confirmed live RWA API calls or successful API responses unless directly evidenced.

## X post — publish only after you have your DoraHacks URL and video
🚀 Built Signal Atlas for #BuildwithCMC — an explainable market intelligence platform powered by CoinMarketCap.

✅ Live market breadth & health diagnostics
✅ Transparent API evidence
✅ Crypto screener, watchlists & scenario lab
✅ Tokenized RWA research

Live demo: https://signal-atlas-cmc-2026.vercel.app
Demo video: https://github.com/samertall/tools/blob/main/cmc-signal-atlas/demo/signal-atlas-live-demo.mp4
DoraHacks submission: [DORAHACKS_SUBMISSION_URL]

#BuildwithCMC #CoinMarketCap #Crypto #FinTech #BuildInPublic

## Final acceptance checklist
- [x] Public GitHub source
- [x] Production Vercel deployment created and READY
- [x] CMC endpoint names documented
- [x] API adapter, explainable calculations and mocked integration tests committed
- [x] Demo UI explicitly distinguishes live vs synthetic data
- [x] Verify CMC HTTP 200 directly (listings, global metrics and sentiment)
- [x] Verify actual app with real CMC prices and health score in GitHub Actions localhost
- [x] Capture live API evidence and UI screenshots without mocking
- [ ] Deploy the corrected version to public Vercel URL (currently blocked by Vercel Hobby build limit)
- [ ] Activate authenticated RWA module by adding a CMC API key in Vercel env settings (optional for Markets track)
- [x] Observe passing GitHub Actions test results (9/9)
- [x] Record and publish screen recording (GitHub MP4)
- [ ] Publish DoraHacks BUIDL
- [ ] Publish X post with DoraHacks URL, demo video URL and #BuildwithCMC
- [ ] Paste X URL into submission form and confirm submission success

## Verification summary (19 Nov 2026)
The GitHub Actions job `44496771579` passed: 9 automated tests, live provider listings/global/sentiment HTTP 200, the corrected app started on CI with 100 real assets, and browser recording confirmed a rendered health score of 38 with 50 heatmap tiles at recording time. The video and screenshots are generated from the actual backend and real CMC data, not fixtures. The local CI URL in the proof is a temporary GitHub Actions localhost service; it is **not a public deployment**. The public Vercel app exists but an updated build must succeed before treating it as equivalent to the tested version. No authenticated RWA endpoint call has yet been demonstrated.
