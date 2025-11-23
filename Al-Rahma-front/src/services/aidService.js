// src/services/aidService.js
import { apiClient } from '../config/api'; // ✅ Use centralized apiClient

export const createAidBasic = async (formData) => {
  try {
    const response = await apiClient.post('/aid/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Create aid error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create aid');
  }
};

export const addAidItems = async (aidId, items) => {
  try {
    const response = await apiClient.post(`/aid/${aidId}/items`, items, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Add aid items error:', error.response?.data || error.message);
    
    // Extract meaningful error message
    let errorMessage = 'Failed to add aid items';
    
    if (error.response?.data) {
      if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.details) {
        errorMessage = error.response.data.details;
      } else if (error.response.data.title) {
        errorMessage = error.response.data.title;
      }
      
      // Handle validation errors
      if (error.response.data.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage += ` - ${validationErrors}`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

export const getAid = async (params) => {
  try {
    const response = await apiClient.get('/aid', { params });
    return {
      data: response.data,
      totalCount: response.headers['x-total-count'] || response.data.length || 0,
    };
  } catch (error) {
    console.error('Get aids error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch aids');
  }
};

export const updateAid = async (id, formData) => {
  try {
    const response = await apiClient.put(`/aid/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Update aid error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to update aid');
  }
};

export const deleteAid = async (id) => {
  try {
    const response = await apiClient.delete(`/aid/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete aid error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete aid');
  }
};

export const downloadLegalFile = async (id) => {
  try {
    const response = await apiClient.get(`/aid/download/${id}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aid_${id}_legal_file.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return response.data;
  } catch (error) {
    console.error('Download legal file error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to download legal file');
  }
};

export const getSubCategoriesWithStock = async () => {
  try {
    const response = await apiClient.get('/aid/subcategories/with-stock');
    return response.data;
  } catch (error) {
    console.error('Get subcategories with stock error:', error.response?.data || error.message);
    
    // Fallback: return empty array instead of throwing error
    console.warn('Using fallback: returning empty subcategories array');
    return [];
  }
};

export const getAidsByProject = async (projectId) => {
  try {
    const response = await apiClient.get(`/aid/by-project/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Get aids by project error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch project aids');
  }
};