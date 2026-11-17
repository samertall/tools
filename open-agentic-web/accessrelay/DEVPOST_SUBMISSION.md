# AccessRelay — Devpost submission materials

## Project name
AccessRelay — The Open Accessibility Agent Network

## Tagline
An open, browser-native agent network that turns accessibility findings into actionable, user-approved remediation.

## Inspiration
Digital accessibility findings often fall between design reviews, development tickets, and final QA. Product teams need a transparent way to prioritize user impact and move from an issue to a testable fix. AccessRelay explores how open, portable web agents can help without putting decisions behind opaque vendor-controlled systems.

## What it does
AccessRelay is a responsive accessibility remediation workspace with an interactive issue board and a public, declarative three-agent network. The coordinator guides the request and delegates specialist reasoning to a Priority Analyst or Remediation Expert. The runtime can read the current demo board, propose issue-status updates, or create new sample findings. Every write is validated and requires explicit human confirmation; actions leave traceable receipts.

The site publishes `agent-manifest.json`, a Neuro SAN-style resolved `accessrelay.network.json`, and an inspectable JavaScript browser runtime. Users can optionally select an OpenAI-compatible model and bring their own key. The peer importer obtains permission before fetching another site's public manifest and network, then can run that peer's agents locally using the caller's model configuration, without exposing the caller's key or local issue state.

A separate deterministic guided demo allows anyone to explore the issue workflow with no key or paid account. It is clearly marked as a non-LLM demo.

## How we built it
HTML, CSS, and vanilla JavaScript ES modules; JSON network publication; static HTTPS hosting on Vercel; GitHub for open-source distribution; browser-local storage for fictional issue data; OpenAI-compatible BYOK browser inference, schema-checked local actions, and consent-gated peer JSON import.

## Challenges
Designing clear consent boundaries for origin requests and site writes, preventing raw peer instructions from executing as code, keeping keys out of published artifacts, and explaining the difference between deterministic demonstrations and genuine LLM-driven agent execution.

## Accomplishments
A three-agent graph and public manifest, responsive accessible UI, actual board state and local update receipts, browser-based model/tool orchestration, consent-before-fetch peer inspection, and a no-key guided demonstration.

## What we learned
Agent interoperability requires a portable data model and a visible trust boundary—not merely an AI chat interface. A user-controlled runtime can make model selection, permissions, and actions more understandable.

## What's next
Add generic browser MCP support, model streaming, automated spec-conformance tests, and a fully tested independent cross-origin peer demonstration. Connect consenting teams to real accessibility audit results and issue trackers, add WCAG mapping and change-verification evidence.

## Links
Live demo: https://accessrelay-open-agentic-web.vercel.app/
Open-source code: https://github.com/samertall/tools/tree/main/open-agentic-web/accessrelay/
Manifest: https://accessrelay-open-agentic-web.vercel.app/agent-manifest.json
Network: https://accessrelay-open-agentic-web.vercel.app/accessrelay.network.json
Runtime: https://accessrelay-open-agentic-web.vercel.app/runtime/engine.js

## Video script outline — presenter must speak in their own voice
0:00–0:18 — “This is AccessRelay. Accessibility issues often get lost between designers, engineers and testers. We built an open agentic workspace that coordinates the steps from finding to remediation.”
0:18–0:40 — Show sample backlog and say: “This board contains fictional WCAG findings. I can ask for a priority summary, and the guided demo displays recommendations without an API key.”
0:40–1:02 — Ask how to fix A11Y-101 and say: “The remediation workflow provides concrete accessibility guidance and suggested verification steps.”
1:02–1:23 — Ask to resolve A11Y-101, show confirmation and board change. “A write cannot happen without review and a receipt.”
1:23–1:42 — Open the manifest/network files. “Our agent graph is public JSON, and the runtime executes in the browser. Live LLM inference is available through a visitor-selected provider.”
1:42–1:55 — Show peer importer. “The importer requests consent before accessing a second origin, and its agents run locally without receiving our credentials.”
1:55–1:59 — “AccessRelay helps make the agentic web open, inspectable and human-controlled.”

IMPORTANT: The hackathon rules require real browser footage and the entrant's own spoken explanation—not AI-generated narration. Do not claim untested cross-origin interoperability, full specification conformance, streaming or generic MCP functionality.

## Outstanding submission work
- Confirm the live site loads and functions in an incognito browser on desktop/mobile.
- Test live BYOK against a tool-capable model with CORS and verify action invocation.
- Test a real independent peer origin and document origin consent and data isolation.
- Capture 2–4 actual screenshots from the live website.
- Record and publicly upload a video under two minutes featuring the entrant's own spoken explanation.
- Complete Devpost eligibility and submission fields, attach actual screenshot(s) and YouTube video, and finalize submission before January 11, 2027, 16:00 UTC.
