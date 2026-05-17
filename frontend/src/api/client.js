import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadDocuments = async (files, submitter) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (submitter) formData.append('submitter', submitter);
  const response = await client.post('/upload', formData);
  return response.data;
};

export const preprocessDocument = async (docId) => {
  const response = await client.post(`/preprocess/${docId}`);
  return response.data;
};

export const checkSimilarity = async (docId) => {
  const response = await client.post(`/similarity/${docId}`);
  return response.data;
};

export const detectAI = async (text) => {
  const response = await client.post('/ai-detect', { text });
  return response.data;
};

export const checkCollusion = async () => {
  const response = await client.post('/collusion?threshold=0.75');
  return response.data;
};

export const getScore = async (plagiarism, ai, collusion) => {
  const response = await client.post('/score', {
    plagiarism_percent: plagiarism,
    ai_percent: ai,
    collusion_risk_percent: collusion
  });
  return response.data;
};

export const storeBlockchain = async (docId, scoreData) => {
  const response = await client.post('/blockchain/store', {
    doc_id: docId,
    originality_score: scoreData.originality_score,
    plagiarism_risk: scoreData.plagiarism_risk,
    ai_risk: scoreData.ai_risk,
    collusion_risk: scoreData.collusion_risk
  });
  return response.data;
};

export default client;
