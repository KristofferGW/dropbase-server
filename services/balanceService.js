const { REQUEST_TIMEOUT, WALLET_ADDRESS } = require('../config/constants');
const CHAINS = require('../config/chains');
const MoralisService = require('./moralisService');

class BalanceService {
    static async getChainBalance(chainInfo) {
        try {
            const { chain, name } = chainInfo;
            
            const nativeBalancePromise = MoralisService.getNativeBalance(WALLET_ADDRESS, chain);
            const nativeBalance = await Promise.race([
                nativeBalancePromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`${name} native balance fetch timeout`)), REQUEST_TIMEOUT)
                )
            ]);

            const tokenBalancesPromise = MoralisService.getTokenBalances(WALLET_ADDRESS, chain);
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

    static async getAllChainBalances() {
        const balancePromises = CHAINS.map(chainInfo => this.getChainBalance(chainInfo));
        
        try {
            const results = await Promise.all(balancePromises);
            
            const chainsWithBalances = results.filter(result => 
                result.native !== "0" || result.tokens.length > 0
            );
            
            return {
                timestamp: new Date().toISOString(),
                address: WALLET_ADDRESS,
                totalChains: CHAINS.length,
                chainsWithBalances: chainsWithBalances.length,
                balances: chainsWithBalances
            };
        } catch (error) {
            throw new Error(`Failed to fetch balances: ${error.message}`);
        }
    }
}

module.exports = BalanceService;