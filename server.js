require('dotenv').config();
const express = require("express");
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const app = express();
const port = 3000;

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const address = process.env.WALLET_ADDRESS;
const chain = EvmChain.BASE;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/demo", async (req, res) => {
    try {
        const data = await getDemoData();
        res.status(200);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500);
        res.json({ error: error.message });
    }
});

const startServer = async () => {
    await Moralis.start({
        apiKey: MORALIS_API_KEY,
    });

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
};

async function getDemoData() {
    // Get native balance
    const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({ address, chain });

    const native = nativeBalance.result.balance.ether;

    return { native };
}

startServer();