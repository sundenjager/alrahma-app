// equipmentCategoryService.js
import { apiClient } from '../config/api';

export const getCategories = async () => {
  try {
    const response = await apiClient.get('/EquipmentCategory');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
    return [];
  }
};

export const getCategoryById = async (id) => {
  try {
    const response = await apiClient.get(`/EquipmentCategory/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await apiClient.post('/EquipmentCategory', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await apiClient.put(`/EquipmentCategory/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    await apiClient.delete(`/EquipmentCategory/${id}`);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};