export const contractAbi = [
  "function token() view returns (address)",
  "function vaultBalances(address) view returns (uint256)",
  "function approvedPayees(address,address) view returns (bool)",
  "function paidInvoices(address,bytes32) view returns (bool)",
  "function mandates(address) view returns (address agent,uint64 expiresAt,uint256 maxPerPayment,uint256 dailyLimit,uint256 totalBudget,uint256 totalSpent,uint256 spentToday,uint256 windowDay,bool active)",
  "function checkPayment(address owner,address agent,address payee,uint256 amount,bytes32 invoiceId) view returns (uint8)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function setPayee(address payee,bool approved)",
  "function setMandate(address agent,uint256 maxPerPayment,uint256 dailyLimit,uint256 totalBudget,uint64 expiresAt)",
  "function revokeMandate()",
  "function pay(address owner,address payee,uint256 amount,bytes32 invoiceId)",
  "event InvoiceSettled(address indexed owner,address indexed payee,bytes32 indexed invoiceId,address agent,uint256 amount)",
  "event VaultFunded(address indexed owner,uint256 amount)",
  "event VaultWithdrawn(address indexed owner,uint256 amount)"
];
export const tokenAbi = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];
export const policyMessages = [
  "Payment passes every on-chain guardrail.",
  "No active mandate. The owner must create one.",
  "Connected wallet is not the authorized agent.",
  "Mandate has expired. Ask the owner to renew it.",
  "This merchant is not on the owner's allowlist.",
  "Enter a valid amount and unique invoice reference.",
  "Amount exceeds the per-payment maximum.",
  "Payment would exceed the daily allowance.",
  "Payment would exceed the total mandate budget.",
  "The vault needs more test tUSD8 funding.",
  "This invoice has already been paid."
];
