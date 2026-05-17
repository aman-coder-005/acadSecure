import hashlib
import json
import logging
import os
from typing import Dict, Any, Tuple
from web3 import Web3

logger = logging.getLogger("acadSecure.blockchain")

# Setup Web3 connection
GANACHE_URL = os.environ.get("GANACHE_URL", "http://127.0.0.1:7545")
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
# Fallback to 8545 if 7545 fails
if not w3.is_connected():
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

_contract_instance = None
_default_account = None

def get_contract():
    global _contract_instance, _default_account
    
    if _contract_instance is not None:
        return _contract_instance, _default_account
        
    if not w3.is_connected():
        logger.error("Web3 is not connected. Make sure Ganache is running.")
        raise Exception("Failed to connect to local blockchain.")
        
    config_path = os.path.join(os.path.dirname(__file__), "contract_config.json")
    if not os.path.exists(config_path):
        logger.error(f"Contract config not found at {config_path}.")
        raise Exception("Contract configuration missing. Run deploy_contract.py first.")
        
    with open(config_path, "r") as f:
        config = json.load(f)
        
    _default_account = w3.eth.accounts[0]
    w3.eth.default_account = _default_account
    
    _contract_instance = w3.eth.contract(address=config["address"], abi=config["abi"])
    return _contract_instance, _default_account

def hash_document(text: str) -> str:
    """Generate SHA256 hash for document text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def store_report_on_chain(
    doc_hash: str, 
    originality_score: float, 
    plagiarism_risk: str, 
    ai_risk: str, 
    collusion_risk: str
) -> Tuple[str, int]:
    """
    Stores the integrity report on the local blockchain.
    Returns transaction hash and block number.
    """
    try:
        contract, account = get_contract()
        
        # Solidity uint256 doesn't take decimals easily. Scale by 100.
        scaled_score = int(originality_score * 100)
        
        tx_hash = contract.functions.storeReport(
            doc_hash,
            scaled_score,
            plagiarism_risk,
            ai_risk,
            collusion_risk
        ).transact({'from': account})
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return receipt.transactionHash.hex(), receipt.blockNumber
        
    except Exception as exc:
        logger.exception("Failed to store report on blockchain")
        raise exc

def verify_document_on_chain(doc_hash: str) -> bool:
    """Check if a document exists on the blockchain."""
    try:
        contract, _ = get_contract()
        return contract.functions.verifyDocument(doc_hash).call()
    except Exception as exc:
        logger.exception("Failed to verify document on blockchain")
        raise exc

def get_report_from_chain(doc_hash: str) -> Dict[str, Any]:
    """Retrieve the report from the blockchain."""
    try:
        contract, _ = get_contract()
        result = contract.functions.getReport(doc_hash).call()
        
        return {
            "doc_hash": result[0],
            "originality_score": result[1] / 100.0, # unscale
            "plagiarism_risk": result[2],
            "ai_risk": result[3],
            "collusion_risk": result[4],
            "timestamp": result[5],
            "submitter": result[6]
        }
    except Exception as exc:
        logger.exception("Failed to get report from blockchain")
        raise exc
