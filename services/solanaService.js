// services/solanaService.js
const Moralis = require("moralis").default;
const { REQUEST_TIMEOUT } = require('../config/constants');

class SolanaService {
    static async getNativeBalance(address) {
        try {
            const nativeBalance = await Promise.race([
                Moralis.SolApi.account.getBalance({
                    address: address,
                    network: 'mainnet'
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Solana native balance fetch timeout')), REQUEST_TIMEOUT)
                )
            ]);

            // SOL has 9 decimals
            const lamports = nativeBalance.result.lamports;
            const solBalance = (Number(lamports) / 1e9).toFixed(4);
            
            return {
                solana: solBalance,
                lamports: lamports,
                formatted: `${solBalance} SOL`
            };
        } catch (error) {
            console.error('Error fetching Solana native balance:', error);
            return {
                solana: "0",
                lamports: "0",
                formatted: "0 SOL"
            };
        }
    }

    static async getTokenBalances(address) {
        try {
            const tokenBalances = await Promise.race([
                Moralis.SolApi.account.getSPL({
                    address: address,
                    network: 'mainnet'
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Solana token balances fetch timeout')), REQUEST_TIMEOUT)
                )
            ]);

            // Process each token balance with metadata
            const processedTokens = await Promise.all(tokenBalances.result.map(async token => {
                try {
                    const metadataResponse = await Promise.race([
                        Moralis.SolApi.token.getTokenMetadata({
                            address: token.mint,
                            network: 'mainnet'
                        }),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error(`Token metadata fetch timeout for ${token.mint}`)), REQUEST_TIMEOUT)
                        )
                    ]);

                    const metadata = metadataResponse.result;
                    const decimals = metadata?.decimals || token.decimals || 9;
                    const rawAmount = token.amount;
                    const formattedAmount = (Number(rawAmount) / Math.pow(10, decimals)).toFixed(decimals);

                    return {
                        name: metadata?.name || 'Unknown Token',
                        symbol: metadata?.symbol || 'UNKNOWN',
                        mint: token.mint,
                        associatedTokenAddress: token.associatedTokenAddress,
                        balance: formattedAmount,
                        rawAmount: rawAmount,
                        decimals: decimals,
                        metadataUri: metadata?.metaplex?.metadataUri || null,
                        standard: metadata?.standard || null,
                        logoUrl: metadata?.logo || null
                    };
                } catch (error) {
                    console.error(`Error processing token ${token.mint}:`, error);
                    return {
                        name: 'Unknown Token',
                        symbol: 'UNKNOWN',
                        mint: token.mint,
                        associatedTokenAddress: token.associatedTokenAddress,
                        balance: (Number(token.amount) / 1e9).toFixed(9),
                        rawAmount: token.amount,
                        decimals: 9,
                        error: error.message
                    };
                }
            }));

            return processedTokens
                .filter(token => parseFloat(token.balance) > 0)
                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

        } catch (error) {
            console.error('Error fetching Solana token balances:', error);
            return [];
        }
    }

    static async getWalletBalance(address) {
        try {
            // Fetch both native and token balances
            const [nativeBalance, tokenBalances] = await Promise.all([
                this.getNativeBalance(address),
                this.getTokenBalances(address)
            ]);

            // Construct the response
            return {
                timestamp: new Date().toISOString(),
                address: address,
                summary: {
                    solanaBalance: nativeBalance.solana,
                    tokenCount: tokenBalances.length,
                },
                native: nativeBalance,
                tokens: tokenBalances
            };
        } catch (error) {
            console.error('Failed to fetch Solana balances:', error);
            // Return a structured response even in case of error
            return {
                timestamp: new Date().toISOString(),
                address: address,
                summary: {
                    solanaBalance: "0",
                    tokenCount: 0,
                },
                native: {
                    solana: "0",
                    lamports: "0",
                    formatted: "0 SOL"
                },
                tokens: []
            };
        }
    }
}

module.exports = SolanaService;