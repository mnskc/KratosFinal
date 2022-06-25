const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();
const web3Provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`);
const fs = require('fs');

const {SafeFactory} = require('@gnosis.pm/safe-core-sdk');
const Safe = require('@gnosis.pm/safe-core-sdk')["default"];
const EthersAdapter = require('@gnosis.pm/safe-ethers-lib')["default"];

router.post("/" , async (req , res) => {
    const userAddress = req.body.address;
    console.log("user address is " + userAddress);
    const safeAddress = await createSafe(userAddress);
    const response = {
        "safeAddress" : safeAddress
    };
    res.json(JSON.stringify(response));
})


async function createSafe(userAddress){

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

    const relayer_adapter = new EthersAdapter({ethers , signer: relayer});
    const safeFactory = await SafeFactory.create({ ethAdapter: relayer_adapter });
    const relayerAddress = await relayer.getAddress();
    const owners = [userAddress , relayerAddress];
    const threshold = 2;
    const safeAccountConfig = { owners: owners, threshold: threshold};
    const safeSdk = await safeFactory.deploySafe({ safeAccountConfig });
    const newSafeAddress = safeSdk.getAddress();
    const tx = await userMappingSmartContract.addAddress(userAddress , newSafeAddress);
    console.log("The hash of the transaction for Creation of Safe Sdk is : " + tx.hash);
    await tx.wait();
    const safeAddress = safeSdk.getAddress();
    const transaction = await userMappingSmartContract.addAddress(userAddress , safeAddress);
    console.log("The hash of the transaction User Mapping Smart Contract is : " + transaction.hash);
    await transaction.wait();
    return safeAddress;
}


module.exports = router;