const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();
const web3Provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`);
const fs = require('fs');
const {SafeFactory, EthSignSignature} = require('@gnosis.pm/safe-core-sdk');
const Safe = require('@gnosis.pm/safe-core-sdk')["default"];
const EthersAdapter = require('@gnosis.pm/safe-ethers-lib')["default"];

router.post('/',async(req,res) => {

    console.log("Redeem of Compound is Called here...")
    const user_address = req.body.signer;
    const data_from_signer= req.body.data;
    const value_from_signer = req.body.value;
    const addressOfSafe = req.body.address;

    console.log("User address is:",user_address);
    console.log("Signer Data is :",data_from_signer);
    console.log("Value for data  is :",value_from_signer);
    console.log("safeAddress is: ",addressOfSafe);
    

    const relayer_signer = new ethers.Wallet("fcdc201c21f2ee32b116c24ea793bb3c662747a66cd486bd23efd339fd0d104c",web3Provider);
    const relayer_adapter = new EthersAdapter({ethers , signer: relayer_signer});
    const safeSdk_relayer = await Safe.create({ethAdapter : relayer_adapter,safeAddress: addressOfSafe});

    const compoundAbiFile = fs.readFileSync(__dirname + '/../abi/cDAIabi.json');
    const cDAI_ABI = JSON.parse(compoundAbiFile);
    const cDAI_ADDRESS = process.env.CDAI_ADDRESS;
    const erccDAI = new ethers.Contract(cDAI_ADDRESS, cDAI_ABI, relayer_signer);
    console.log("contract made...");
    
    const redeemDAI = await erccDAI.populateTransaction.redeemUnderlying(value_from_signer);
    console.log("approval for dai and cdai done..");
   
    const tx = 
    {
        to: cDAI_ADDRESS,
        value: "0",
        data:redeemDAI.data,
        gasLimit:160000
    };

    const safeTransaction1 = await safeSdk_relayer.createTransaction(tx);
    const sign1 = await safeSdk_relayer.signTransaction(safeTransaction1);

    var obj1=new EthSignSignature()
    obj1.signer=user_address
    obj1.data=data_from_signer
    safeTransaction1.signatures.set(user_address.toLowerCase(),obj1);

    console.log(safeTransaction1)
    const txResponse_owner = await safeSdk_relayer.executeTransaction(safeTransaction1,{gasLimit:250000});
    await txResponse_owner.transactionResponse.wait();
    console.log(txResponse_owner.hash);
    res.send("Transaction Completed")
})

module.exports = router;