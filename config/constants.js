require('dotenv').config();

const CONSTANTS = {
    MORALIS_API_KEY: process.env.MORALIS_API_KEY,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS,
    PORT: 3000,
    REQUEST_TIMEOUT: 30000
};

module.exports = CONSTANTS;