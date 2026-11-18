const hre = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");
const { ethers } = hre;
const TOKEN = "0x456569838f1d43009A91ebA4263147Afd7233483";
async function main() {
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== 44005n) throw new Error("Deployment blocked: use Aevum chain 44005");
  const tokenCode = await ethers.provider.getCode(TOKEN);
  if (tokenCode === "0x") throw new Error("Official tUSD8 contract code missing");
  const factory = await ethers.getContractFactory("MandatePay");
  const contract = await factory.deploy(TOKEN);
  const receipt = await contract.deploymentTransaction().wait(2);
  const address = await contract.getAddress();
  const record = {
    network: "Aevum Testnet", chainId: 44005, token: TOKEN,
    address, deployTx: receipt.hash, blockNumber: Number(receipt.blockNumber),
    explorer: "https://explorer-test.qday.info/address/" + address
  };
  fs.writeFileSync(path.join(__dirname, "../web/deployment.json"), JSON.stringify(record, null, 2) + "\n");
  console.log(JSON.stringify(record, null, 2));
  console.log("Verify source independently; never claim verified until explorer confirms.");
}
main().catch(e => { console.error(e); process.exitCode = 1; });
