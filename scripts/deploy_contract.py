import json
import os
import sys
try:
    from web3 import Web3
    import solcx
except ImportError:
    print("Please install web3 and py-solc-x: pip install web3 py-solc-x")
    sys.exit(1)

# Ensure solc is installed
solcx.install_solc('0.8.19')
solcx.set_solc_version('0.8.19')

def compile_contract():
    contract_path = os.path.join(os.path.dirname(__file__), '../backend/contracts/IntegrityLedger.sol')
    with open(contract_path, 'r') as file:
        contract_source_code = file.read()

    compiled_sol = solcx.compile_source(
        contract_source_code,
        output_values=['abi', 'bin']
    )

    contract_id, contract_interface = compiled_sol.popitem()
    bytecode = contract_interface['bin']
    abi = contract_interface['abi']
    return bytecode, abi

def deploy():
    # Connect to Ganache default RPC
    w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
    if not w3.is_connected():
        w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545')) # Fallback for ganache-cli
        if not w3.is_connected():
            print("Failed to connect to Ganache on 7545 or 8545. Is it running?")
            sys.exit(1)

    print("Connected to Ganache. Compiling contract...")
    bytecode, abi = compile_contract()

    w3.eth.default_account = w3.eth.accounts[0]
    print(f"Deploying from account: {w3.eth.default_account}")

    IntegrityLedger = w3.eth.contract(abi=abi, bytecode=bytecode)

    tx_hash = IntegrityLedger.constructor().transact()
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    contract_address = tx_receipt.contractAddress
    print(f"Contract deployed successfully at address: {contract_address}")

    # Save ABI and contract address for backend
    backend_config_path = os.path.join(os.path.dirname(__file__), '../backend/contract_config.json')
    with open(backend_config_path, 'w') as f:
        json.dump({
            "address": contract_address,
            "abi": abi
        }, f, indent=4)
    print(f"Contract config saved to {backend_config_path}")

if __name__ == "__main__":
    deploy()
