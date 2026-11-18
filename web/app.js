import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@6.13.4/+esm';
import { contractAbi, tokenAbi, policyMessages } from './abi.js';

const CONFIG = window.MANDATEPAY_CONFIG;
const $ = id => document.getElementById(id);
const state = { provider: null, signer: null, wallet: '', contract: '', busy: false, recent: [] };
const TOKEN_DECIMALS = 6;
const ADD_CHAIN = {
  chainId: '0xABE5', chainName: 'QDay Aevum Testnet',
  nativeCurrency: { name: 'Test QDAY', symbol: 'tQDAY', decimals: 18 },
  rpcUrls: [CONFIG.rpcUrl], blockExplorerUrls: [CONFIG.explorerUrl]
};

function inform(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.hidden = false;
  clearTimeout(inform.timeoutId);
  inform.timeoutId = setTimeout(() => { toast.hidden = true; }, 8000);
}
function errMessage(error) {
  if (error?.code === 4001 || error?.info?.error?.code === 4001 || error?.code === 'ACTION_REJECTED') return 'Wallet request was declined. No transaction was submitted.';
  if (error?.code === -32002) return 'A wallet approval window is already open.';
  const msg = String(error?.shortMessage || error?.reason || error?.message || error);
  if (/insufficient funds/i.test(msg)) return 'Insufficient tQDAY gas or test tUSD8 balance. Use the official faucet.';
  if (/user rejected|denied transaction/i.test(msg)) return 'Wallet request declined.';
  return msg.slice(0, 280);
}
function requiredAddress(id) {
  const value = $(id).value.trim();
  if (!ethers.isAddress(value)) throw new Error(`Enter a valid 0x wallet address in “${id}”.`);
  return ethers.getAddress(value);
}
function amount(id) {
  const value = $(id).value.trim();
  if (!/^(?:\d+)(?:\.\d{1,6})?$/.test(value)) throw new Error('Enter a positive amount with at most 6 decimal places.');
  const parsed = ethers.parseUnits(value, TOKEN_DECIMALS);
  if (parsed <= 0n) throw new Error('Amount must be greater than zero.');
  return parsed;
}
function shortAddress(address) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }
function formatToken(value) { return Number(ethers.formatUnits(value, TOKEN_DECIMALS)).toLocaleString(undefined, {maximumFractionDigits: 6}); }
function contract(readOnly = false) {
  if (!state.contract || !ethers.isAddress(state.contract)) throw new Error('Set a deployed MandatePay contract address first.');
  if (!state.provider) throw new Error('Connect a wallet before interacting with Aevum.');
  return new ethers.Contract(state.contract, contractAbi, readOnly ? state.provider : state.signer);
}
function token() { return new ethers.Contract(CONFIG.tokenAddress, tokenAbi, state.signer); }
function setBusy(busy) {
  state.busy = busy;
  document.querySelectorAll('button').forEach(button => { if (button.id !== 'connectBtn') button.disabled = busy; });
}
async function ensureChain() {
  if (!window.ethereum) throw new Error('Install a wallet supporting MetaMask-compatible EIP-1193 connections.');
  const current = await window.ethereum.request({ method: 'eth_chainId' });
  if (BigInt(current) === BigInt(CONFIG.chainId)) return;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ADD_CHAIN.chainId }] });
  } catch (e) {
    if (e.code !== 4902) throw e;
    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [ADD_CHAIN] });
  }
  const confirmed = await window.ethereum.request({ method: 'eth_chainId' });
  if (BigInt(confirmed) !== BigInt(CONFIG.chainId)) throw new Error('Switch to Aevum Testnet, chain 44005.');
}
async function connect() {
  await ensureChain();
  state.provider = new ethers.BrowserProvider(window.ethereum);
  await state.provider.send('eth_requestAccounts', []);
  state.signer = await state.provider.getSigner();
  state.wallet = await state.signer.getAddress();
  $('connectBtn').innerHTML = `${shortAddress(state.wallet)} <span>↗</span>`;
  if (!$('ownerAddress').value) $('ownerAddress').value = state.wallet;
  inform(`Connected ${shortAddress(state.wallet)} on Aevum Testnet.`);
  await validateContract();
  await refresh();
}
async function validateContract() {
  state.contract = (localStorage.getItem('mandatepay.contract') || CONFIG.contractAddress || '').trim();
  $('contractAddress').value = state.contract;
  $('setupNotice').hidden = false;
  if (!state.contract) { $('contractInfo').textContent = 'No contract configured; use the deployment script, then paste its address.'; return false; }
  if (!ethers.isAddress(state.contract)) { $('contractInfo').textContent = 'Address is not a valid Ethereum contract address.'; return false; }
  if (!state.provider) { $('contractInfo').textContent = 'Connect your wallet to validate this address against Aevum.'; return false; }
  const bytecode = await state.provider.getCode(state.contract);
  if (bytecode === '0x') { $('contractInfo').textContent = 'No deployed code exists at that address on Aevum.'; return false; }
  try {
    const onChainToken = await contract(true).token();
    if (onChainToken.toLowerCase() !== CONFIG.tokenAddress.toLowerCase()) throw new Error('Unexpected token configured.');
  } catch (error) { $('contractInfo').textContent = `Contract verification failed: ${errMessage(error)}`; return false; }
  $('setupNotice').hidden = true;
  return true;
}
async function refresh() {
  if (!state.wallet || !state.provider) return;
  if (!await validateContract()) return;
  const c = contract(true);
  const [balance, mandate] = await Promise.all([c.vaultBalances(state.wallet), c.mandates(state.wallet)]);
  $('vaultAmount').textContent = formatToken(balance);
  $('spentAmount').textContent = formatToken(mandate.totalSpent);
  $('budgetAmount').textContent = formatToken(mandate.totalBudget);
  const now = Math.floor(Date.now() / 1000);
  const active = mandate.active && Number(mandate.expiresAt) > now;
  $('mandateStatus').textContent = active ? 'Active' : mandate.active ? 'Expired' : 'Inactive';
  $('mandateStatus').style.color = active ? '#7df2c4' : '#b6a2ff';
  $('mandateExpiry').textContent = Number(mandate.expiresAt) > 0 ? `Expires ${new Date(Number(mandate.expiresAt) * 1000).toLocaleString()}` : 'No mandate configured';
  if (mandate.agent !== ethers.ZeroAddress) $('agentAddress').value = mandate.agent;
}
async function execute(action, fn) {
  if (state.busy) return;
  try {
    setBusy(true);
    if (!state.wallet) throw new Error('Connect your wallet first.');
    await ensureChain();
    if (!await validateContract()) throw new Error('Contract verification is required before submitting a transaction.');
    const result = await fn();
    if (result) inform(`${action} confirmed on Aevum.`);
    await refresh();
  } catch (error) { inform(errMessage(error), true); }
  finally { setBusy(false); }
}
async function confirmed(tx, label) {
  inform(`${label}: transaction ${shortAddress(tx.hash)} submitted. Waiting for on-chain confirmation…`);
  const receipt = await tx.wait(1);
  if (!receipt || Number(receipt.status) !== 1) throw new Error('The transaction reverted. No successful payment was recorded.');
  state.recent.unshift({ hash: receipt.hash, label, block: receipt.blockNumber, date: new Date().toLocaleTimeString() });
  renderActivity();
  return receipt;
}
function renderActivity() {
  const list = $('activityList');
  list.replaceChildren();
  if (!state.recent.length) { list.innerHTML = '<div class="empty-state"><span>◎</span>No confirmed transactions in this session.</div>'; return; }
  for (const tx of state.recent) {
    const row = document.createElement('div'); row.className = 'tx-item';
    const summary = document.createElement('div'); const title = document.createElement('strong'); title.textContent = `✓ ${tx.label}`;
    const info = document.createElement('small'); info.textContent = `Block ${tx.block} · ${tx.date} · ${shortAddress(tx.hash)}`;
    const link = document.createElement('a'); link.href = `${CONFIG.explorerUrl}/tx/${encodeURIComponent(tx.hash)}`; link.textContent = 'View on explorer ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    summary.append(title, info); row.append(summary, link); list.append(row);
  }
}
async function deposit(e) {
  e.preventDefault();
  await execute('Vault funding', async () => {
    const n = amount('depositAmount'); const t = token();
    const allowance = await t.allowance(state.wallet, state.contract);
    if (allowance < n) await confirmed(await t.approve(state.contract, n), 'Approved exact token allowance');
    await confirmed(await contract().deposit(n), `Deposited ${formatToken(n)} tUSD8`); return true;
  });
}
async function withdraw(e) {
  e.preventDefault();
  await execute('Withdrawal', async () => { const n = amount('withdrawAmount'); await confirmed(await contract().withdraw(n), `Withdrew ${formatToken(n)} tUSD8`); return true; });
}
async function configurePayee(approved) {
  await execute(approved ? 'Merchant approved' : 'Merchant removed', async () => {
    const address = requiredAddress('payeeAddress');
    await confirmed(await contract().setPayee(address, approved), `${approved ? 'Allowed' : 'Removed'} merchant ${shortAddress(address)}`);
    if (approved) $('paymentPayee').value = address;
    return true;
  });
}
async function configureMandate(e) {
  e.preventDefault();
  await execute('Agent mandate', async () => {
    const agent = requiredAddress('agentAddress');
    const single = amount('maxAmount'), daily = amount('dailyAmount'), total = amount('budgetTotal');
    const hours = Number($('expiresHours').value);
    if (!Number.isInteger(hours) || hours < 1 || hours > 8760) throw new Error('Expiry must be between 1 and 8,760 hours.');
    if (!(single <= daily && daily <= total)) throw new Error('Per-payment cap must be ≤ daily cap, and daily cap must be ≤ total budget.');
    const latest = await state.provider.getBlock('latest');
    const expiresAt = Number(latest.timestamp) + hours * 3600;
    await confirmed(await contract().setMandate(agent, single, daily, total, expiresAt), 'Configured bounded agent mandate');
    return true;
  });
}
async function checkPolicy() {
  const owner = requiredAddress('ownerAddress');
  const payee = requiredAddress('paymentPayee');
  const n = amount('paymentAmount');
  const reference = $('invoiceId').value.trim();
  if (!reference) throw new Error('Invoice reference is required.');
  const invoiceHash = ethers.id(reference);
  const reason = Number(await contract(true).checkPayment(owner, state.wallet, payee, n, invoiceHash));
  const result = $('policyResult');
  result.textContent = `${reason === 0 ? '✓' : '⊘'} ${policyMessages[reason] || `Unknown policy code ${reason}`}`;
  result.className = `policy-result ${reason === 0 ? 'ok' : 'bad'}`;
  return { owner, payee, n, invoiceHash, reason };
}
async function preflight() {
  try {
    if (!state.wallet || !await validateContract()) throw new Error('Connect wallet and configure a deployed contract first.');
    await checkPolicy();
  } catch (e) { inform(errMessage(e), true); }
}
async function settle(e) {
  e.preventDefault();
  await execute('Invoice payment', async () => {
    const p = await checkPolicy();
    if (p.reason !== 0) throw new Error(policyMessages[p.reason]);
    await confirmed(await contract().pay(p.owner, p.payee, p.n, p.invoiceHash), `Settled ${formatToken(p.n)} tUSD8 invoice`);
    return true;
  });
}
async function useAddress() {
  try {
    const value = $('contractAddress').value.trim();
    if (!ethers.isAddress(value)) throw new Error('Please enter a valid contract address.');
    localStorage.setItem('mandatepay.contract', ethers.getAddress(value));
    if (await validateContract()) { inform('Deployed contract validated against official tUSD8.'); await refresh(); }
    else inform('Address saved locally; connect your wallet to validate the on-chain contract.', true);
  } catch (e) { inform(errMessage(e), true); }
}
$('connectBtn').addEventListener('click', async () => { try { await connect(); } catch (e) { inform(errMessage(e), true); } });
$('refreshBtn').addEventListener('click', async () => { try { await refresh(); inform('Read latest on-chain state.'); } catch(e) { inform(errMessage(e), true); } });
$('useAddressBtn').addEventListener('click', useAddress);
$('depositForm').addEventListener('submit', deposit);
$('withdrawForm').addEventListener('submit', withdraw);
$('payeeForm').addEventListener('submit', e => { e.preventDefault(); configurePayee(true); });
$('removePayeeBtn').addEventListener('click', () => configurePayee(false));
$('mandateForm').addEventListener('submit', configureMandate);
$('revokeBtn').addEventListener('click', () => execute('Mandate revoked', async () => { await confirmed(await contract().revokeMandate(), 'Revoked agent authority'); return true; }));
$('payForm').addEventListener('submit', settle);
$('preflightBtn').addEventListener('click', preflight);
$('contractAddress').value = localStorage.getItem('mandatepay.contract') || CONFIG.contractAddress || '';
$('contractInfo').textContent = 'Only connect to a contract deployed by you or a trusted team member.';
if (window.ethereum?.on) {
  window.ethereum.on('accountsChanged', () => { state.wallet = ''; state.provider = null; state.signer = null; $('connectBtn').textContent = 'Reconnect wallet ↗'; inform('Wallet account changed. Reconnect to confirm your role and balances.'); });
  window.ethereum.on('chainChanged', () => { state.wallet = ''; state.provider = null; state.signer = null; $('connectBtn').textContent = 'Reconnect wallet ↗'; inform('Network changed. Reconnect on Aevum Testnet.'); });
}
