import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const client = axios.create({ baseURL: API_BASE_URL });

export const uploadDocuments = async (files, submitter) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (submitter) formData.append('submitter', submitter);
  const res = await client.post('/upload', formData);
  return res.data;
};

export const preprocessDocument = async (docId) => {
  const res = await client.post(`/preprocess/${docId}`);
  return res.data;
};

export const checkSimilarity = async (docId) => {
  const res = await client.post(`/similarity/${docId}`);
  return res.data;
};

export const detectAI = async (text) => {
  const res = await client.post('/ai-detect', { text });
  return res.data;
};

export const checkCollusion = async (threshold = 0.75) => {
  const res = await client.post(`/collusion?threshold=${threshold}`);
  return res.data;
};

export const getScore = async (plagiarism, ai, collusion) => {
  const res = await client.post('/score', {
    plagiarism_percent: plagiarism,
    ai_percent: ai,
    collusion_risk_percent: collusion,
  });
  return res.data;
};

export const storeBlockchain = async (docId, scoreData) => {
  const res = await client.post('/blockchain/store', {
    doc_id: docId,
    originality_score: scoreData.originality_score,
    plagiarism_risk: scoreData.plagiarism_risk,
    ai_risk: scoreData.ai_risk,
    collusion_risk: scoreData.collusion_risk,
  });
  return res.data;
};

export const verifyBlockchain = async (docHash) => {
  const res = await client.get(`/blockchain/verify/${docHash}`);
  return res.data;
};

export const listDocuments = async () => {
  const res = await client.get('/documents');
  return res.data;
};

export const deleteDocument = async (docId) => {
  const res = await client.delete(`/documents/${docId}`);
  return res.data;
};

export default client;
