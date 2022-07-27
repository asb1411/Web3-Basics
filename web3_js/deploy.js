const fs = require('fs');
const solc = require('solc');
const web3 = require('web3');
const config = require('./config.js')

// Load the contract source code
const source_code = fs.readFileSync('CandyShop.sol', 'utf8');

// Create Input Object
// This will be used for compilation settings
const input = {
   language: 'Solidity',
   sources: {
      'CandyShop.sol': {
         content: source_code,
      },
   },
   settings: {
      outputSelection: {
         '*': {
            '*': ['*'],
         },
      },
   },
};

// Compile the contract
const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
const contractFile = tempFile.contracts['CandyShop.sol']['CandyShop'];

// Storing contractFile in a fixed file
fs.writeFile('./compiled_contract.json', JSON.stringify(contractFile), err => {
  if (err) {
    console.error(err)
    return
  }
  console.log('Write Successful!');
})

// Initialize Web3 Provider (Local Ganache chain)
const w3 = new web3(new web3.providers.HttpProvider(config['network']['URL']));

const accountFrom = {
  privateKey: config['address']['private_key'],
  address: config['address']['my_address'],
};

// Bytecode and API
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// Create deploy function
const deploy = async () => {
  console.log(`Attempting to deploy from account ${accountFrom.address}`);

  // Create contract instance
  const candyShop = new w3.eth.Contract(abi);

  // Create constructor tx
  const candyShopTx = await candyShop.deploy({
    data: bytecode,
  });

  // Sign transaction and send
  var gasToUse = await candyShopTx.estimateGas({'from': accountFrom.address});
  const createTransaction = await w3.eth.accounts.signTransaction(
    {
      data: candyShopTx.encodeABI(),
      from: accountFrom.address,
      gas: gasToUse
    },
    accountFrom.privateKey
  );

  // Send tx and wait for receipt
  const createReceipt = await w3.eth.sendSignedTransaction(createTransaction.rawTransaction);
  console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);
  contractAddress = createReceipt.contractAddress;

  return [contractAddress, abi];
};

// Variable to store contract address
var contractAddress;
module.exports = deploy;
