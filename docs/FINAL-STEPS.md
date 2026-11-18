# Final steps — Aevum testnet deployment and DoraHacks submission

**Project:** MandatePay — Give agents a budget, not a blank check.  
**Public source:** https://github.com/samertall/tools/tree/mandatepay-aevum-2026  
**Public UI:** https://mandatepay-aevum.vercel.app  
**CI:** https://github.com/samertall/tools/actions/runs/44312392695 (passed)  
**Contest deadline:** 11 Dec 2026, 08:00 UTC / 11:00 Amman.

## Important: use testnet-only wallets and test funds
Never share a seed phrase or private key in chat, GitHub, DoraHacks, or the UI. Do not use a valuable wallet. The official chain is 44005, native gas is tQDAY, and the test ERC-20 is tUSD8 with **6 decimals**, token `0x456569838f1d43009A91ebA4263147Afd7233483`.

## Step 1 — Fund test accounts
1. Open https://qday.io/builder-challenge and use **Add QDay Aevum** to add the network to MetaMask.
2. Make a disposable **Owner** wallet and a distinct **Agent** wallet (the Merchant may be another address).
3. Open the official faucet at https://faucet.qday.info/en. Claim **tQDAY gas** for both Owner and Agent, and **tUSD8** for Owner. Complete any site verification yourself. Do not try to bypass CAPTCHA or wallet verification.
4. Confirm the chain ID **44005** before any signature.

## Step 2 — Deploy the real MandatePay smart contract
**Option A: no local installation (Remix)**

1. Open https://remix.ethereum.org/#url=https://github.com/samertall/tools/blob/mandatepay-aevum-2026/contracts/MandatePay.sol .
2. Open Solidity Compiler, select **0.8.24** and enable **optimization, 200 runs**. Compile `MandatePay.sol`.
3. Open Deploy & Run, select **Injected Provider - MetaMask** (or equivalent injected wallet option). The connected wallet must display **QDay Aevum Testnet, chain 44005**.
4. Select **MandatePay** (not the interface). For its constructor `tokenAddress`, paste **`0x456569838f1d43009A91ebA4263147Afd7233483`**.
5. Click **Deploy** and approve the gas transaction with your test-only Owner wallet. Once confirmed, copy the new **contract address** and **deployment transaction hash**. Confirm in https://explorer-test.qday.info .
6. Verify the source on the Aevum explorer using compiler **0.8.24**, optimizer **enabled, 200 runs**, and the constructor arguments matching your deployment. Do not claim verified status until the explorer confirms it.

**Option B: local Hardhat**

```bash
npm install
npm run compile
npm test
cp .env.example .env
# In your local .env ONLY, set DEPLOYER_PRIVATE_KEY for a disposable test-wallet.
npm run deploy:aevum
```

Never upload your local `.env`. The script checks that the active chain is 44005 and that the official tUSD8 contract has code.

## Step 3 — Execute a real payment using the hosted UI
1. Open https://mandatepay-aevum.vercel.app with MetaMask installed.
2. Connect the **Owner** wallet. Paste your deployed contract address into the contract setup field and validate it. It must return official token `tUSD8`.
3. Set **Deposit amount** no higher than your faucet token balance (example: **5** tUSD8). Approve exact tUSD8 allowance, then confirm Deposit. Save transaction hashes.
4. Set **Approved Merchant** to a separate Merchant wallet and approve that address.
5. Set **Agent** to your distinct funded Agent wallet. Example policy for a 5 tUSD8 test vault: max per payment **1**, UTC daily cap **3**, lifetime budget **5**, expiry **24 hours**. Confirm mandate.
6. Switch MetaMask to Agent, reconnect UI, set **Owner address** to the original Owner, set Merchant address, amount **0.5**, invoice **INV-001**. Click **Check policy**: code **0** means eligible. Click **Execute payment** and sign with Agent.
7. Confirm real merchant token balance increase and `InvoiceSettled` event on https://explorer-test.qday.info. Save the successful payment hash.
8. Recheck `INV-001`: duplicate blocked. Try amount **1.5**: max-payment limit blocked. Switch back to Owner and **Revoke**. Recheck a new invoice with Agent: inactive mandate blocked. Owner can withdraw unused tUSD8.
9. Save explorer URLs, screenshots, and the real hashes. Never replace them with sample hashes or simulated local activity.

## Step 4 — Submit on DoraHacks
Visit https://dorahacks.io/hackathon/qday/detail , sign in, and open the submission form. Paste the title and description from `docs/SUBMISSION.md` and include:
- Public source: https://github.com/samertall/tools/tree/mandatepay-aevum-2026
- Hosted UI: https://mandatepay-aevum.vercel.app
- Deployed Aevum contract address and deployment hash
- Agent settlement transaction hash
- Verified source explorer URL
- Brief recording or well-structured demo walkthrough if the portal requests one

**Status warning:** Passing unit tests and hosting a UI do not substitute for a genuine Aevum testnet settlement. The DoraHacks entry is not considered submitted unless the portal confirms success.

### Investor/judges disclosure
MandatePay is an unaudited hackathon prototype for test tokens only. This first version uses a human-controlled ERC-20 vault and a dedicated limited-permission agent EOA, not deployed QDay smart accounts, ERC-8004 identity or post-quantum signing.
