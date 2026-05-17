"""
collusion.py — Module 5: Collusion Detection
============================================================
Identifies potential collusion rings among multiple students by building
a pairwise similarity matrix, finding clusters, and generating a network graph.

Key components:
  1. TF-IDF + Cosine Similarity matrix for all stored submissions.
  2. DBSCAN clustering (using distance = 1 - similarity) to group students.
  3. NetworkX for building a graph structure (nodes/edges) ready for D3.js frontend.
"""

import logging
from typing import List, Dict, Any, Tuple
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
import networkx as nx

logger = logging.getLogger(__name__)

def detect_collusion(stored_docs: List[Dict[str, Any]], threshold: float = 0.75) -> Dict[str, Any]:
    """
    Detects collusion among a list of preprocessed documents.
    Returns nodes, links, and identified clusters.
    """
    if len(stored_docs) < 2:
        return {
            "nodes": [{"id": doc["doc_id"], "label": doc.get("submitter", doc["filename"])} for doc in stored_docs],
            "links": [],
            "clusters": [],
            "message": "Not enough documents to detect collusion (minimum 2 required)."
        }

    # Prepare data
    doc_ids = [doc["doc_id"] for doc in stored_docs]
    labels = [doc.get("submitter", doc["filename"]) for doc in stored_docs]
    clean_texts = [doc.get("preprocessing", {}).get("clean_text", "") for doc in stored_docs]

    # Handle cases where documents might not be preprocessed yet
    if not any(clean_texts):
        logger.warning("No preprocessed texts found for collusion detection.")
        return {"nodes": [], "links": [], "clusters": [], "message": "Documents must be preprocessed first."}

    # 1. Compute Pairwise Similarity Matrix
    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform(clean_texts)
        sim_matrix = cosine_similarity(tfidf_matrix)
    except ValueError:
        # Happens if texts are empty or only stopwords
        sim_matrix = np.zeros((len(clean_texts), len(clean_texts)))

    # 2. Build Graph using NetworkX
    G = nx.Graph()
    for i, (doc_id, label) in enumerate(zip(doc_ids, labels)):
        G.add_node(doc_id, label=label, group=-1) # Default group -1 (no cluster)

    links = []
    
    # 3. Compute Distance Matrix for DBSCAN (Distance = 1 - Similarity)
    # Clip to avoid floating point issues (e.g., -1e-16)
    dist_matrix = np.clip(1.0 - sim_matrix, 0.0, 1.0)
    
    # 4. DBSCAN Clustering
    # eps is the max distance between two samples to be considered in neighborhood.
    # If threshold is 0.75 similarity, max distance is 0.25.
    eps_val = 1.0 - threshold
    
    # Run DBSCAN
    # min_samples=2 because a collusion group needs at least 2 people.
    dbscan = DBSCAN(eps=eps_val, min_samples=2, metric="precomputed")
    clusters = dbscan.fit_predict(dist_matrix)
    
    # Update nodes with cluster info
    nodes = []
    cluster_groups = {}
    
    for i, doc_id in enumerate(doc_ids):
        cluster_id = int(clusters[i])
        G.nodes[doc_id]["group"] = cluster_id
        nodes.append({
            "id": doc_id,
            "label": labels[i],
            "group": cluster_id
        })
        
        if cluster_id != -1:
            if cluster_id not in cluster_groups:
                cluster_groups[cluster_id] = []
            cluster_groups[cluster_id].append(labels[i])

    # Add edges for pairs above threshold
    num_docs = len(doc_ids)
    for i in range(num_docs):
        for j in range(i + 1, num_docs):
            sim_score = float(sim_matrix[i, j])
            if sim_score >= threshold:
                G.add_edge(doc_ids[i], doc_ids[j], weight=sim_score)
                links.append({
                    "source": doc_ids[i],
                    "target": doc_ids[j],
                    "value": round(sim_score * 100, 2)
                })

    formatted_clusters = [{"cluster_id": k, "members": v} for k, v in cluster_groups.items()]

    logger.info(f"Collusion detection complete. Found {len(links)} flagged pairs and {len(formatted_clusters)} clusters.")

    return {
        "nodes": nodes,
        "links": links,
        "clusters": formatted_clusters,
        "message": f"Detected {len(formatted_clusters)} collusion groups." if formatted_clusters else "No collusion groups detected."
    }
