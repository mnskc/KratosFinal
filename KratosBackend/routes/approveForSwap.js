const express= require('express');
const {ethers , BigNumber, Signer}  = require("ethers");
const { SafeTransactionDataPartial } = require('@gnosis.pm/safe-core-sdk-types');
const { SafeFactory, SafeAccountConfig, ContractNetworksConfig, EthSignSignature } = require('@gnosis.pm/safe-core-sdk');
const Safe = require('@gnosis.pm/safe-core-sdk')["default"];
const web3Provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/511886e2af2a4dfa89ed2b80a94692b1');
const EthersAdapter = require('@gnosis.pm/safe-ethers-lib')["default"];
const router = express.Router();
require('dotenv').config();
const fs = require('fs');

router.post('/',async(req,res) => {

    console.log("Approve for Uniswap Called here...")
    const user_address = req.body.signer;
    const data_from_signer= req.body.data;
    let value_from_signer = req.body.value;
    const addressOfSafe = req.body.address 
    value_from_signer = ethers.utils.parseUnits(value_from_signer , 18);

    const relayer_signer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY,web3Provider);
    const relayer_adapter = new EthersAdapter({ethers , signer: relayer_signer});
    const safeSdk_relayer = await Safe.create({ethAdapter : relayer_adapter,safeAddress: addressOfSafe});

    const dai_address = process.env.DAI_ADDRESS;
    const erc20AbiFile = fs.readFileSync(__dirname + '/../abi/erc20abi.json');
    const dai_abi = JSON.parse(erc20AbiFile);
    const ercDAI = new ethers.Contract(dai_address, dai_abi, relayer_signer);
    console.log("contract made...");
    const uniswap_address = process.env.UNISWAP_ADDRESS;
    const dataForTransaction1 = await ercDAI.populateTransaction["approve"](uniswap_address , value_from_signer.toString());
    
    const tx1 = {
        to: dai_address,
        value: '0',
        data:dataForTransaction1.data,
        gasLimit:250000
      }

    const safeTransaction1 = await safeSdk_relayer.createTransaction(tx1);
    const sign1 = await safeSdk_relayer.signTransaction(safeTransaction1);

    var obj1 = new EthSignSignature()
    obj1.signer = user_address
    obj1.data = data_from_signer
    safeTransaction1.signatures.set(user_address.toLowerCase(),obj1);

    console.log(safeTransaction1)
    const txResponse_owner = await safeSdk_relayer.executeTransaction(safeTransaction1,{gasLimit:500000});
    await txResponse_owner.transactionResponse.wait();
    console.log("The hash of the transaction is " + txResponse_owner.hash);
    res.send("Approval Completed") 
})


module.exports = router;