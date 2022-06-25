const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();
const web3Provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`);
const fs = require('fs');
const {SafeFactory, EthSignSignature} = require('@gnosis.pm/safe-core-sdk');
const Safe = require('@gnosis.pm/safe-core-sdk')["default"];
const EthersAdapter = require('@gnosis.pm/safe-ethers-lib')["default"];

router.post("/" , async (req , res) => {
    let value = req.body.value;
    const signer = req.body.signer;
    const data = req.body.data;
    const addressOfSafe = req.body.address;
    const deadline = req.body.deadline;
    value = ethers.utils.parseUnits(value , 18);
    await swap(value , signer , data , addressOfSafe , deadline);
    res.sendStatus(200);
});

async function swap(value , signer , data , addressOfSafe , deadline){
    const routerAbiFile = fs.readFileSync(__dirname + '/../abi/routerAbi.json');
    const routerAbi = JSON.parse(routerAbiFile);
    const routerSmartContractAddress = process.env.UNISWAP_ADDRESS;
    const daiAddress = process.env.DAI_ADDRESS;
    const linkAddress = process.env.LINK_ADDRESS;
    const relayer = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY,
        web3Provider
    ); 
    const routerSmartContract = new ethers.Contract(
        routerSmartContractAddress,
        routerAbi, 
        relayer
    );
    const path = [daiAddress , linkAddress];
    const dataForTransaction = await routerSmartContract.populateTransaction["swapExactTokensForTokens"](value.toString() , '0' , path , addressOfSafe , deadline);
    const tx = {
        to: routerSmartContractAddress,
        data: dataForTransaction.data,
        value: '0',
        gasLimit: 250000
    };
    const relayer_adapter = new EthersAdapter({ethers,signer:relayer});
    const safesdk = await Safe.create({ethAdapter : relayer_adapter , safeAddress : addressOfSafe});

    const safeTransaction = await safesdk.createTransaction(tx);
    userSignObject = new EthSignSignature();
    userSignObject.data = data;
    userSignObject.signer = signer;
    safeTransaction.signatures.set(signer.toLowerCase() , userSignObject);
    await safesdk.signTransaction(safeTransaction);
    console.log(safeTransaction);
    const finalTransaction = await safesdk.executeTransaction(safeTransaction,{gasLimit:500000});
    await finalTransaction.transactionResponse.wait();
    console.log("The hash of the transaction is " + finalTransaction.hash);
} 

module.exports = router; 