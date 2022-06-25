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
    const safeAddress = req.body.address;
    let value = req.body.value;
    const toAddress = req.body.toAddress;
    const signer = req.body.signer;
    const data = req.body.data;
    console.log("safe address is" + safeAddress);
    console.log("val is" + value);
    console.log("to add is" + toAddress);
    console.log("signer is" + signer);
    console.log("data is" + data);
    value = ethers.utils.parseUnits(value , 18);
    await createTransaction(toAddress , value , safeAddress , signer , data);
    res.sendStatus(200);
});

async function createTransaction(toAddress , value , addressOfSafe , signer , data){
    const erc20AbiFile = fs.readFileSync(__dirname + '/../abi/erc20abi.json');
    const erc20Abi = JSON.parse(erc20AbiFile);
    const dai_address = process.env.DAI_ADDRESS;

    const relayer = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY,
        web3Provider
    );

    const daiSmartContract = new ethers.Contract(
        dai_address,
        erc20Abi,
        relayer
    );

    const relayer_adapter = new EthersAdapter({ethers,signer:relayer});
    const safesdk = await Safe.create({ethAdapter:relayer_adapter,safeAddress:addressOfSafe});
    const dataForTransaction = await daiSmartContract.populateTransaction["transfer"](toAddress , value);
    const tx = {
        to: dai_address,
        data: dataForTransaction.data,
        value: 0,
        gasLimit: 250000
    };
    const safeTransaction = await safesdk.createTransaction(tx);
    console.log(safeTransaction);
    await safesdk.signTransaction(safeTransaction);
    userSignObject = new EthSignSignature();
    userSignObject.data = data;
    userSignObject.signer = signer;
    safeTransaction.signatures.set(signer.toLowerCase() , userSignObject);
    console.log(safeTransaction);
    const finalTransaction = await safesdk.executeTransaction(safeTransaction,{gasLimit:250000});
    await finalTransaction.transactionResponse.wait();
    console.log("The hash of the tx is " + finalTransaction.hash);
} 

module.exports = router; 