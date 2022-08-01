from web3 import Web3
import json
from solcx import compile_standard, install_solc
import configparser

# Get solidity code in a variable
with open("./CandyShop.sol", "r") as file:
    candy_shop_file = file.read()

# Get config.js parameters
config = configparser.ConfigParser()
config.read('config')

print("Installing solc version...")
install_solc(config['solidity']['version'])

# Solidity source code
compiled_sol = compile_standard(
    {
        "language": "Solidity",
        "sources": {"CandyShop.sol": {"content": candy_shop_file}},
        "settings": {
            "outputSelection": {
                "*": {
                    "*": ["abi", "metadata", "evm.bytecode", "evm.bytecode.sourceMap"]
                }
            }
        },
    },
    solc_version=config['solidity']['version'],
)

with open("compiled_contract.json", "w") as file:
    json.dump(compiled_sol, file)

# get bytecode
bytecode = compiled_sol["contracts"]["CandyShop.sol"]["CandyShop"]["evm"]["bytecode"]["object"]

# get abi
abi = json.loads(
    compiled_sol["contracts"]["CandyShop.sol"]["CandyShop"]["metadata"]
)["output"]["abi"]

# Parameters handled through config.js file
# To deploy to a different network change these values
# in config.js file
w3 = Web3(Web3.HTTPProvider(config['network']['URL']))
chain_id = config.getint('network', 'chain_id')
my_address = Web3.toChecksumAddress(config['address']['my_address'])
private_key = config['address']['private_key']

# Create the contract in Python
CandyShop = w3.eth.contract(abi=abi, bytecode=bytecode)
# Get the latest transaction
nonce = w3.eth.getTransactionCount(my_address)
# Submit the transaction that deploys the contract
transaction = CandyShop.constructor().buildTransaction(
    {
        "chainId": chain_id,
        "gasPrice": w3.eth.gas_price,
        "from": my_address,
        "nonce": nonce,
    }
)
# Sign the transaction
signed_txn = w3.eth.account.sign_transaction(transaction, private_key=private_key)
print("Deploying Contract!")
# Send it!
tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
# Wait for the transaction to be mined, and get the transaction receipt
print("Waiting for transaction to finish...")
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print(f"Done! Contract deployed to {tx_receipt.contractAddress}")

# Working with deployed Contracts
candy_shop = w3.eth.contract(address=tx_receipt.contractAddress, abi=abi)

# This is only a view function, doesn't need to change state,
# So no need for a signed built transaction
print(f"Cost of Candy {candy_shop.functions.getCandyCost().call()}")

# Now this transaction will change the state, hence need to build transact
buy_transaction = candy_shop.functions.buyCandy(2).buildTransaction(
    {
        "chainId": chain_id,
        "gasPrice": w3.eth.gas_price,
        "from": my_address,
        "nonce": nonce + 1,
        "value": Web3.toWei(0.1, 'ether'),
    }
)
signed_buy_txn = w3.eth.account.sign_transaction(
    buy_transaction, private_key=private_key
)
buy_tx_hash = w3.eth.send_raw_transaction(signed_buy_txn.rawTransaction)
print("Number Of Candies Sold Till Now...")
tx_receipt = w3.eth.wait_for_transaction_receipt(buy_tx_hash)

print(candy_shop.functions.getCandiesSold().call())
