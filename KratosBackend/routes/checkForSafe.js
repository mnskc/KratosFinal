const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();
const web3Provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`);
const fs = require('fs');

router.post("/" , async (req , res) => {
    const safeAddress = req.body.address;
    const response = await checkForSafe(safeAddress);
    res.json(JSON.stringify(response))
})

async function checkForSafe(safeAddress){
    const userMappingSmartContractAbiFile = fs.readFileSync(__dirname + '/../abi/userMappingAbi.json');
    const userMappingSmartContractAbi = JSON.parse(userMappingSmartContractAbiFile);
    const userMappingSmartContractAddress = process.env.USER_MAPPING_SMART_CONTRACT_ADDRESS;

    const relayer = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY,
        web3Provider
    );

    const userMappingSmartContract = new ethers.Contract(
        userMappingSmartContractAddress , 
        userMappingSmartContractAbi , 
        relayer
    );
    
    const address = await userMappingSmartContract.getAddress(safeAddress);
    const zeroAddress = process.env.ZERO_ADDRESS;

    if(address == zeroAddress){
        return {
            "status": "false",
            "address": address
        };
    }
    else {
        return {
            "status": "true",
            "address": address
        };
    } 
}

module.exports = router;