# CommonGround — different tastes, one great plan

**A fairness-first, Qloo-powered cultural discovery agent.** Created for the Qloo Agentic Hackathon, October 29, 2026.

Public demonstration: the Vercel project deployment URL.
Devpost: https://qloo.devpost.com/

## The problem

Discovery engines tend to personalize for **one** person. Joint decisions then collapse into popularity or a single person's preferences. CommonGround treats a shared outing as a two-sided matching problem: two people bring favorites from different cultural domains, and the agent finds recommendations that are credible for both.

## Agent workflow (real Qloo, no invented live results)

1. Accept up to three favorite films, artists, shows, books, or brands for Person A and Person B.
2. **Qloo Entity Search**: query documented \`GET /search\` for each favorite, resolve valid cultural entity IDs, and reject unresolved favorites instead of guessing.
3. **Qloo Insights**: issue three \`GET /v2/insights\` calls using \`signal.interests.entities\`: profile A, profile B, and the union. The requested \`filter.type\` can be movie, artist, book, place, or destination. Optional location filters place/destination requests.
4. **Agent reranking**: compare each candidate's rank in each individual's response and in the joint response; reward minimum-side utility to avoid one-sided compromise. The **balance index is computed by the app**, not a Qloo prediction.
5. Present evidence-based choices with Qloo signal provenance, an explanation panel, a transparent reasoning trail, and the option to copy picks.

This is a deterministic, multi-tool agentic planner: retrieval, resolution, parallel grounded tool calls, deliberative scoring, and final recommendations are orchestrated server-side. The agent does not require an LLM to invent taste or facts.

## Live vs. preview modes

- **LIVE:** Set \`QLOO_API_KEY\` in the Vercel project's server-side environment variables. The app calls \`https://hackathon.api.qloo.com\` with header \`X-Api-Key\`. Neither the key nor upstream raw response is exposed to the browser.
- **PREVIEW:** Without the key, the app displays clearly labeled **fictional sample data**. Preview output **is not Qloo-powered** and must not be represented as working Qloo cultural intelligence. Submit for judging only after validating live Qloo functionality.
- Qloo hackathon keys are requested at https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide#getting-your-api-key

**Important:** The hackathon credentials expire after judging. A deployed URL may later transition to a configuration-dependent state.

## Development

Requires Node 20+ (for native fetch and AbortSignal.timeout). The front end is dependency-free HTML/CSS/JavaScript. The back end is a Vercel Node.js serverless handler.

\`\`\`sh
npm test
npm install -g vercel
vercel dev
\`\`\`

Routes:
- \`GET /api/plan\` returns service status and whether live Qloo credentials are configured.
- \`POST /api/plan\` accepts \`{"alice":"Studio Ghibli, Coldplay","bob":"Beyoncé, Marvel","category":"movie","city":""}\`.

## Ethics and limitations

- No logins, personal profiles, or server-side persistence of interests.
- API data is fetched on the server only. No Qloo response data is included in this public repository.
- Location results are preferences, not open-hours, accessibility, price, or safety guarantees.
- Balance scores are app heuristics based on rankings, **not** calibrated Qloo affinity percentages.
- Qloo API field shapes and key permissions may vary; verify with a real hackathon key before marking live.
- Synthetic preview results are fictional, not factual recommendations.

## Technical stack

Plain HTML, CSS, JavaScript; Vercel Functions (Node.js); Qloo API (\`/search\` and \`/v2/insights\`). No required paid AI service.

## Licensing

The parent public repository includes an Apache License 2.0 at its root. This project is available under that license. No Qloo proprietary datasets are redistributed.

**Author:** Samer Tallauze · https://samertall.com/
