// deliberationService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

const deliberationService = {
  async getAll(filter = {}) {
    try {
      const response = await apiClient.get('/deliberations', {
        params: filter,
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        }
      });
      
      return response.data.map(deliberation => ({
        ...deliberation,
        documentPath: deliberation.documentPath,
        attendees: deliberation.attendees?.map(a => a.name) || [],
        // Remove decisionsWithDetails completely
      }));
    } catch (error) {
      console.error('Error fetching deliberations:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/deliberations/${id}`);
      const deliberation = response.data;
      return {
        ...deliberation,
        attendees: deliberation.attendees?.map(a => a.name).join(', ') || '',
        // Remove decisionsWithDetails completely
      };
    } catch (error) {
      console.error(`Error getting deliberation with id ${id}:`, error);
      throw error;
    }
  },

async create(deliberationData) {
  try {
    const formData = new FormData();
    
    // Use EXACT property names that match backend DTO
    formData.append('Number', deliberationData.number);
    formData.append('DateTime', deliberationData.dateTime);
    formData.append('Attendees', deliberationData.attendees);
    
    // Document
    if (deliberationData.document) {
      formData.append('Document', deliberationData.document);
    }

    const response = await apiClient.post('/deliberations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating deliberation:', error);
    
    // Better error handling
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw new Error(error.message || 'Failed to create deliberation');
  }
},

  async delete(id) {
    try {
      await apiClient.delete(`/deliberations/${id}`); // ✅ Use apiClient
    } catch (error) {
      console.error(`Error deleting deliberation with id ${id}:`, error);
      throw error;
    }
  },

  async downloadDocument(id) {
    try {
      const response = await apiClient.get(`/deliberations/${id}/document`, { // ✅ Use apiClient
        responseType: 'blob',
      });
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition or use a default
      let filename = 'document.pdf';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        filename = disposition.split('filename=')[1].split(';')[0].replace(/"/g, '');
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error(`Error downloading document: ${error}`);
      throw error;
    }
  },

  async getCommittees() {
    try {
      const response = await apiClient.get('/deliberations/committees'); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error getting committee names:', error);
      return [
        "لجنة الشباب",
        "لجنة التخطيط و الدراسات",
        "لجنة الصحة",
        "لجنة الأسرة",
        "لجنة التنمية",
        "لجنة الكفالة",
        "الهيئة المديرة",
        "لجنة وقتية"
      ];
    }
  },
};

export default deliberationService;