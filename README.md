# ProofSkin — Skincare, with reasons

An explainable skincare-shopping assistant powered by Perfect Corp.'s YouCam Skin Analysis API.

## Features
- Consent-driven JPEG/PNG upload (compressed client-side), proxied through a server-side YouCam API adapter
- YouCam upload -> analysis task -> status polling -> score normalization
- Explainable cosmetic priorities from analyzed condition scores
- Ingredient categories and an illustrative basket constrained by a user-adjustable budget
- Optional local-only numeric skin snapshot journal (no images saved by this app)
- Clear sample mode, **not represented as live YouCam analysis**
- Responsive desktop/mobile UI, accessible status feedback

## Run locally

Node.js 20+

```sh
npm start
```

Visit http://localhost:4173. Sample walkthrough works without a key. The server reports configuration via `/api/health`.

## Configure real analysis

Create and verify a YouCam API account, redeem your hackathon API units, and configure the key as a **server-only** environment variable (never commit it or expose it to the browser):

```sh
export YOUCAM_API_KEY='YOUR_PRIVATE_KEY'
npm start
```

For Vercel, import this directory as a project, use Other framework, and configure `YOUCAM_API_KEY` in Environment Variables. Deploy. The three endpoints in `api/` are Vercel functions.

### API integration

The adapter in `lib/youcam.js` and handlers in `api/` implement:
1. YouCam REST `POST /s2s/v2.0/file/skin-analysis` to request an upload URL.
2. Binary image PUT to the returned signed URL.
3. `POST /s2s/v2.0/task/skin-analysis` with `src_file_id`, `dst_actions` and `format: json`.
4. `GET /s2s/v2.0/task/skin-analysis/{task_id}` while polling.
5. Normalize returned scores and render priorities and routine recommendations.

**Integration validation status:** Code and local mocks have been tested, but no actual YouCam key was available during creation; the end-to-end live API call remains unverified. The platform may require payload adaptations based on the latest private account documentation, notably the exact file upload response object and task JSON output format.

## Test

```sh
npm test
```

## Privacy and limits

Photo uploads are made only after explicit consent. The server does not save image files, though images are processed by YouCam under its terms. Browser-local saved records include numerical scores, not pictures. No diagnostic or treatment claims are made. Prices are explicitly **illustrative**, not live inventory or merchant offers. No clinical efficacy is inferred from score changes.

## Source layout

`index.html`, `styles.css`, `app.js`: accessible responsive product UI. `api/` and `lib/`: protected YouCam adapter. `tests/`: parser tests. `submission/`: Devpost draft material. `screenshot.py`: screenshot capture using local browser tooling, not needed in production.

Built for the 2026 YouCam API Skin AI & eCommerce VTO Hackathon. Independent submission; not affiliated with or endorsed by Perfect Corp.

## Judge setup and evidence

This code was developed during the hackathon. 

- Run `npm start` to view the live interface and clearly labeled sample flow.
- Run `npm test` for provider integration **mock** tests and input validation.
- Obtain a private YouCam API key from the official YouCam console and set `YOUCAM_API_KEY` on the server to enable **real** analysis. The key must not be checked in or shared in the browser.
- The example screenshot assets are in `submission/screenshots/` and are illustrative.
- An end-to-end provider-backed scan **has not been proven** without the credential; do not treat passing mocks as successful live integration.
- `submission/DEVPOST.md` contains plain-language product details and limitations.

The ProofSkin branch is an isolated project version in a pre-existing public GitHub repository; clone with `git clone -b proofskin-youcam-2026 https://github.com/samertall/tools.git`.
