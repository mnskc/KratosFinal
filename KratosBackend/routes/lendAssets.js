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
    const value = req.body.value;
    const signer = req.body.signer;
    const data = req.body.data;
    await lendAssets(value , safeAddress , signer , data);
    res.sendStatus(200);
});

async function lendAssets(value , addressOfSafe , signer , data){
    const compoundAbiFile = fs.readFileSync(__dirname + '/../abi/cDAIabi.json');
    const compoundAbi = JSON.parse(compoundAbiFile);
    const erc20AbiFile = fs.readFileSync(__dirname + '/../abi/erc20abi.json');
    const erc20Abi = JSON.parse(erc20AbiFile);
    const cDai_address = process.env.CDAI_ADDRESS;
    const dai_address = process.env.DAI_ADDRESS;

    const relayer = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY,
        web3Provider
    );
    
    const compoundSmartContract = new ethers.Contract(
        cDai_address,
        compoundAbi,
        relayer
    );

    const daiSmartContract = new ethers.Contract(
        dai_address, 
        erc20Abi,
        relayer
    );

    const relayer_adapter = new EthersAdapter({ethers,signer:relayer});
    const safesdk = await Safe.create({ethAdapter : relayer_adapter , safeAddress : addressOfSafe});

    const dataForTransaction1 = await daiSmartContract.populateTransaction["approve"](cDai_address , value);
    const dataForTransaction2 = await compoundSmartContract.populateTransaction["mint"](value);
    
    const tx = [
        {
            to : dai_address,
            value : "0",
            data : dataForTransaction1.data,
        },
        {
            to : cDai_address,
            value : "0",
            data : dataForTransaction2.data,
        }
    ];
    
    const relayerAddress = await relayer.getAddress();
    const safeTransaction = await safesdk.createTransaction(tx);
    await safesdk.signTransaction(safeTransaction);
    userSignObject = new EthSignSignature();
    userSignObject.data = data;
    userSignObject.signer = signer;
    safeTransaction.signatures.set(signer.toLowerCase() , userSignObject);
    console.log(safeTransaction);
    const finalTransaction = await safesdk.executeTransaction(safeTransaction,{gasLimit:250000});
    await finalTransaction.transactionResponse.wait();
    console.log("The hash of the transaction is " + finalTransaction.hash);
}

module.exports = router;