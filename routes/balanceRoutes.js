const express = require('express');
const router = express.Router();
const { REQUEST_TIMEOUT } = require('../config/constants');
const BalanceService = require('../services/balanceService');

router.get("/get-evm-balances", async (req, res) => {
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({ error: "Request timeout" });
        }
    }, REQUEST_TIMEOUT);

    try {
        const data = await BalanceService.getAllChainBalances();
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

router.get("/get-solana-balances", async (req, res) => {
    // TODO: Implement Solana balance fetching
});

module.exports = router;