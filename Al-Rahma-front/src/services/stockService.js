// src/services/stockService.js
import { apiClient } from '../config/api';

const stockService = {
  // Get all stocks with optional filters
  getStocks: async (filters = {}) => {
    try {
      // Only include parameters that have actual values
      const params = {};
      
      if (filters.categoryId && filters.categoryId > 0) {
        params.categoryId = filters.categoryId;
      }
      
      if (filters.subCategoryId && filters.subCategoryId > 0) {
        params.subCategoryId = filters.subCategoryId;
      }
      
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        params.searchTerm = filters.searchTerm.trim();
      }
      
      
      const response = await apiClient.get('/stocks', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stocks:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Get stock summary
  getStockSummary: async () => {
    try {
      const response = await apiClient.get('/stocks/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      throw error;
    }
  },

  // Get specific stock by ID
  getStock: async (id) => {
    try {
      if (!id || id <= 0) {
        throw new Error('Invalid stock ID');
      }
      const response = await apiClient.get(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stock ${id}:`, error);
      throw error;
    }
  },

  // Get stock transactions
  getStockTransactions: async (stockId) => {
    try {
      if (!stockId || stockId <= 0) {
        throw new Error('Invalid stock ID');
      }
      const response = await apiClient.get(`/stocks/${stockId}/transactions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transactions for stock ${stockId}:`, error);
      throw error;
    }
  },

  // Adjust stock quantity
  adjustStock: async (stockId, adjustment) => {
    try {
      if (!stockId || stockId <= 0) {
        throw new Error('Invalid stock ID');
      }
      if (!adjustment || adjustment.quantityChange === 0) {
        throw new Error('Invalid adjustment data');
      }
      const response = await apiClient.put(`/stocks/${stockId}/adjust`, adjustment);
      return response.data;
    } catch (error) {
      console.error(`Error adjusting stock ${stockId}:`, error);
      throw error;
    }
  },

  // Get low stock items
  getLowStockItems: async () => {
    try {
      const response = await apiClient.get('/stocks/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get out of stock items
  getOutOfStockItems: async () => {
    try {
      const response = await apiClient.get('/stocks/out-of-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching out of stock items:', error);
      throw error;
    }
  }
};

export default stockService;