// waitingListService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

export const waitingListService = {
  // الحصول على جميع المدخلات مع إمكانية التصفية
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.date) {
        params.append('date', filters.date);
      }
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      // بناء URL مع أو بدون معلمات البحث
      const queryString = params.toString();
      const url = queryString ? `/waitinglist?${queryString}` : '/waitinglist';
      
      const response = await apiClient.get(url); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error in getAll:', error);
      
      // تحسين معالجة الأخطاء
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          throw new Error(error.response.data.message || 'فشل في تحميل البيانات');
        }
        throw new Error(error.response.data);
      }
      
      throw new Error(error.message || 'فشل في تحميل البيانات');
    }
  },

  // إنشاء مدخل جديد
  create: async (entryData) => {
    try {
      // تحويل البيانات إلى التنسيق الصحيح
      const formattedData = {
        name: entryData.name,
        date: new Date(entryData.date).toISOString(),
        phoneNumber: entryData.phone,
        address: entryData.address,
        reason: entryData.reason
      };
      
      console.log('Creating entry:', formattedData);
      const response = await apiClient.post('/waitinglist', formattedData); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error in create:', error);
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          throw new Error(error.response.data.message || 'فشل في إضافة المدخل');
        }
        throw new Error(error.response.data);
      }
      
      throw new Error(error.message || 'فشل في إضافة المدخل');
    }
  },

  // تحديث حالة مدخل
  updateStatus: async (id, status) => {
    try {
      console.log(`Updating status for id ${id} to ${status}`);
      const response = await apiClient.patch(`/waitinglist/${id}/status`, // ✅ Use apiClient
        JSON.stringify(status), // Use JSON.stringify instead of template literal
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error in updateStatus:', error);
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          throw new Error(error.response.data.message || 'فشل في تحديث الحالة');
        }
        throw new Error(error.response.data);
      }
      
      throw new Error(error.message || 'فشل في تحديث الحالة');
    }
  },

  // باقي الدوال...
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/waitinglist/${id}`); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error in getById:', error);
      throw new Error(error.response?.data || 'فشل في تحميل المدخل');
    }
  },

  update: async (id, entryData) => {
    try {
      const response = await apiClient.put(`/waitinglist/${id}`, entryData); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error in update:', error);
      throw new Error(error.response?.data || 'فشل في تحديث المدخل');
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/waitinglist/${id}`); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error in delete:', error);
      throw new Error(error.response?.data || 'فشل في حذف المدخل');
    }
  },
};

export default waitingListService;