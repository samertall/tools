# Signal Atlas · See the signal. Verify the source.

**An evidence-first market intelligence and tokenized RWA research dashboard, built for [Build with CMC: API Hackathon Round 2](https://dorahacks.io/hackathon/coinmarketcap-api-202611).**

**Recommended submission track:** Markets and Trading Tools (or Real World Assets after live RWA credentials are activated and verified).

## The problem

A single 24-hour percentage change hides the difference between broad participation and a narrow rally. The same tokenized real-world asset can be represented by several competing issuer wrappers, and the distinction between *tokenized aggregate price* and *underlying TradFi spot* is easily lost.

Signal Atlas makes both sources of ambiguity legible. It never offers trading signals as forecasts; users see the underlying calculations and CoinMarketCap API evidence.

## Product capabilities

1. **Live Market Health Index:** non-predictive, weighted breadth + CMC sentiment + median return + participation alignment, calculated from live listings.
2. **Market breadth mosaic:** interactive top-50 heatmap with 24h changes and a persistent local watchlist.
3. **Live screener:** filter by gainers, losers, volatility threshold, or watchlist; sort by cap, volume, return, or rank; export data.
4. **Scenario lab:** model an equal-weighted hypothetical basket under a uniform shock. Clearly labeled as an illustrative scenario, not a prediction.
5. **Tokenized RWA explorer:** CMC v5 issuer list, RWA list, batched quote details and per-wrapper price dispersion, issuer concentration and reported turnover. Requires your Startup-tier CMC API key on the server.
6. **API evidence:** shows which real endpoints answered, the observed HTTP code, CMC timestamps and a redacted provider response excerpt. Synthetic demonstration mode is explicitly labeled and NEVER counted as an API call.

## Runtime and setup

Requires **Node.js 18+**. No npm install step or third-party dependencies.

```bash
git clone https://github.com/samertall/tools.git
cd tools/cmc-signal-atlas
npm test
npm run dev
# Visit http://127.0.0.1:3000
```

The market dashboard uses CMC's keyless public API and works without an account. Keyless calls are rate-limited by provider IP pool, so the backend caches snapshots for 90 seconds and responses advertise 60-second CDN caching.

**Enable real RWA data:** register on DoraHacks and on CoinMarketCap API with the same CMC account email, then add **CMC_API_KEY** as an encrypted Vercel server-side environment variable. Redeploy. DO NOT commit the key, include it in screenshots, or use it as a query parameter.

The public frontend requests only the backend. Neither RWA API keys nor request headers leave the server; the repository contains no credential.

## Real CMC endpoint inventory

| Usage | REST endpoint | Authentication |
|---|---|---|
| Main live screener | `GET /public-api/v3/cryptocurrency/listings/latest` | Keyless |
| Market capitalization and dominance | `GET /public-api/v1/global-metrics/quotes/latest` | Keyless |
| CMC proprietary Fear & Greed | `GET /public-api/v3/fear-and-greed/latest` | Keyless |
| CMC Altcoin Season Index | `GET /public-api/v1/altcoin-season-index/latest` | Keyless |
| CMC 100 index | `GET /public-api/v3/index/cmc100-latest` | Keyless |
| RWA asset rankings | `GET /v5/real-world-assets/assets/list` | CMC Startup key |
| Issuer explorer | `GET /v5/real-world-assets/issuers/list` | CMC Startup key |
| Per-token and issuer quote details | `GET /v5/real-world-assets/quotes/latest` | CMC Startup key |

CMC source documents: [Keyless API](https://coinmarketcap.com/api/documentation/pro-api-reference/keyless-public-api) and [RWA Reference](https://coinmarketcap.com/api/documentation/pro-api-reference/real-world-assets).

### Live proof: how to capture

Use the deployed dashboard > **API evidence** after a successful LIVE response. Copy the JSON to `evidence/live-response.json` and capture a screen recording showing **refresh → live timestamp → screener → API evidence → response excerpt**. Do not publish an API key or claim the docs' examples or test fixtures are live evidence.

You can also verify the public keyless feed from a terminal:

```bash
curl -sS -i 'https://pro-api.coinmarketcap.com/public-api/v3/fear-and-greed/latest'
```

A 200 HTTP response with CMC's `status.error_code=0` demonstrates live provider connectivity. The implementation's backend source displays the exact five request URLs. Run `npm test` separately for unit and mocked-contract tests; these are NOT real provider calls.

## Transparent methodology

**Health = weighted average of four inputs, each clamped between 0–100:**

- Advancing breadth (35%): `100 × positive_change_coins / sampled_coins`, excluding a documented stablecoin list.
- Fear & Greed (25%): CMC index, omitted with proportional weight renormalization if unavailable.
- Median momentum (25%): `clamp(50 + 7 × median_24h_return)`.
- Breadth alignment (15%): `clamp(100 - 10 × abs(equal_weighted_24h - cap_weighted_24h))`.

Regimes: defensive below 35, mixed from 35 to below 66, constructive at 66 or above. These thresholds are **product heuristics**, not scientifically calibrated risk measures or future-return predictors.

**RWA:** wrapper gap equals `(max_token_price − min_token_price)/average_tokenized_price × 100`, using token quotes supplied in CMC RWA data. Issuer concentration uses available token market caps only. **Neither metric is a direct arbitrage opportunity or price premium relative to the underlying conventional asset.** Null values remain N/A.

## Architectural trade-offs and limits

- Public CMC keyless endpoints make a functioning market demo possible without distributing any keys.
- CMC authenticated RWA endpoints expose issuer associations and wrapper-level prices in a single API, which would otherwise require separately integrating providers.
- RWA API key is event-scoped; after December 9 it may revert to Basic. Availability and call credits depend on your eventual plan. This implementation gracefully displays access failures rather than fabricating live data.
- Listing changes and quoted values update on provider schedules. CMC global metrics and altseason may update at different cadences; this app does not claim a synchronized tick.
- Market breadth is based on **top 100 listed cryptocurrencies**, not all coins; it is not a global market breadth metric.
- This prototype is stateless on the server. Watchlists use browser localStorage, no server accounts; its alert logic is descriptive at refresh time only. There are no background alerts, order execution or portfolio brokerage integrations.
- RWA asset list is paginated to the first 100; issuer list to the first 100. It is not an exhaustive issuer graph.
- Market health heuristic not backtested, research only. Financial decisions require independent verification.

## Quality

```bash
npm run check  # syntax check + Node's built-in unit/contract tests
```

- Dependency-free application, responsive UI and keyboard focus states
- Server-side-only API key, fixed server endpoint allowlist, strict RWA ID validation
- No arbitrary CMC proxy URL, no permissive CORS, no user credentials
- API timeouts, partial-source degradation and explicit live/illustrative states
- Basic CSP-compatible content strategy can be tightened for a production release (current prototype uses inline script and CSS)

## Attribution

Created by **Samer Tallauze** for the November 2026 CoinMarketCap / DoraHacks challenge. CoinMarketCap market data is © its owners and is used subject to CMC API terms. No affiliation or endorsement implied.

**Disclaimer:** For educational and research purposes only, not financial advice, market manipulation, trading automation, or security vetting of token issuers.
