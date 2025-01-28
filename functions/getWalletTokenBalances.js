// Setup: npm install alchemy-sdk
require('dotenv').config();
const { Alchemy, Network } = require("alchemy-sdk");

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

const main = async () => {
  // Wallet address
  const address = "0xB45976856Ee46A0FCA57bA68e2E8cc1Cd23662c7";

  // Get token balances
  const balances = await alchemy.core.getTokenBalances(address);

  // Remove tokens with zero balance
  const nonZeroBalances = balances.tokenBalances.filter((token) => {
    return token.tokenBalance !== "0";
  });

  console.log(`Token balances of ${address} \n`);

  // Create an array of promises for metadata fetching
  const metadataPromises = nonZeroBalances.map(async (token) => {
    try {
      const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
      const balance = (token.tokenBalance / Math.pow(10, metadata.decimals)).toFixed(2);
      return {
        name: metadata.name,
        balance,
        symbol: metadata.symbol
      };
    } catch (error) {
      console.error(`Error fetching metadata for token ${token.contractAddress}:`, error);
      return null;
    }
  });

  // Wait for all metadata requests to complete
  const results = await Promise.all(metadataPromises);

  // Filter out any failed requests and print results
  results
    .filter(result => result !== null)
    .forEach((result, i) => {
      console.log(`${i + 1}. ${result.name}: ${result.balance} ${result.symbol}`);
    });
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();