require('dotenv').config();
const express = require("express");
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const app = express();
const port = 3000;

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const address = process.env.WALLET_ADDRESS;
const chain = EvmChain.BASE;

// Increase timeout for request handling (30 seconds)
const REQUEST_TIMEOUT = 30000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/get-evm-balances", async (req, res) => {
    // Set timeout for the entire request
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({ error: "Request timeout" });
        }
    }, REQUEST_TIMEOUT);

    try {
        const data = await getEvmBalances();
        clearTimeout(timeout);
        
        if (!res.headersSent) {
            res.status(200).json(data);
        }
    } catch (error) {
        clearTimeout(timeout);
        console.error("Error fetching balances:", error);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: error.message,
                details: error.details || "No additional details available"
            });
        }
    }
});

const startServer = async () => {
    try {
        await Moralis.start({
            apiKey: MORALIS_API_KEY,
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Request timeout set to ${REQUEST_TIMEOUT}ms`);
        });
    } catch (error) {
        console.error("Failed to start Moralis:", error);
        process.exit(1);
    }
};

async function getEvmBalances() {
    try {
        // Get native balance with a Promise.race for timeout
        const nativeBalancePromise = Moralis.EvmApi.balance.getNativeBalance({
            address,
            chain,
        });

        const nativeBalance = await Promise.race([
            nativeBalancePromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Native balance fetch timeout')), REQUEST_TIMEOUT)
            )
        ]);

        const native = nativeBalance.result.balance.ether;
        
        // Get token balances with a Promise.race for timeout
        const tokenBalancesPromise = Moralis.EvmApi.token.getWalletTokenBalances({
            address,
            chain,
        });

        const tokenBalances = await Promise.race([
            tokenBalancesPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Token balances fetch timeout')), REQUEST_TIMEOUT)
            )
        ]);
        
        const tokens = tokenBalances.result.map((token) => token.display());
        
        return { native, tokens };
    } catch (error) {
        // Add more context to the error
        throw new Error(`Failed to fetch balances: ${error.message}`);
    }
}

startServer();