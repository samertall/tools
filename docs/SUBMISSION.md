# DoraHacks — Aevum Builder Challenge #1

## Project title
MandatePay — Give Agents a Budget, Not a Blank Check

## Tagline
Revocable on-chain spending mandates for AI agents, with approved merchants, hard tUSD8 spending limits and instant human override.

## Problem
Autonomous software can already request payments, but telling an agent to "spend responsibly" is not a security boundary. Prompt injection, duplicate invoice retries or compromised keys can cause unintended payouts.

## Solution
MandatePay makes payment authorization enforceable on-chain. An owner deposits official tUSD8 in a self-custodial payment vault, authorizes a dedicated EVM agent wallet, allowlists merchants, and defines per-payment, per-UTC-day and lifetime spending limits with an expiry. The agent uses a read-only preflight and then executes eligible invoices, with all checks enforced again atomically by Solidity. Owners can revoke and reclaim remaining funds at any time.

## Business workflow
1. Connect owner wallet to QDay Aevum Testnet (chain 44005).
2. Approve and deposit test tUSD8 into the owner-specific vault.
3. Allowlist merchant and set a scoped agent mandate.
4. Switch to the agent wallet; preflight and settle a unique invoice.
5. Inspect the token transfer and InvoiceSettled event on the explorer.
6. Demonstrate duplicate-invoice prevention, over-cap rejection, revocation and withdrawal.

## Why it is useful
Merchant API purchases, digital-service billing, controlled AI procurement and other cases where automatic payments need a bounded delegated authority. The core contract is MIT licensed and reusable by other ecosystem builders. Monetization via hosted audit and multi-approval integrations is a hypothesis, not proven revenue.

## Technical architecture
Browser UI (responsive HTML/CSS/JS, Ethers v6, MetaMask) -> MandatePay Solidity 0.8.24 -> QDay Aevum Testnet 44005 -> official tUSD8 ERC-20. Hardhat handles tests and deployment; GitHub Actions runs contract CI.

## Public URLs
GitHub source (dedicated public branch): https://github.com/samertall/tools/tree/mandatepay-aevum-2026
Hosted frontend: https://mandatepay-aevum.vercel.app
QDay network: https://qday.io/builder-challenge
Deployed contract: NOT YET AVAILABLE
Verified contract source: NOT YET AVAILABLE
Confirmed tUSD8 settlement transaction: NOT YET AVAILABLE

## Reproduce
Read README.md. Never place a private key or seed phrase in the browser, GitHub, the hackathon portal, or a shared chat. Set DEPLOYER_PRIVATE_KEY only in local .env on a dedicated disposable testnet wallet, obtain faucet tQDAY and tUSD8, run npm install && npm run compile && npm test && npm run deploy:aevum, then follow the UI flow.

## 3–5 minute finalist demonstration
0:00–0:30 — Agent commerce problem; why prompts do not control spending.
0:30–1:05 — Connect owner, show chain 44005 and approved test tUSD8 token; fund vault.
1:05–1:50 — Allowlist merchant and configure an agent with 5 tUSD8 max transaction, 15 tUSD8 daily, 25 tUSD8 lifetime, 24h expiry.
1:50–2:35 — Agent checks and settles invoice INV-001 for 3 tUSD8. Show real transaction receipt and merchant's balance.
2:35–3:20 — Retry INV-001, try an over-cap invoice, and revoke the mandate.
3:20–4:10 — Show blocked payment after revocation, funds withdrawal, architecture and tests.
4:10–4:40 — Real-world agent procurement use case and ecosystem roadmap.

**Disclosure:** Do not present the steps as a completed on-chain demonstration until real transactions exist. The deployed interface currently requires an Aevum contract address to execute transactions, and no explorer evidence has been produced. This is a hackathon prototype, not an audited or production-ready system.

**Deadline:** December 11, 2026, at 08:00 UTC (11:00 Amman). If selected among top 5, attend the December 15 live finalist call.
