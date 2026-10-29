# ScoutBoard - Football Intelligence Lab

**Original AQX Sports Analytics Data Bowl 4.0 entry | October 2026**

ScoutBoard turns English Premier League fixture results into transparent home/draw/away forecasts, scouting priorities, and measurable evidence about model quality. It is a research prototype for coaches, student analysts, and front-office scouting teams, **not betting advice**.

## Run it

- Open the deployed demo (see Devpost project page after publication), or serve this repository locally: `python3 -m http.server 8080` then visit `http://localhost:8080`.
- No installation, backend, account, build step, external JavaScript dependencies, or API key required.
- The app requests four complete season fixture feeds from OpenFootball at runtime. If the network is unavailable, it switches to an **explicitly marked 100-fixture offline preview subset**. Do not report its offline statistics as full-league results.
- `ScoutBoard-Standalone.html` is a portable all-in-one HTML build (works offline with the preview subset; uses live source if available).

## Features

1. **Matchup studio**: choose home and away clubs, inspect win/draw/loss probabilities and projected goals, and stress-test a home-attacking assumption with a clearly non-causal scenario slider.
2. **Scouting briefing**: uncertainty indicator, expected-goal gap, and venue-specific sample-depth warning; uncertainty favors deeper scouting rather than confident unsupported decisions.
3. **Season context**: interactive result-based standings, completed-game counts, form, goal difference and club search for four Premier League seasons.
4. **Evidence dashboard**: sequential backtest against a rolling historical-outcome-frequency baseline; Brier score, log loss (in source), observed-versus-forecast calibration and exportable row-level predictions.
5. **Fixture priority queue**: future unscored fixtures ranked by uncertainty, with one-click prefilled matchup projections.
6. **Accessible responsive UI**: desktop/mobile-friendly controls, input labels, keyboard-openable queue cards, descriptive chart copy and clear data provenance.

## Model and data

**Source:** [OpenFootball/football.json](https://github.com/openfootball/football.json), English Premier League JSON for 2023/24, 2024/25, 2025/26 and 2026/27. OpenFootball publishes the data in the public domain; refer to the upstream repository for provenance and any changes. The app fetches these live URLs:

```
https://raw.githubusercontent.com/openfootball/football.json/master/2023-24/en.1.json
https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/en.1.json
https://raw.githubusercontent.com/openfootball/football.json/master/2025-26/en.1.json
https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json
```

**Data limitations:** Some fixtures have no reported final score and are excluded from training and standings. The program applies a date cutoff to avoid future data leakage. Fixture dates and upstream scores may be revised, and no data-quality guarantee is made. This is public match-result data, not Opta tracking or proprietary scouting information.

**Features used:** venue-aware historical goals for and against, opponent-relative attack and defense strengths, home/away baseline goal rates. There are no injury, lineup, xG event, player location, or tracking inputs. The displayed 'expected goals' are Poisson mean goals, not an event-based xG model.

**Estimator:** each team's home/away scoring and conceding rates is shrunk toward a fixed league-rate prior with six-match equivalent weight; projected home/away goal means combine these relative attack and opponent defense components. Independent Poisson score counts from 0 through 8 and a 9+ tail bucket yield a 1X2 probability distribution. The forecast is explanatory and intentionally simple, not optimized for production wagering or clinical decisions.

**Backtest:** for every completed fixture on a calendar date, predict before updating state with *any* results from that date. Compare to a rolling, smoothed unconditional 1X2 baseline. All seasons are in temporal order, and the selected season controls displayed out-of-sample-style scores. The 3-class Brier score is one-half the squared error sum across home/draw/away. A lower score is better; losses relative to baseline are displayed as losses, never concealed.

**Known caveats:** Poisson independence, fixed priors, incomplete schedule data, team promotions/relegations, draw calibration and scoring-system simplifications; small samples and concept drift can produce poor probabilities. A backtest is not a forward-market validation. Teams' points ignore deductions.

## Tests

```sh
node --test tests/model.test.js
python3 -m http.server 8080
```

An optional UI smoke test lives in `tests/ui_check.py`; it requires Python Playwright and installed Chromium. The browser smoke test exercises the bundled offline fallback without relying on external network access.

## File map

- `index.html`: semantic HTML dashboard
- `src/style.css`: responsive visual system
- `src/model.js`: pure match-level forecasting, evaluation and CSV analytics
- `src/app.js`: event handlers, browser fetching, DOM rendering and offline data fallback
- `data/sample.js`: verified published-results subset for offline preview only
- `ScoutBoard-Standalone.html`: inline, portable single-file deployment build
- `tests/model.test.js`: deterministic forecasting tests
- `tests/ui_check.py`: browser interaction test
- `assets/`: favicon and local submission screenshots (optional for deployment)
- `devpost-submission.md`: Devpost draft text, not evidence that Devpost has received a submission

## Competition and authorship

Built specifically for the AQX Data Bowl 4.0 in October 2026 with AI-assisted development and original application code. The participant must review and take responsibility for the idea, analysis, implementation, eligibility, and final submission under official rules. A repository or deployed link does not imply hackathon acceptance or submission.

## License and attribution

Original application source: MIT License (see `LICENSE`). Match results: external OpenFootball public-domain source, not claimed as our original data. Team and competition names are used for descriptive identification only.