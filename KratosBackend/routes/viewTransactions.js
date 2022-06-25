const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();
const web3Provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`);
const fs = require('fs');
const axios = require('axios');
const res = require('express/lib/response');

router.post("/" , async (req , res) => {
    const safeAddress = req.body.address;
    const response = await viewTransactions(safeAddress);
    const obj = {
        "res" : response
    }
    res.json(JSON.stringify(obj))
})


async function viewTransactions(safeAddress){
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    const etherscanEndpoint = `https://api-rinkeby.etherscan.io/api?module=account&action=txlist&address=${safeAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`;
    const response = await axios.get(etherscanEndpoint);
    return response.data.result;
}

module.exports = router;