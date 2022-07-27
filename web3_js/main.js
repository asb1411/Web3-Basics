const web3 = require('web3');
const config = require('./config.js');
const deploy = require('./deploy.js');

// Variable to store contract address
var contractAddress, abi, candyShop;

const w3 = new web3(new web3.providers.HttpProvider(config['network']['URL']));

// Call deploy function
const mainDeploy = async () => {
    [contractAddress, abi]=await deploy();
    console.log(contractAddress);
    candyShop = new w3.eth.Contract(abi, contractAddress);
}

const tryContract = async () => {
    await mainDeploy();

    getCandyCost=await candyShop.methods.getCandyCost().call();
    console.log("Cost of one candy is " + getCandyCost + " wei");

    getNumberOfCandyTypes=await candyShop.methods.getNumberOfCandyTypes().call();
    console.log("Candies come in " + getNumberOfCandyTypes + "types");

    // For buying multiple candies try a loop here or
    // copy paste the await statement
    console.log("Buying 1 candy...");
    await buyCandyUtil();

    sold = await candyShop.methods.getCandiesSold().call();
    console.log("Number of total candies sold by the store is " + sold);
}

const buyCandyUtil = async () => {
    c = candyShop.methods.buyCandy(1);
    encodedABI = c.encodeABI();

    gasToUse = 100000;
    const buyCandyTransaction = await w3.eth.accounts.signTransaction(
    {
      data: encodedABI,
      from: config['address']['my_address'],
      to: contractAddress,
      value: w3.utils.toWei('0.1', 'ether'),
      gas: gasToUse
    },
    config['address']['private_key']
    );

    console.log("Sending this transaction " + buyCandyTransaction.rawTransaction);
    const buyCandyReceipt = await w3.eth.sendSignedTransaction(buyCandyTransaction.rawTransaction);
}

tryContract();
