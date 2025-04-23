require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const AMOY_RPC_URL = process.env.REACT_APP_POLYGON_AMOY_RPC || "https://polygon-amoy.blockpi.network/v1/rpc/public";

module.exports = {
  solidity: "0.8.19",
  networks: {
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};