# FounderLens AI — Devpost entry (prepared, not submitted)
## Pitch
An open-weight AI research co-pilot that challenges founder assumptions using supplied evidence, then requires a founder to review, revise or reject each briefing.
## Inspiration
Founders need to separate unverified anecdotes from actionable customer discovery. FounderLens AI surfaces critical questions without automating business decisions.
## What it does
Enter a falsifiable startup hypothesis, customer profile and 1–4 research excerpts. A deterministic ledger records sources S1–S4. Free, on-device SmolLM2 offers exploratory critique. A clearly marked, editable AI draft remains distinct from the original notes. Report export requires an explicit approve/revise/reject decision, written rationale, and a limitations acknowledgement. No automatic communications or external decisions.
## How built
HTML5, CSS3, modern JavaScript, Transformers.js v3.8.1, ONNX Runtime Web, SmolLM2-135M-Instruct-ONNX-MHA quantized q8 (free open-weight CPU inference in browser), Node.js tests, Playwright, GitHub Actions, GitHub, Vercel. No paid runtime APIs or keys.
## Verification
The November 16, 2026 real Chromium [end-to-end test](https://github.com/samertall/tools/actions/runs/43857140743) completed local model inference, enforced mandatory review, and exported an approved report. Seven unit tests passed. A source misattribution failure in the 135M model was observed: the AI output **must be checked**; do not present as verified research. Scripted test approval is not a real founder study.
## Human judgment
The model drafts; the user corrects, challenges and decides. Rejected drafts can also be recorded, and no business action occurs.
## AI Disclosure
Runtime: only an open-weight SmolLM2 model from Hugging Face; free JavaScript/ONNX runtime; one inference per click with a cap of 170 output tokens and variable input tokens. No paid subscriptions or premium credits for runtime. OpenAI ChatGPT GPT-6 assisted code, interface, documentation and testing **during development only**, not inference. [Full statement](https://github.com/samertall/tools/blob/main/founderlens-ai/docs/ai-disclosure.md).
## Time saved
A synthetic GitHub Actions run took **18.1 seconds from Generate click to model output, including initialization** and excluding human review/export. The UI's 30-minute default for manual research is **illustrative only**. A hypothetical 30-minute manual task vs 8-minute assisted human work plus 0.3 minutes AI would imply about **21.7 minutes** saved, but this is an unvalidated scenario, NOT a measured result. A paired participant study is needed. [Methodology](https://github.com/samertall/tools/blob/main/founderlens-ai/docs/time-saved.md).
## Responsible AI
User-provided data stays in local browser memory; Hugging Face/jsDelivr model/runtime downloads still expose normal request metadata. The system does not verify URLs. Biased notes or small-model hallucination and misattribution can lead to false claims. Errors or weak inference require human correction. [Full disclosure](https://github.com/samertall/tools/blob/main/founderlens-ai/docs/responsible-ai.md).
## Architecture
[Diagram](https://github.com/samertall/tools/blob/main/founderlens-ai/docs/architecture.svg) · [Details](https://github.com/samertall/tools/blob/main/founderlens-ai/docs/architecture.md)
## Source and live test
- https://github.com/samertall/tools/tree/main/founderlens-ai
- https://founderlens-ai-hetic-2026.vercel.app
## Actual demo video
A real-browser 83-second MP4 was created from an uncut recorded model test plus screenshots. It shows a **scripted** checkpoint, is not a human participant study, and has not yet been uploaded to YouTube or Vimeo. The older https://youtu.be/Y-k95RwgRkc is only a concept trailer.
## Team
**NOT VERIFIED.** Rules require 2–4 consenting higher-education students, including all named collaborators. No teammate may be represented as joined without confirmed acceptance.
## Status
Ready for review; **NOT submitted**. Do not certify complete eligibility until Devpost team verification and a public YouTube/Vimeo real-run video URL are in place.
