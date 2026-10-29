# Devpost submission — Arbiter Hacks V1 (Theme Track: Rethinking Waste)

## Project name
Surplus Signal

## Tagline
A local-first food rescue dashboard that finds feasible homes for surplus food before it expires.

## Inspiration
Usable food can go to waste not because nobody needs it, but because supply and demand fail to connect before a short deadline. Donation marketplaces often surface listings without helping decide whether the receiving organization can actually accept them. We wanted to bring transparent, operational thinking to the rescue decision.

## What it does
Surplus Signal lets a donor list surplus food, and lets a community organization register its capacity, accepted food types, allergen exclusions, and approximate location. An explainable matching engine checks whether each pair is compatible, within range, and has sufficient time and capacity. It ranks eligible matches, allows simulated partial allocations, and shows how much food has been assigned in a transparent impact dashboard with CSV/JSON exports. An interactive network diagram visualizes potential matches. It works as a responsive, local-first browser app with offline support after first load.

## How we built it
We built it with semantic HTML, responsive CSS, JavaScript ES modules, SVG, browser localStorage, and a service worker. The matching engine uses haversine distance, strict eligibility filters, and a deterministic score based on time remaining, recipient priority, capacity fit, and distance. The allocation pathway validates requested kilograms against both sides' remaining capacity, updates state, and records a simulated audit event. Built-in Node.js unit tests exercise compatibility, expiry, radius, negative quantities, and over-allocation. No API key or paid infrastructure is needed to run the prototype.

## Challenges
A high match score is useless if the food category is incompatible, an allergen is excluded, there is no capacity, or the window is too short. We split hard eligibility rules from soft ranking so impossible matches never sneak into the list. Another design challenge was keeping the impact dashboard honest: it shows simulated results with explicit disclaimers and separates illustrative emissions arithmetic from any real measured sustainability claim.

## Accomplishments
A working end-to-end demo: create offers and recipients, filter and rank matches, allocate food, update capacities, inspect assignment history, and export state or CSV. No backend setup is required for judges. The rules are inspectable, unit-tested and portable to a future server-side pilot.

## What's next
Build authenticated donor/recipient accounts and a secure event-backed backend; add real inventory verification, operating hours, pickup scheduling, food-safety and consent checks, road-network routing, and notifications. Pilot with a small number of verified partners; instrument actual accepted kilograms, successful pickup rates, time-to-match, and routing costs. Only then evaluate credible food-waste and emissions reductions.

## Theme Track required problem-and-measurement paragraph
**Problem:** edible surplus food becomes waste when donors and suitable recipients cannot coordinate within short shelf-life windows. **Approach:** Surplus Signal filters potential transfers by food compatibility, allergen exclusions, capacity, available time, and straight-line proximity, then ranks feasible opportunities so users can prioritize urgent rescue decisions. **Measurement:** in a consent-based real pilot, compare verified kilograms accepted and safely delivered as a proportion of kilograms offered against a matched baseline, alongside median time-to-match, collection success, cancellations/spoilage, and verified kilometers per kilogram. The current app uses fictional data and simulated allocations; it does not claim actual waste diversion or verified environmental impact.

## Video URL
Not published yet. Upload the included demo MP4 to YouTube or Vimeo, then paste its public link here and into Devpost.

## Repository URL
Add a published public repository link after uploading the included source files.

## Live demo URL
Add the verified public deployment URL, if successfully deployed.

## Important eligibility note
Arbiter Hacks V1 is open to students aged 13+, not companies or professional organizations. The applicant must personally meet the published conditions. Registration does not independently verify educational status.