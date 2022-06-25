const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

const getBalanceRouter = require('./routes/getBalances');
const checkForSafe = require('./routes/checkForSafe');
const createSafe = require('./routes/createSafe');
const viewTransactions = require('./routes/viewTransactions');
const transferAssets = require('./routes/transferAssets');
const swapAssets = require('./routes/swapAssets');
const redeemAssets = require('./routes/redeemAssets');
const lendAssets = require('./routes/lendAssets');
const approveForSwap = require('./routes/approveForSwap');

app.use('/getBalance' , getBalanceRouter);
app.use('/checkForSafe' , checkForSafe);
app.use('/createSafe' , createSafe);
app.use('/viewTransactions' , viewTransactions);
app.use('/transferAssets' , transferAssets);
app.use('/swap' , swapAssets);
app.use('/redeem' , redeemAssets);
app.use('/lend' , lendAssets); 
app.use('/approve' , approveForSwap); 

app.listen(3030 , () => {console.log("Listening on port 3030")});