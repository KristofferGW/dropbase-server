require('dotenv').config();
const express = require("express");
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const app = express();
const port = 3000;

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const address = process.env.WALLET_ADDRESS;
const REQUEST_TIMEOUT = 30000;

// Define all chains to check
const CHAINS = [
    { chain: EvmChain.ETHEREUM, name: 'Ethereum' },
    { chain: EvmChain.BSC, name: 'BSC' },
    { chain: EvmChain.ARBITRUM, name: 'Arbitrum' },
    { chain: EvmChain.BASE, name: 'Base' },
    { chain: EvmChain.OPTIMISM, name: 'Optimism' },
    { chain: EvmChain.LINEA, name: 'Linea' },
    { chain: EvmChain.AVALANCHE, name: 'Avalanche' },
    { chain: EvmChain.BLAST, name: 'Blast' },
    { chain: EvmChain.ZKSYNC, name: 'zkSync' },
    { chain: EvmChain.MANTLE, name: 'Mantle' },
    { chain: EvmChain.POLYGON_ZKEVM, name: 'Polygon zkEVM' }
];

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/get-evm-balances", async (req, res) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({ error: "Request timeout" });
        }
    }, REQUEST_TIMEOUT);

    try {
        const data = await getAllChainBalances();
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

async function getChainBalance(chainInfo) {
    try {
        const { chain, name } = chainInfo;
        
        // Fetch native balance
        const nativeBalancePromise = Moralis.EvmApi.balance.getNativeBalance({
            address,
            chain,
        });

        const nativeBalance = await Promise.race([
            nativeBalancePromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`${name} native balance fetch timeout`)), REQUEST_TIMEOUT)
            )
        ]);

        // Fetch token balances
        const tokenBalancesPromise = Moralis.EvmApi.token.getWalletTokenBalances({
            address,
            chain,
        });

        const tokenBalances = await Promise.race([
            tokenBalancesPromise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`${name} token balances fetch timeout`)), REQUEST_TIMEOUT)
            )
        ]);

        return {
            chainName: name,
            native: nativeBalance.result.balance.ether,
            tokens: tokenBalances.result.map((token) => ({
                symbol: token.symbol,
                name: token.name,
                balance: token.display(),
                decimals: token.decimals,
                tokenAddress: token.token.contractAddress.lowercase
            }))
        };
    } catch (error) {
        console.error(`Error fetching ${chainInfo.name} balances:`, error);
        return {
            chainName: chainInfo.name,
            error: error.message,
            native: "0",
            tokens: []
        };
    }
}

async function getAllChainBalances() {
    const balancePromises = CHAINS.map(chainInfo => getChainBalance(chainInfo));
    
    try {
        const results = await Promise.all(balancePromises);
        
        // Filter out chains with no balances
        const chainsWithBalances = results.filter(result => 
            result.native !== "0" || result.tokens.length > 0
        );
        
        return {
            timestamp: new Date().toISOString(),
            address: address,
            totalChains: CHAINS.length,
            chainsWithBalances: chainsWithBalances.length,
            balances: chainsWithBalances
        };
    } catch (error) {
        throw new Error(`Failed to fetch balances: ${error.message}`);
    }
}

startServer();