const express = require('express');
const router = express.Router();
const ethers = require('ethers');
require('dotenv').config();
const web3Provider = new ethers.providers.JsonRpcProvider(`https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`);
const fs = require('fs');

router.post("/" , async (req , res) => {
    const safeAddress = req.body.address;
    const [dai_balance, link_balance , cDai_balance] = await Promise.all([getDaiBalance(safeAddress), getLinkBalance(safeAddress) , getcDaiBalance(safeAddress)]);
    const obj = {
        "dai_balance": dai_balance,
        "link_balance": link_balance,
        "cDai_balance": cDai_balance
    }
    res.json(JSON.stringify(obj))
})

async function getDaiBalance(safeAddress) {
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

    let daiBalance = await daiSmartContract.balanceOf(safeAddress);
    console.log("The dai balance is " + daiBalance)
    daiBalance = ethers.utils.formatUnits(daiBalance , 18);
    console.log("The dai balance is " + daiBalance)
    return daiBalance;
}

async function getLinkBalance(safeAddress) {
    const erc20AbiFile = fs.readFileSync(__dirname + '/../abi/erc20abi.json');
    const erc20Abi = JSON.parse(erc20AbiFile);
    const link_address = process.env.LINK_ADDRESS;

    const relayer = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY,
        web3Provider
    );

    const linkSmartContract = new ethers.Contract(
        link_address,
        erc20Abi,
        relayer
    );

    let linkBalance = await linkSmartContract.balanceOf(safeAddress);
    linkBalance = ethers.utils.formatUnits(linkBalance , 18);
    return linkBalance;
}

async function getcDaiBalance(safeAddress){
    const cDai_address = process.env.CDAI_ADDRESS;
    const cDaiAbiFile = fs.readFileSync(__dirname + '/../abi/erc20abi.json');
    const cDaiAbi = JSON.parse(cDaiAbiFile);
    const relayer = new ethers.Wallet(
        process.env.RELAYER_PRIVATE_KEY,
        web3Provider
    );
    const cDaiSmartContrct = new ethers.Contract(
        cDai_address,
        cDaiAbi,
        relayer
    );
    let cDaiBalance = await cDaiSmartContrct.balanceOf(safeAddress);
    cDaiBalance = ethers.utils.formatUnits(cDaiBalance , 8);
    return cDaiBalance;
}

module.exports = router;
