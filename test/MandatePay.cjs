const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MandatePay / test tUSD8 mock", function () {
  let owner, agent, merchant, outsider, token, pay;
  const usd = value => ethers.parseUnits(value, 6);
  const inv = id => ethers.id(id);
  async function mandate({ single = "20", daily = "50", total = "100", ttl = 3600 } = {}) {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await pay.connect(owner).setMandate(agent.address, usd(single), usd(daily), usd(total), now + ttl);
  }
  async function setup() {
    [owner, agent, merchant, outsider] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("MockUSD")).deploy();
    pay = await (await ethers.getContractFactory("MandatePay")).deploy(await token.getAddress());
    await token.mint(owner.address, usd("500"));
    await token.connect(owner).approve(await pay.getAddress(), usd("200"));
    await pay.connect(owner).deposit(usd("100"));
    await pay.connect(owner).setPayee(merchant.address, true);
    await mandate();
  }
  beforeEach(setup);
  it("funds a vault and withdraws only the owner's deposits", async () => {
    expect(await pay.vaultBalances(owner.address)).to.equal(usd("100"));
    await expect(pay.connect(outsider).withdraw(usd("1"))).to.be.reverted;
    await pay.connect(owner).withdraw(usd("30"));
    expect(await pay.vaultBalances(owner.address)).to.equal(usd("70"));
    expect(await token.balanceOf(owner.address)).to.equal(usd("430"));
  });
  it("settles one invoice and emits an auditable receipt", async () => {
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("12"), inv("INV-01"))).to.equal(0n);
    await expect(pay.connect(agent).pay(owner.address, merchant.address, usd("12"), inv("INV-01")))
      .to.emit(pay, "InvoiceSettled").withArgs(owner.address, merchant.address, inv("INV-01"), agent.address, usd("12"));
    expect(await token.balanceOf(merchant.address)).to.equal(usd("12"));
    expect(await pay.vaultBalances(owner.address)).to.equal(usd("88"));
    expect(await pay.paidInvoices(owner.address, inv("INV-01"))).to.equal(true);
  });
  it("blocks invoice replay", async () => {
    await pay.connect(agent).pay(owner.address, merchant.address, usd("8"), inv("REPLAY"));
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("8"), inv("REPLAY"))).to.equal(10n);
    await expect(pay.connect(agent).pay(owner.address, merchant.address, usd("8"), inv("REPLAY"))).to.be.reverted;
  });
  it("blocks unauthorized agents and unapproved payees", async () => {
    expect(await pay.checkPayment(owner.address, outsider.address, merchant.address, usd("1"), inv("I"))).to.equal(2n);
    expect(await pay.checkPayment(owner.address, agent.address, outsider.address, usd("1"), inv("I"))).to.equal(4n);
    await expect(pay.connect(outsider).pay(owner.address, merchant.address, usd("1"), inv("I"))).to.be.reverted;
  });
  it("enforces maximum per payment and daily cap", async () => {
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("21"), inv("A"))).to.equal(6n);
    await pay.connect(agent).pay(owner.address, merchant.address, usd("20"), inv("B"));
    await pay.connect(agent).pay(owner.address, merchant.address, usd("20"), inv("C"));
    await pay.connect(agent).pay(owner.address, merchant.address, usd("10"), inv("D"));
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("1"), inv("E"))).to.equal(7n);
  });
  it("expires a short-lived policy", async () => {
    await mandate({ single: "20", daily: "50", total: "60" });
    await pay.connect(agent).pay(owner.address, merchant.address, usd("20"), inv("A"));
    await pay.connect(agent).pay(owner.address, merchant.address, usd("20"), inv("B"));
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("1"), inv("C"))).to.equal(3n);
  });
  it("enforces total budget across day rollover", async () => {
    await mandate({ single: "20", daily: "50", total: "60", ttl: 3 * 86400 });
    for (const i of ["A", "B"]) await pay.connect(agent).pay(owner.address, merchant.address, usd("20"), inv(i));
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);
    await pay.connect(agent).pay(owner.address, merchant.address, usd("20"), inv("C"));
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("1"), inv("D"))).to.equal(8n);
  });
  it("rejects an expired mandate", async () => {
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("1"), inv("X"))).to.equal(3n);
  });
  it("revokes instantly and lets owner withdraw", async () => {
    await pay.connect(owner).revokeMandate();
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("1"), inv("X"))).to.equal(1n);
    await pay.connect(owner).withdraw(usd("100"));
    expect(await pay.vaultBalances(owner.address)).to.equal(0n);
  });
  it("isolates independent vaults", async () => {
    expect(await pay.checkPayment(outsider.address, agent.address, merchant.address, usd("1"), inv("X"))).to.equal(1n);
    await expect(pay.connect(outsider).deposit(usd("1"))).to.be.reverted;
  });
  it("returns an insufficient-funds reason", async () => {
    await pay.connect(owner).withdraw(usd("95"));
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("10"), inv("X"))).to.equal(9n);
  });
  it("rejects empty invoice, invalid mandate and invalid merchant", async () => {
    expect(await pay.checkPayment(owner.address, agent.address, merchant.address, usd("1"), ethers.ZeroHash)).to.equal(5n);
    await expect(pay.connect(owner).setMandate(agent.address, usd("20"), usd("10"), usd("100"), 9999999999)).to.be.reverted;
    await expect(pay.connect(owner).setPayee(ethers.ZeroAddress, true)).to.be.reverted;
  });
});
