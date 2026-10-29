# LumenChoice — the decision studio that shows its work

**Built for Next Byte Hacks V5 (October 2026).** A functional, privacy-first web app for comparing alternatives with explicit priorities, stress-testing recommendations, and exporting your decision. No signup, tracking, backend, API keys, or AI model required to use it.

## Demo

Open the deployed demo or serve the folder locally:

```bash
python3 -m http.server 4173
# visit http://localhost:4173
```

This is a zero-dependency static web app. `index.html` imports `app.mjs`, which imports the pure decision engine from `engine.mjs`. It also works on any static host that serves `.mjs` with a JavaScript MIME type.

## What works

- **Transparent ranking:** user-defined criteria and 0–10 option ratings; displayed weighted scores are normalized to 100.
- **Scenario presets:** balanced, affordability-first, career-first and custom priorities.
- **Stress test:** seeded Monte Carlo simulation changes weights and option ratings within selectable bounds; displays conditional win share rather than pretending to forecast the future.
- **Explanations:** ranking, leading criterion contributions, first/second margin, evidence table.
- **Editable:** add, edit, and remove choices; rename a decision, edit descriptions, edit weights, add/remove criteria.
- **Portable:** automatic localStorage persistence; export/import JSON; CSV export; shareable plain-text summary (no cloud transmission).
- **Accessible:** native controls, descriptive labels, keyboard focus, reduced-motion support, responsive layout, status announcements.

## Testing

```bash
node --test
```

The unit tests verify weight normalization, ranking, simulation reproducibility, explanations, import validation and edge cases. Manual smoke tests: change weights, edit an option, open scenario/stress panels, export JSON and import it again, refresh to verify persistence, test keyboard navigation and narrow viewports.

## How scoring works

For option `o`, criterion `c`, score `r(o,c)` between 0 and 10, and user weight `w(c)`,

`score(o) = sum[r(o,c) * w(c) / sum(w)] * 10`.

Stress test runs 900 seeded simulations by default. Each simulation samples every weight within ± the selected volatility percentage, and each score by up to ± `2 * volatility / 100` points, bounded to 0–10. The share of runs where an option finishes first is a **scenario-robustness heuristic**, not a calibrated probability of a real-world outcome. The result is fully deterministic for identical inputs.

## Privacy and security

Everything stays in the browser. No analytics, cookies, external requests, or third-party dependencies. Imported JSON is validated and rendered as text, not HTML. No secrets are stored in this repository.

## Hackathon documentation

See `DEVPOST.md` for write-up, technical details, and demo storyboard. Authored in the October 6–31, 2026 build window.

## License

MIT.