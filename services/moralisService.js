const Moralis = require("moralis").default;
const { MORALIS_API_KEY } = require('../config/constants');

class MoralisService {
    static async initialize() {
        try {
            await Moralis.start({ apiKey: MORALIS_API_KEY });
        } catch (error) {
            throw new Error(`Failed to initialize Moralis: ${error.message}`);
        }
    }

    static async getNativeBalance(address, chain) {
        return Moralis.EvmApi.balance.getNativeBalance({
            address,
            chain,
        });
    }

    static async getTokenBalances(address, chain) {
        return Moralis.EvmApi.token.getWalletTokenBalances({
            address,
            chain,
        });
    }
}

module.exports = MoralisService;