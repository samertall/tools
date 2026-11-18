// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MandatePay — revocable, policy-limited delegated tUSD8 settlement
/// @notice Hackathon testnet prototype. Independent security audit required for production.
interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract MandatePay {
    error InvalidAddress();
    error InvalidAmount();
    error InvalidPolicy();
    error TokenCallFailed();
    error Reentrancy();
    error PolicyViolation(uint8 reason);
    error InsufficientVaultBalance();

    uint8 public constant OK = 0;
    uint8 public constant NO_ACTIVE_MANDATE = 1;
    uint8 public constant WRONG_AGENT = 2;
    uint8 public constant EXPIRED = 3;
    uint8 public constant UNAPPROVED_PAYEE = 4;
    uint8 public constant INVALID_PAYMENT = 5;
    uint8 public constant PER_PAYMENT_LIMIT = 6;
    uint8 public constant DAILY_LIMIT = 7;
    uint8 public constant BUDGET_EXHAUSTED = 8;
    uint8 public constant INSUFFICIENT_FUNDS = 9;
    uint8 public constant INVOICE_ALREADY_PAID = 10;

    IERC20Minimal public immutable token;
    uint256 private _unlocked = 1;

    struct Mandate {
        address agent;
        uint64 expiresAt;
        uint256 maxPerPayment;
        uint256 dailyLimit;
        uint256 totalBudget;
        uint256 totalSpent;
        uint256 spentToday;
        uint256 windowDay;
        bool active;
    }

    mapping(address => uint256) public vaultBalances;
    mapping(address => Mandate) public mandates;
    mapping(address => mapping(address => bool)) public approvedPayees;
    mapping(address => mapping(bytes32 => bool)) public paidInvoices;

    event VaultFunded(address indexed owner, uint256 amount);
    event VaultWithdrawn(address indexed owner, uint256 amount);
    event PayeeUpdated(address indexed owner, address indexed payee, bool approved);
    event MandateConfigured(address indexed owner, address indexed agent, uint256 maxPerPayment, uint256 dailyLimit, uint256 totalBudget, uint64 expiresAt);
    event MandateRevoked(address indexed owner, address indexed agent);
    event InvoiceSettled(address indexed owner, address indexed payee, bytes32 indexed invoiceId, address agent, uint256 amount);

    modifier nonReentrant() {
        if (_unlocked != 1) revert Reentrancy();
        _unlocked = 2;
        _;
        _unlocked = 1;
    }

    constructor(address tokenAddress) {
        if (tokenAddress == address(0) || tokenAddress.code.length == 0) revert InvalidAddress();
        token = IERC20Minimal(tokenAddress);
    }

    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        uint256 beforeBalance = token.balanceOf(address(this));
        _safeTransferFrom(msg.sender, address(this), amount);
        if (token.balanceOf(address(this)) != beforeBalance + amount) revert TokenCallFailed();
        vaultBalances[msg.sender] += amount;
        emit VaultFunded(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (amount > vaultBalances[msg.sender]) revert InsufficientVaultBalance();
        vaultBalances[msg.sender] -= amount;
        _safeTransfer(msg.sender, amount);
        emit VaultWithdrawn(msg.sender, amount);
    }

    function setPayee(address payee, bool approved) external {
        if (payee == address(0) || payee == address(this)) revert InvalidAddress();
        approvedPayees[msg.sender][payee] = approved;
        emit PayeeUpdated(msg.sender, payee, approved);
    }

    /// @notice Replaces the previous mandate; only the owner can do so.
    /// @dev Values use tUSD8's base units (6 decimals). Resets counters for a new mandate.
    function setMandate(
        address agent,
        uint256 maxPerPayment,
        uint256 dailyLimit,
        uint256 totalBudget,
        uint64 expiresAt
    ) external {
        if (agent == address(0) || agent == address(this)) revert InvalidAddress();
        if (
            maxPerPayment == 0 || dailyLimit < maxPerPayment || totalBudget < dailyLimit ||
            expiresAt <= block.timestamp
        ) revert InvalidPolicy();

        mandates[msg.sender] = Mandate({
            agent: agent,
            expiresAt: expiresAt,
            maxPerPayment: maxPerPayment,
            dailyLimit: dailyLimit,
            totalBudget: totalBudget,
            totalSpent: 0,
            spentToday: 0,
            windowDay: block.timestamp / 1 days,
            active: true
        });
        emit MandateConfigured(msg.sender, agent, maxPerPayment, dailyLimit, totalBudget, expiresAt);
    }

    function revokeMandate() external {
        address agent = mandates[msg.sender].agent;
        mandates[msg.sender].active = false;
        emit MandateRevoked(msg.sender, agent);
    }

    function checkPayment(
        address owner,
        address candidateAgent,
        address payee,
        uint256 amount,
        bytes32 invoiceId
    ) public view returns (uint8) {
        Mandate memory m = mandates[owner];
        if (!m.active) return NO_ACTIVE_MANDATE;
        if (candidateAgent != m.agent) return WRONG_AGENT;
        if (block.timestamp >= m.expiresAt) return EXPIRED;
        if (!approvedPayees[owner][payee]) return UNAPPROVED_PAYEE;
        if (amount == 0 || invoiceId == bytes32(0)) return INVALID_PAYMENT;
        if (amount > m.maxPerPayment) return PER_PAYMENT_LIMIT;
        uint256 usedToday = m.windowDay == block.timestamp / 1 days ? m.spentToday : 0;
        if (amount > m.dailyLimit - usedToday) return DAILY_LIMIT;
        if (amount > m.totalBudget - m.totalSpent) return BUDGET_EXHAUSTED;
        if (amount > vaultBalances[owner]) return INSUFFICIENT_FUNDS;
        if (paidInvoices[owner][invoiceId]) return INVOICE_ALREADY_PAID;
        return OK;
    }

    function pay(address owner, address payee, uint256 amount, bytes32 invoiceId) external nonReentrant {
        uint8 reason = checkPayment(owner, msg.sender, payee, amount, invoiceId);
        if (reason != OK) revert PolicyViolation(reason);
        Mandate storage m = mandates[owner];
        uint256 dayNumber = block.timestamp / 1 days;
        if (m.windowDay != dayNumber) {
            m.windowDay = dayNumber;
            m.spentToday = 0;
        }
        m.spentToday += amount;
        m.totalSpent += amount;
        vaultBalances[owner] -= amount;
        paidInvoices[owner][invoiceId] = true;
        _safeTransfer(payee, amount);
        emit InvoiceSettled(owner, payee, invoiceId, msg.sender, amount);
    }

    function _safeTransfer(address to, uint256 amount) private {
        (bool success, bytes memory response) = address(token).call(
            abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount)
        );
        if (!success || (response.length != 0 && !abi.decode(response, (bool)))) revert TokenCallFailed();
    }

    function _safeTransferFrom(address from, address to, uint256 amount) private {
        (bool success, bytes memory response) = address(token).call(
            abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount)
        );
        if (!success || (response.length != 0 && !abi.decode(response, (bool)))) revert TokenCallFailed();
    }
}
