const express = require("express");
const { PORT, REQUEST_TIMEOUT } = require('./config/constants');
const MoralisService = require('./services/moralisService');
const balanceRoutes = require('./routes/balanceRoutes');

const app = express();

app.get("/", (req, res) => {
    res.send("Hello from the world of Airdrops!");
});

app.use('/', balanceRoutes);

const startServer = async () => {
    try {
        await MoralisService.initialize();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Request timeout set to ${REQUEST_TIMEOUT}ms`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();