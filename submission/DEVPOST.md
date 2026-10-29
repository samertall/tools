# ProofSkin — Skincare, with reasons

**Elevator pitch:** From a YouCam skin scan to an explainable, budget-aware skincare plan — before you buy.

## What it does
ProofSkin enables a consent-driven selfie upload and connects it to YouCam's Skin Analysis API on the server. The app translates returned cosmetic condition scores into a transparent ranking of skin priorities and a practical skincare-category basket. People can adjust their budget and see which targeted products fit, without opaque sponsored listings. Optional local-only numerical snapshots help users compare observations over time.

## How it's built
Responsive HTML/CSS and vanilla JavaScript; Node.js/Vercel API routes; a YouCam REST v2.0 adapter that uploads photos, starts skin-analysis tasks, polls their status, and normalizes returned scores. A client-side decision engine maps condition-score priorities to ingredient categories and a budget threshold. Automated Node tests check parsing and input validation.

## Challenges and technical limits
The principal technical challenge is coordinating YouCam's multi-stage asynchronous analysis workflow, secure image upload, score normalization, and user-friendly states. We implemented server-side credential protection, payload validation, polling, and descriptive errors. An actual end-to-end YouCam scan has not yet been validated because an API key was unavailable during build. Do not represent the sample data as live output.

## What makes it different
Instead of presenting a single beauty score, ProofSkin turns quantified cosmetic conditions into reasons for what to prioritize, what to skip, and how to stay within a user-selected budget, with ingredient explanations and voluntary progress tracking.

## Impact
People facing confusing skincare marketing can reduce unnecessary purchases by seeing a short essentials-first basket and understanding why each optional category appears. This is a testable product hypothesis, not a measured impact claim.

## What could come next
Verification with actual YouCam results, opt-in retailer catalog and availability integrations, accessible multilingual skin education, a controlled consumer usability study, and longitudinal consent controls.

## Devpost custom-question draft responses
Submitter type: Individual
Country of residence: Jordan
App status: New

API surprise: The YouCam task-based flow encourages designing for asynchronous results and clear intermediate progress states; handling this reliably is a meaningful part of the experience. Live API execution has not yet been completed, so I cannot claim a runtime surprise.

Underserved industries: Affordable personal-care retail, community pharmacies, accessibility-focused shopping tools, and low-bandwidth multilingual education could benefit from clear non-diagnostic skin insights tied to transparent product-category decisions.

Technical wall: Building a safe handoff from image upload to signed URL and asynchronous analysis task, then correctly interpreting returned score objects. I separated provider integration into a server-only adapter, added format validation and polling, and used explicitly labeled sample mode for UI testing when credentials were unavailable.
