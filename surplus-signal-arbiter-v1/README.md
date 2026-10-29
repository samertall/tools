# Surplus Signal

**From excess to essential, before time runs out.**

Surplus Signal is a working, local-first, offline-capable food-surplus matching MVP for the **Arbiter Hacks V1 — Rethinking Waste** theme. It proposes feasible allocations between food donors and recipient organizations, ranking each pair by urgency, proximity, capacity, and recipient priority while enforcing hard compatibility constraints.

> **Important:** This is a **demo sandbox**. All organizations, quantities, locations, allocations, and results are fictional. It never coordinates actual food donations, certifies food safety, provides road routing, or measures real avoided emissions. It is not a deployed logistics service.

## Why this problem?

Usable surplus food is often discarded because those who have it and those who can use it don't find each other in time. Matching requires more than a directory: each opportunity has a deadline, quantity, suitable food type, allergen profile, and geographic constraints. Surplus Signal is a proof-of-concept dispatcher for that decision.

## Features

- **Surplus inventory:** Create food offers with donor, category, weight, expiration deadline, location, and allergens.
- **Recipient onboarding:** Add a recipient with accepted categories, allergen exclusions, available capacity, priority, and location.
- **Transparent match engine:** Pairwise eligibility checks with a deterministic, explainable scoring heuristic. Strict hard blocks for expiry, insufficient lead time, distance, categories, allergens, and capacity. No third-party APIs or hidden AI scoring.
- **Partial allocations:** Simulate allocating any positive amount up to the eligible maximum. Update the available surplus and recipient capacity atomically in application state.
- **Network view:** Geographic *schematic* with nodes and suggested connections. Distances are haversine great-circle distances, **not driving routes**.
- **Impact studio:** Simulated allocation logs, category breakdown, and exportable CSV. The CO2e estimate is **illustrative only** using an explicitly disclosed arbitrary 2.5 kg CO2e / kg factor; it is not a measured, validated, or generalizable emissions estimate.
- **Offline-first:** Works without a database; uses browser `localStorage` and a simple service worker cache after first secure load. JSON backup / restore are supported.
- **Accessible, responsive UI:** Keyboard-operable main flows, clear focus rings, mobile navigation, reduced-motion handling, semantic labels, and status messaging.

## Run locally

No install, API key, or build is needed. **Do not open `index.html` directly as a file**; ES modules require an HTTP server.

```bash
cd surplus-signal
python3 -m http.server 4173
# Open http://localhost:4173
```

Run matching-engine unit tests with Node.js 18+:

```bash
npm test
```

Deployment: serve these static files on any HTTPS host (for example Vercel, Netlify, GitHub Pages).

## Try the complete demo

1. Open **Overview** to see currently matchable fictional offers.
2. Click **Explore smart matches**, review scoring and adjust the maximum distance radius.
3. Click **Allocate surplus**. Confirm 3 kg and record a **simulated** assignment.
4. Open **Impact studio** to see that the new allocation appears in the log and category metrics. Export the CSV.
5. Open **Surplus inventory**, create an offer, then add a recipient and return to the matching engine.
6. Export a JSON backup and reset/restore the sample data as needed.

## Engine logic

For each offer × recipient pair:

1. Check remaining supply and recipient capacity.
2. Reject incompatible food categories and declared allergen exclusions.
3. Reject offers whose stated deadline is closer than 30 minutes.
4. Reject pairs beyond the selected maximum **straight-line** radius.
5. For eligible pairs, compute an explainable score from urgency, recipient priority, capacity fit, and distance penalty; rank highest first.
6. At assignment time, **recheck** eligibility and limit quantity to both available capacities. Update the local state and append an auditable event.

The engine does not assert safety, assess whether pickups are achievable in time, or optimize a multi-stop vehicle route. The radius is a feasibility screen, not a delivery guarantee.

## Structure

```text
index.html              Accessible single-page shell
styles.css              Responsive UI and components
app.js                  Views, events, forms, local persistence and export
engine.mjs              Pure ranking, eligibility, allocation and metrics logic
data.mjs                Clearly fictional sample dataset
sw.js                   Offline caching for secure deployments
manifest.webmanifest    Installable app metadata
assets/favicon.svg      App mark
assets/screenshot-*.png  Optional demo visuals
package.json            npm test
README.md               Project documentation
tests/engine.test.mjs    Node unit tests
tests/browser_qa.py     Optional browser QA script (environment permitting)
SUBMISSION.md           Devpost project write-up and measuring success
DEMO_SCRIPT.md          2-to-3-minute demo narration/storyboard
```

## Real-world pilot and evaluation plan

A production pilot should begin with **consented, verified organizations**, real pickup hours, handling conditions, food categories/dietary declarations, and location-appropriate regulatory/legal checks. Donor and recipient accounts, authentication, inventory sync, confirmations, routing, and audit logs would need a secure multi-user service. Do not expose personal information in the static demo.

Pilot metrics, collected from actual operations (not this sandbox):

- **Verified diversion rate:** kg delivered and accepted ÷ kg offered, with failures and spoilage tracked.
- **Pickup success rate:** completed, food-safe collections ÷ accepted assignments.
- **Median time-to-match** and time from offer posted to collection.
- **Kilometers per kg rescued:** verified routing distance / verified kg recovered.
- **Repeat-partner retention:** percentage of donors and recipients with subsequent successful handoffs.

## Limitations and responsible use

No cloud database, authentication, notification, real-time multi-user sync, food-safety assessment, driving-route calculation, geocoding, consent flows, or real charitable partnerships. Fictitious coordinate examples are approximately within Amman, Jordan; names are made up. The scoring heuristic is not a trained ML model. The *impact* dashboard reports **simulated** allocations, not claims of recovered meals or avoided emissions.

## Built with

JavaScript (ES modules), HTML5, CSS3, browser localStorage, Service Worker API, SVG and Node.js built-in test runner. No external APIs, account, or subscription required.

## License

MIT. See [LICENSE](LICENSE).