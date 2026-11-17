# AccessRelay — Open Accessibility Agent Network

Open-source browser-native accessibility issue coordination, developed for the 2026–27 Open Agentic Web Challenge.

## Demonstrated capabilities
- Functional responsive WCAG demo issue board with localStorage, severity filters, create/reopen/resolve actions.
- Portable Neuro SAN-style three-agent JSON graph and discoverable public agent manifest.
- JavaScript browser runtime validates agent graphs and performs real model delegation/tool calling using a user-provided OpenAI-compatible CORS-enabled endpoint (BYOK).
- Local tools are schema-validated, writes require human confirmation and execution is bounded/logged.
- Consensual peer network discovery fetches public JSON without credentials or cookies; imported agents execute in the caller browser with no local actions or caller data.
- Free guided demo is deterministic logic, not LLM inference. Demo board data is fictional.

## Run locally
Serve this folder with python -m http.server 8080 and open http://localhost:8080. No build or dependencies.

## Public files
agent-manifest.json; accessrelay.network.json; links.json; runtime/engine.js; app.js; index.html; vercel.json.

## Using live AI
In the AI Provider panel switch to Live, enter a CORS-enabled OpenAI-compatible API base URL, tool-capable model and your key, then apply. The configured provider receives prompts and board data; never enter confidential findings. Key is in memory only. Mozilla Otari is a suggested endpoint, not a claim of successful authenticated integration testing.

## Security and honest limitations
Local demo findings are fabricated, no real site auditing or automated WCAG testing occurs. Imported peer agents cannot execute caller actions. Public peer metadata must be CORS-accessible. Inference uses nonstreaming chat completions; a generic MCP client is not implemented. Therefore full MVP 0.2 interoperability/conformance (including streaming and MCP) is not yet independently verified. No external system is updated and no real-world business outcome is claimed.

## Demo video outline
In under two minutes, show a backlog summary, a WCAG fix suggestion, Resolve A11Y-101 and its consent prompt, the published manifest and runtime, then settings and external peer consent. The challenge requires the entrant explaining the project in their own voice, not AI narration.

## License
MIT. Copyright (c) 2026 Samer Tallauze.
