// suppliesService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

export const createSuppliesBasic = async (formData) => {
  try {
    const response = await apiClient.post('/supplies/create', formData, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Create supplies error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to create supplies');
  }
};

export const addSuppliesItems = async (suppliesId, items) => {
  try {
    const response = await apiClient.post(`/supplies/${suppliesId}/items`, items); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Add supplies items error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to add supplies items');
  }
};

export const getSupplies = async (params) => {
  try {
    const response = await apiClient.get('/supplies', { params }); // ✅ Use apiClient
    return {
      data: response.data,
      totalCount: response.headers['x-total-count'] || response.data.length || 0,
    };
  } catch (error) {
    console.error('Get supplies error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch supplies');
  }
};

export const updateSupplies = async (id, formData) => {
  try {
    const response = await apiClient.put(`/supplies/${id}`, formData, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Update supplies error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to update supplies');
  }
};

export const deleteSupplies = async (id) => {
  try {
    const response = await apiClient.delete(`/supplies/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Delete supplies error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete supplies');
  }
};

export const downloadLegalFile = async (id) => {
  try {
    const response = await apiClient.get(`/supplies/download/${id}`, { // ✅ Use apiClient
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `supplies_${id}_legal_file.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return response.data;
  } catch (error) {
    console.error('Download legal file error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to download legal file');
  }
};

// services/suppliesService.js - Add these functions
export const getSuppliesByProject = async (projectId) => {
  try {
    const response = await apiClient.get(`/supplies/by-project/${projectId}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching supplies by project:', error);
    throw error;
  }
};

export const getPurchasesByProject = async (projectId) => {
  try {
    const response = await apiClient.get(`/supplies/by-project/${projectId}?nature=Purchase`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching purchases by project:', error);
    throw error;
  }
};

export const getDonationsByProject = async (projectId) => {
  try {
    const response = await apiClient.get(`/supplies/by-project/${projectId}?nature=Donation`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching donations by project:', error);
    throw error;
  }
};

export const getDonationsCount = async () => {
  try {
    const response = await apiClient.get('/supplies', {
      params: { nature: 'Donation' }
    });
    return response.data.length; // Count of donations
  } catch (error) {
    console.error('Error fetching donations count:', error);
    throw error;
  }
};

export const getDonationsTotalValue = async () => {
  try {
    const response = await apiClient.get('/supplies', {
      params: { nature: 'Donation' }
    });
    // Sum all monetary values from donations
    const totalValue = response.data.reduce((sum, supply) => sum + (supply.monetaryValue || 0), 0);
    return totalValue;
  } catch (error) {
    console.error('Error fetching donations total value:', error);
    throw error;
  }
};