import { apiClient } from '../config/api'; // ✅ Use centralized client

const actImmService = {
  // Get all ActImms with filters and pagination
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/ActImm', { // ✅ Use apiClient
        params,
        headers: {
          'Accept-Language': 'ar'
        }
      });
      
      return {
        data: response.data.map(item => ({
          ...item,
          category: item.category?.name || 'غير محدد'
        })),
        totalCount: parseInt(response.headers['x-total-count']) || 0
      };
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
      throw error;
    }
  },

  // Get single ActImm by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/ActImm/${id}`); // ✅ Use apiClient
      return {
        ...response.data,
        category: response.data.categoryId // Return just the ID for forms
      };
    } catch (error) {
      console.error(`Error fetching asset ${id}:`, error);
      throw error;
    }
  },

  // Create new ActImm
  create: async (formData) => {
    try {
      const response = await apiClient.post('/ActImm', formData, { // ✅ Use apiClient
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  },

  // Update ActImm
  update: async (id, formData) => {
    try {
      const response = await apiClient.put(`/ActImm/${id}`, formData, { // ✅ Use apiClient
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating asset ${id}:`, error);
      throw error;
    }
  },

  // Delete ActImm
  delete: async (id) => {
    try {
      await apiClient.delete(`/ActImm/${id}`); // ✅ Use apiClient
    } catch (error) {
      console.error(`Error deleting asset ${id}:`, error);
      throw error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await apiClient.get('/ActImmCategory'); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

 // Category CRUD operations
createCategory: async (categoryData) => {
  try {
    const response = await apiClient.post('/ActImmCategory', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
},

updateCategory: async (id, categoryData) => {
  try {
    // Send the full category object that backend expects
    const updateData = {
      id: id,
      name: categoryData.name,
      description: categoryData.description || '',
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      createdAt: categoryData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const response = await apiClient.put(`/ActImmCategory/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    throw error;
  }
},

deleteCategory: async (id) => {
  try {
    await apiClient.delete(`/ActImmCategory/${id}`);
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
},

// Get all categories including inactive ones (for management)
getAllCategories: async (includeInactive = false) => {
  try {
    const response = await apiClient.get('/ActImmCategory/all', {
      params: { includeInactive }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all categories:', error);
    throw error;
  }
},

  // Get file URL
  getFileUrl: (filePath) => {
    return filePath ? `/ActImm/download/${filePath}` : null; // ✅ Remove API_URL prefix
  },

  // Download file method
  downloadFile: async (filePath, fileName = null) => {
    try {
      if (!filePath) throw new Error('No file path provided');
      
      const response = await apiClient.get(`/ActImm/download/${filePath}`, { // ✅ Use apiClient
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Use provided filename or extract from content-disposition
      const downloadFileName = fileName || 
        response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') ||
        filePath.split('/').pop();
      
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Get file information
  getFileInfo: async (id) => {
    try {
      const response = await apiClient.get(`/ActImm/fileinfo/${id}`); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  },

  // Preview file in new tab
  previewFile: (filePath) => {
    if (!filePath) return;
    
    const fileUrl = `/ActImm/download/${filePath}`; // ✅ Remove API_URL prefix
    window.open(fileUrl, '_blank');
  }

};

export default actImmService;