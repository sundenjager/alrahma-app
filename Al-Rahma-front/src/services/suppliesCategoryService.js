// suppliesCategoryService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

// Category Services
export const getSuppliesCategories = async () => {
  try {
    const response = await apiClient.get('/suppliescategories'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching supplies categories:', error);
    throw error;
  }
};

export const getSuppliesCategoryById = async (id) => {
  try {
    const response = await apiClient.get(`/suppliescategories/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error fetching supplies category with ID ${id}:`, error);
    throw error;
  }
};

export const createSuppliesCategory = async (categoryData) => {
  try {
    const payload = {
      name: categoryData.name,
      description: categoryData.description || ''
    };
    
    const response = await apiClient.post('/suppliescategories', payload, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating supplies category:', error);
    // Extract server error message if available
    const errorMessage = error.response?.data?.title || 
                        error.response?.data || 
                        'Failed to create supplies category';
    throw new Error(errorMessage);
  }
};

export const updateSuppliesCategory = async (id, categoryData) => {
  try {
    const payload = {
      id: id,
      name: categoryData.name,
      description: categoryData.description || ''
    };
    
    const response = await apiClient.put(`/suppliescategories/${id}`, payload, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating supplies category with ID ${id}:`, error);
    const errorMessage = error.response?.data?.title || 
                        error.response?.data || 
                        'Failed to update supplies category';
    throw new Error(errorMessage);
  }
};

export const deleteSuppliesCategory = async (id) => {
  try {
    const response = await apiClient.delete(`/suppliescategories/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error deleting supplies category with ID ${id}:`, error);
    throw error;
  }
};

// Subcategory Services
export const getSuppliesSubCategories = async () => {
  try {
    const response = await apiClient.get('/suppliessubcategories'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching supplies subcategories:', error);
    throw error;
  }
};

export const getSubCategoriesByCategory = async (categoryId) => {
  try {
    const response = await apiClient.get(`/suppliessubcategories/by-category/${categoryId}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error fetching subcategories for category ${categoryId}:`, error);
    throw error;
  }
};

export const getSuppliesSubCategoryById = async (id) => {
  try {
    const response = await apiClient.get(`/suppliessubcategories/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error fetching supplies subcategory with ID ${id}:`, error);
    throw error;
  }
};

export const createSuppliesSubCategory = async (subCategoryData) => {
  try {
    // Ensure proper data types
    const payload = {
      name: subCategoryData.name?.trim() || '',
      unitPrice: Number(subCategoryData.unitPrice) || 0,
      suppliesCategoryId: Number(subCategoryData.suppliesCategoryId) || null
    };

    // Validate required fields
    if (!payload.name) {
      throw new Error('Subcategory name is required');
    }
    if (!payload.suppliesCategoryId) {
      throw new Error('Category selection is required');
    }
    if (isNaN(payload.unitPrice)) {
      throw new Error('Unit price must be a number');
    }

    const response = await apiClient.post('/suppliessubcategories', payload, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating supplies subcategory:', error);
    
    // Extract detailed validation errors if available
    let errorMessage = 'Failed to create subcategory';
    if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat();
      errorMessage = errors.join('\n');
    } else if (error.response?.data) {
      errorMessage = error.response.data.title || JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

export const updateSuppliesSubCategory = async (id, subCategoryData) => {
  try {
    const payload = {
      id: id,
      name: subCategoryData.name.trim(),
      unitPrice: parseFloat(subCategoryData.unitPrice) || 0,
      suppliesCategoryId: parseInt(subCategoryData.suppliesCategoryId)
    };
    
    const response = await apiClient.put(`/suppliessubcategories/${id}`, payload, { // ✅ Use apiClient
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating supplies subcategory with ID ${id}:`, error);
    const errorMessage = error.response?.data?.title || 
                        error.response?.data || 
                        'Failed to update supplies subcategory';
    throw new Error(errorMessage);
  }
};

export const deleteSuppliesSubCategory = async (id) => {
  try {
    const response = await apiClient.delete(`/suppliessubcategories/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error(`Error deleting supplies subcategory with ID ${id}:`, error);
    throw error;
  }
};

// Combined service object
const suppliesCategoryService = {
  // Categories
  getSuppliesCategories,
  getSuppliesCategoryById,
  createSuppliesCategory,
  updateSuppliesCategory,
  deleteSuppliesCategory,
  
  // Subcategories
  getSuppliesSubCategories,
  getSubCategoriesByCategory,
  getSuppliesSubCategoryById,
  createSuppliesSubCategory,
  updateSuppliesSubCategory,
  deleteSuppliesSubCategory
};

export default suppliesCategoryService;