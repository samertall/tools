# Devpost draft - AQX Sports Analytics Data Bowl 4.0

**Status: draft only; not sent to Devpost.**

## Project title
ScoutBoard - Football Intelligence Lab

## Short tagline
Football forecasts with receipts: transparent Premier League probabilities, scouting priorities, and honest backtests.

## Inspiration
For many teams and student analysts, public match data is plentiful but it is difficult to turn it into a decision and understand how much to trust that decision. A single percentage without its assumptions or error history can be misleading. ScoutBoard was designed to make each estimate auditable and each uncertainty actionable.

## What it does
ScoutBoard is an interactive Premier League forecasting dashboard. Pick a home and away team to see three-way match probabilities, goal estimates, and a readable scouting briefing. Adjust the home-attacking assumption to examine sensitivity, inspect current season standings, and rank upcoming fixtures by uncertainty to prioritize scouting time. The evidence panel measures chronological prediction accuracy against a smoothed rolling league-frequency baseline, visualizes basic calibration, and exports its fixture-level predictions for verification. The model reports when it performs worse than baseline rather than hiding weaknesses.

## How we built it
Built from scratch using HTML, CSS and JavaScript, with a pure JavaScript forecasting module and browser-side UI. Public-domain match data is retrieved directly from OpenFootball JSON files for the 2023/24 through 2026/27 English Premier League seasons, with a plainly labelled verified offline subset when the full live source is unavailable. A venue-aware, shrinkage-regularized independent Poisson scoring model generates home/draw/away probabilities. Tests verify mathematical invariants and protect against temporal leakage. No API keys, accounts, backend, or paid sports data subscription is required.

## Challenges we ran into
Fixture feeds mix completed results with unscored matches, so incomplete scores must be filtered without inventing outcomes. Randomly splitting matches would leak future information into forecasts, so ScoutBoard replays games chronologically and predicts all games on a date before processing that date's outcomes. Small home/away samples also create fragile estimates; fixed priors temper their extremes, and the UI exposes sample-depth limitations. Offline network restrictions required an honest, explicitly limited preview mode rather than fake full-season numbers.

## What we learned
A statistically simple, reproducible probability estimate is more useful when paired with an honest baseline comparison, source transparency, and clear explanations of uncertainty. The design deliberately separates factual match history from model projections and non-causal illustrative scenarios.

## What's next
Potential improvements include bootstrap confidence intervals, rolling-season weighting, a held-out season comparison, additional team-strength baselines, proper scoring rule calibration studies, and independent source-quality audits.

## Built with
HTML5, CSS3, JavaScript, Node.js built-in test runner, Python Playwright smoke tests, OpenFootball public-domain match JSON, transparent independent-Poisson goal modeling, AI-assisted coding and QA.

## Impact
Scout analysts can prioritize close, uncertain fixtures and spend scarce review time strategically. Students can compare a model to a baseline and download predictions instead of repeating unexamined win-rate claims. This is demonstrative decision support, not betting advice.

## Demo and source
- Working demo: [TO ADD VERIFIED PUBLIC URL]
- Public source code: [TO ADD VERIFIED PUBLIC URL]
- Demo video: not required, not provided
- Screenshot: assets/devpost-cover.jpg

## Verification and provenance
- Deterministic Node.js model suite: 10 passing tests (observed during build)
- Offline Playwright UI smoke test: passed (observed during build)
- OpenFootball is an external public-domain data source; no proprietary or synthetic full-league data is asserted.
- AI assisted with the initial concept, implementation, visual design and tests. The human entrant must review, adopt and own the final idea and execution before making any authorship claims required by the organizer.

## IMPORTANT pre-submission checks
- Confirm the entrant actually qualifies as a student under the eligibility rules.
- Have the entrant review and adopt the idea and final implementation as their own work; follow the organizer's AI-use rule.
- Obtain explicit authorization for the Devpost create and final submit actions.
- Verify live demo and public GitHub links, read the final description, and confirm the screenshot is representative.
- No Devpost form fields were listed as mandatory custom questions when checked 2026-10-29.