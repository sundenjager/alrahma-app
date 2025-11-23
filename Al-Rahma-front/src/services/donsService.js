// donsService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

// Helper function to convert FormData to object
const formDataToObject = (formData) => {
  const object = {};
  formData.forEach((value, key) => {
    // Convert empty strings to null
    object[key] = value === '' ? null : value;
  });
  return object;
};

// Get all dons
export const getDons = async () => {
  try {
    const response = await apiClient.get('/dons'); // ✅ Use apiClient
    
    // Ensure we always return an object with a data property
    return {
      data: Array.isArray(response.data) ? response.data : [],
      status: response.status,
      statusText: response.statusText
    };
    
  } catch (error) {
    console.error('Error fetching dons:', error);
    
    // Return consistent structure even on error
    return {
      data: [],
      status: error.response?.status || 500,
      statusText: error.response?.statusText || 'Internal Server Error'
    };
  }
};

// Get a single dons by ID
export const getDonsById = async (id) => {
  try {
    const response = await apiClient.get(`/dons/${id}`); // ✅ Use apiClient
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error(`Error fetching dons with id ${id}:`, error);
    throw error.response?.data || error.message;
  }
}

// Create a new dons
export async function createDons(donsData) {
  try {
    // If it's FormData, convert to regular object
    const data = donsData instanceof FormData 
      ? formDataToObject(donsData) 
      : donsData;

    const response = await apiClient.post('/dons', data, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating dons:', error);
    if (error.response?.data?.errors) {
      // Convert backend errors to frontend format
      const backendErrors = {};
      Object.keys(error.response.data.errors).forEach(key => {
        backendErrors[key] = error.response.data.errors[key].join(', ');
      });
      throw backendErrors;
    }
    throw error.response?.data || error.message;
  }
}

// Update a dons
export async function updateDons(id, donsData) {
  try {
    // If it's FormData, convert to regular object
    const data = donsData instanceof FormData 
      ? formDataToObject(donsData) 
      : donsData;

    const response = await apiClient.put(`/dons/${id}`, data, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error updating dons with id ${id}:`, error);
    if (error.response?.data?.errors) {
      // Convert backend errors to frontend format
      const backendErrors = {};
      Object.keys(error.response.data.errors).forEach(key => {
        backendErrors[key] = error.response.data.errors[key].join(', ');
      });
      throw backendErrors;
    }
    throw error.response?.data || error.message;
  }
}

// Delete a dons
export async function deleteDons(id) {
  try {
    const response = await apiClient.delete(`/dons/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error deleting dons with id ${id}:`, error);
    throw error.response?.data || error.message;
  }
}

// Download legal file
export const downloadFile = async (id, fileName) => {
  try {
    const response = await apiClient.get(`/dons/download/${id}`, { // ✅ Use apiClient
      responseType: 'blob', // Important for file downloads
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from Content-Disposition header if available
    let downloadFileName = fileName;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    // Ensure the filename has the correct extension
    if (!downloadFileName.match(/\.(pdf|docx?|xlsx?|jpe?g|png)$/i)) {
      // Add default extension if missing
      downloadFileName += '.pdf'; // or determine from Content-Type
    }

    link.setAttribute('download', downloadFileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

// Update execution status
export async function updateExecutionStatus(id, executionData) {
  try {
    const response = await apiClient.patch(`/dons/${id}/execution`, executionData); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error updating execution status for dons with id ${id}:`, error);
    throw error.response?.data || error.message;
  }
}