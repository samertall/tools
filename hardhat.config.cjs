const { subtask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } = require('hardhat/builtin-tasks/task-names');
subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async ({ solcVersion }, _hre, runSuper) => {
  if (solcVersion === '0.8.24') return {
    compilerPath: require.resolve('solc/soljson.js'),
    isSolcJs: true,
    version: '0.8.24',
    longVersion: '0.8.24+commit.e11b9ed9'
  };
  return runSuper();
});
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    hardhat: { chainId: 31337 },
    aevum: {
      url: process.env.AEVUM_RPC_URL || "https://rpc-test.qday.info",
      chainId: 44005,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  }
};
