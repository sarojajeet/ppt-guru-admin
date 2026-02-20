import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:5000/api",

  baseURL: "https://lionfish-app-pk8s6.ondigitalocean.app/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const loginAdmin = (credentials) => {
  return API.post("/admin/login", credentials);
};

export const analyzeDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/document/analyze", formData);
};

/**
 * Get document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise} Document data
 */
export const getDocument = async (documentId) => {
  return API.get(`/document/${documentId}`);
};
/**
 * Update document content
 * @param {string} documentId - Document ID
 * @param {string} content - Updated markdown content
 * @returns {Promise} Updated document
 */
export const updateDocument = async (documentId, content) => {
  return API.put(`/document/${documentId}`, { content });
};

/**
 * Get all documents
 * @returns {Promise} List of documents
 */
export const getAllDocuments = async () => {
  return API.get('/document');
};

/**
 * Generate final document (PDF or PPT)
 * @param {string} documentId - Document ID
 * @param {string} format - 'A4' for PDF or 'PPT' for PowerPoint
 * @returns {Promise} Response with downloadUrl and fileName
 */
export const generateFinalDocument = async (documentId, format) => {
  return API.post('/document/generate', {
    documentId,
    format,
  });
};
