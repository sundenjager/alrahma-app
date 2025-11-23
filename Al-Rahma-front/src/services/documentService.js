import axios from 'axios';
import { getAuthHeader } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5273/api';

// Helper function to handle auth errors
const handleAuthError = (error) => {
  if (error.response?.status === 401) {
    // Token expired or invalid
    window.location.reload(); // Refresh to redirect to login
  }
  throw error;
};

// Get all documents
export const getDocuments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/documents`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    handleAuthError(error);
    throw new Error(error.response?.data?.message || 'Failed to fetch documents');
  }
};

// Get a specific document by ID
export const getDocument = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    handleAuthError(error);
    throw new Error(error.response?.data?.message || 'Failed to fetch document');
  }
};

// Upload a document
export const uploadDocument = async (file, documentType) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  try {
    console.log('Uploading document:', file.name, 'Type:', documentType);
    const response = await axios.post(`${API_BASE_URL}/documents`, formData, {
      headers: {
        ...getAuthHeader(),
      },
      timeout: 60000,
      maxContentLength: 30 * 1024 * 1024 // 30MB
    });
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    handleAuthError(error);
    throw new Error(error.response?.data?.message || 'Failed to upload document');
  }
};

// Delete a document
export const deleteDocument = async (id) => {
  try {
    await axios.delete(`${API_BASE_URL}/documents/${id}`, {
      headers: getAuthHeader()
    });
    return true;
  } catch (error) {
    handleAuthError(error);
    throw new Error(error.response?.data?.message || 'Failed to delete document');
  }
};

// Download a document
export const downloadDocument = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/documents/download/${id}`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    handleAuthError(error);
    throw new Error(error.response?.data?.message || 'Failed to download document');
  }
};

// Update a document
export const updateDocument = async (id, documentData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/documents/${id}`, documentData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    handleAuthError(error);
    throw new Error(error.response?.data?.message || 'Failed to update document');
  }
}; 