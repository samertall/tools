# BridgeKit — Every step, within reach

**A privacy-first, bilingual (English / Arabic), offline-ready guide builder designed to make everyday tasks easier to understand and complete.**

> CodeSprint by Elite Coders 2026 · Newly created for this challenge · MIT licensed

## The problem

People often face overwhelming, jargon-heavy instructions when learning something new, preparing for opportunities, or helping in their community. Complex guidance, a missing internet connection, and language barriers can all interrupt progress. BridgeKit turns each journey into one clear action at a time.

## Live demo

Deployment URL: Add the verified Vercel deployment link here after release.

## Features

- **Four starter guides** covering learning, career preparation, digital safety, and community organizing (non-official general guidance).
- **Guide studio:** create, edit, delete, and validate custom guides (up to 12 steps).
- **Accessible step-by-step reader:** one action per screen, check off tasks, resume later, keyboard-friendly interactions.
- **Bilingual interface:** English and Arabic with right-to-left layout and translated starter guides.
- **Local-first persistence:** no account or backend; guides and progress stored in the browser's localStorage.
- **Offline web app:** service worker caches app assets after first load over HTTPS.
- **Share links:** transport a guide as encoded data in the URL fragment (not sent to the app's server).
- **Import/export:** portable JSON backup for custom guides; print-friendly checklists.
- **Text-to-speech:** browser speech synthesis when supported.
- **Responsive design:** desktop, tablet, and mobile. Reduced-motion and focus-visible states supported.

## Run locally

The source is dependency-free. Serve it with a local HTTP server (needed for service workers):

```bash
python3 -m http.server 8080
```

Visit http://localhost:8080. No API keys are required.

## Test

Browser smoke tests are in `tests/test_app.py` (Python Playwright). Run with `python tests/test_app.py` in an environment with Playwright and Chromium installed.

## Technical design

- Semantic HTML, modern CSS, vanilla JavaScript, `localStorage` and a small service worker.
- Client-side guide schema validation on import and on share-link decoding.
- User-provided strings are HTML-escaped or applied using `textContent` to prevent HTML injection.
- No telemetry, cookies, ads, analytics, accounts, or server data storage.
- No generated AI responses or paid external APIs; "AI-assisted development" means the implementation was created with AI assistance, not that the app has an AI inference backend.

## Privacy & known limitations

- Local browser storage may be cleared by the browser or device settings. Export a backup to keep your custom guides.
- Shareable URLs contain guide content; do not put private or sensitive information in guides you share.
- Custom guides are single-language; the interface and starter content are bilingual, but user-generated text is **not** automatically translated.
- Text-to-speech availability and voice quality depend on the browser/OS. Some voices may require network access.
- Offline readiness is activated only after a successful initial online visit, and browser caching can be cleared.
- The examples are general educational prompts, **not professional, legal, medical, or official guidance**.

## Attribution, originality and license

This implementation and the custom visual design were created from scratch specifically for CodeSprint on 29 October 2026, with AI-assisted programming. Browser standard APIs are used. No third-party fonts, libraries, images, APIs, or datasets are bundled. The starter guide text is original project content. See `LICENSE` for the MIT license.

## Planned next steps

Community translation contributions, guide-level review metadata, improved assistive-tech usability testing, and safe export to printable PDF.

## Responsible participation

Devpost requires **student participants and a team of 2–5 people**, with every team member listed. The project should not be represented as an eligible final submission until those requirements are met. The current Devpost submission calendar ends on **30 October 2026, 17:00 IST**; the written rules conflict by referencing 15 November. The earlier date is safest.