// medicalEquipmentService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

/* 
 * Medical Equipment Services
 */
export const getMedicalEquipment = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.pageSize) params.append('pageSize', filters.pageSize);

    const response = await apiClient.get(`/MedicalEquipment?${params.toString()}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching medical equipment:', error);
    throw error;
  }
};

export const getEquipmentById = async (equipmentId) => {
  try {
    const response = await apiClient.get(`/MedicalEquipment/${equipmentId}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment details:', error);
    throw error;
  }
};

export const createEquipment = async (equipmentData) => {
  const formData = new FormData();
  
  // Append all fields - optional fields can be empty/null
  formData.append('reference', equipmentData.reference || ''); // Will be ignored by backend
  formData.append('category', equipmentData.category);
  formData.append('brand', equipmentData.brand || '');
  formData.append('source', equipmentData.source || '');
  formData.append('usage', equipmentData.usage);
  formData.append('dateOfEntry', equipmentData.dateOfEntry);
  if (equipmentData.dateOfExit) formData.append('dateOfExit', equipmentData.dateOfExit);
  formData.append('monetaryValue', equipmentData.monetaryValue || '');
  formData.append('acquisitionType', equipmentData.acquisitionType);
  formData.append('status', equipmentData.status);
  formData.append('description', equipmentData.description || ''); // Optional - can be empty
  
  // Append the file only if it exists (optional)
  if (equipmentData.legalFile) {
    formData.append('legalFile', equipmentData.legalFile);
  }

  try {
    const response = await apiClient.post('/MedicalEquipment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateEquipmentDetails = async (id, editedEquipment) => {
  try {
    const formData = new FormData();
    
    // Only append the 4 fields that the backend accepts
    formData.append('Id', id);
    
    if (editedEquipment.dateOfEntry) {
      formData.append('DateOfEntry', editedEquipment.dateOfEntry);
    }
    
    if (editedEquipment.dateOfExit) {
      formData.append('DateOfExit', editedEquipment.dateOfExit);
    }
    
    if (editedEquipment.status) {
      formData.append('Status', editedEquipment.status);
    }
    
    // Only append file if it exists AND is a File object
    if (editedEquipment.legalFile instanceof File) {
      formData.append('LegalFile', editedEquipment.legalFile);
    }

    const response = await apiClient.put(
      `/MedicalEquipment/${id}/update-details`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteEquipment = async (equipmentId) => {
  try {
    await apiClient.delete(`/MedicalEquipment/${equipmentId}`); // ✅ Use apiClient
  } catch (error) {
    console.error('Error deleting equipment:', error);
    throw error;
  }
};

/* 
 * Dispatch Services
 */
export const getDispatchHistory = async (equipmentId) => {
  try {
    const response = await apiClient.get(`/MedicalEquipment/${equipmentId}/dispatches`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching dispatch history:', error);
    throw error;
  }
};

export const createDispatchRecord = async (equipmentId, dispatchData) => {
  try {
    const response = await apiClient.post(`/MedicalEquipment/${equipmentId}/dispatches`, dispatchData); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error creating dispatch record:', error);
    throw error;
  }
};

export const getAllDispatches = async () => {
  try {
    const response = await apiClient.get('/EquipmentDispatch'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    throw error;
  }
};

export const getOngoingDispatches = async () => {
  try {
    const response = await apiClient.get('/EquipmentDispatch/ongoing'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching ongoing dispatches:', error);
    throw error;
  }
};

export const getCompletedDispatches = async () => {
  try {
    const response = await apiClient.get('/EquipmentDispatch/history'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching completed dispatches:', error);
    throw error;
  }
};

// Updated createDispatch function - simpler version
export const createDispatch = async (formData) => {
  try {
    // Validate that we have a FormData object
    if (!(formData instanceof FormData)) {
      throw new Error('FormData object is required');
    }

    const response = await apiClient.post('/EquipmentDispatch', formData, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

// Add download function
export const downloadDispatchFile = async (dispatchId) => {
  try {
    const response = await apiClient.get(`/EquipmentDispatch/download/${dispatchId}`, { // ✅ Use apiClient
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const markDispatchReturned = async (id, returnData) => {
  try {
    const response = await apiClient.patch( // ✅ Use apiClient
      `/EquipmentDispatch/${id}/return`,
      {
        ReturnDate: new Date(returnData.returnDate).toISOString(), // Match backend expectation
        ReturnNotes: returnData.returnNotes || 'لا توجد ملاحظات'  // Match backend expectation
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking dispatch as returned:', error);
    throw error;
  }
};

export const deleteDispatch = async (id) => {
  try {
    await apiClient.delete(`/EquipmentDispatch/${id}`); // ✅ Use apiClient
  } catch (error) {
    console.error('Error deleting dispatch:', error);
    throw error;
  }
};

export const getDispatchesByEquipment = async (equipmentId) => {
  try {
    const response = await apiClient.get(`/EquipmentDispatch/equipment/${equipmentId}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching equipment dispatches:', error);
    throw error;
  }
};

export const searchDispatches = async (searchTerm) => {
  try {
    const response = await apiClient.get(`/EquipmentDispatch/search?term=${encodeURIComponent(searchTerm)}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error searching dispatches:', error);
    throw error;
  }
};

export const getAvailableEquipment = async (usageType = 'للاعارة') => {
  try {
    // Pass usage type as query parameter if you implemented Solution 2
    const response = await apiClient.get('/EquipmentDispatch/available-equipment', {
      params: { usageType }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available equipment:', error);
    throw error;
  }
};

