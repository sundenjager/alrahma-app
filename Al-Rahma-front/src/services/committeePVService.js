import { apiClient } from '../config/api';

const committeePVService = {
  async getAll() {
    try {
      const response = await apiClient.get('/committeePV', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });


      return response.data.map(item => ({
        id: item.id,
        number: item.number,
        dateTime: item.dateTime,
        committee: item.committee,
        documentPath: item.documentPath,
        attendees: item.attendees || [],
        // Remove points mapping
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching committee PVs:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/committeePV/${id}`);
      return {
        id: response.data.id,
        number: response.data.number,
        dateTime: response.data.dateTime,
        committee: response.data.committee,
        documentPath: response.data.documentPath,
        attendees: response.data.attendees || [],
        // Remove points
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt
      };
    } catch (error) {
      console.error(`Error getting PV with id ${id}:`, error);
      throw error;
    }
  },

  async create(pvData) {
    try {
      const formData = new FormData();
      formData.append('Number', pvData.number);
      formData.append('DateTime', pvData.dateTime);
      formData.append('Committee', pvData.committee);
      
      if (pvData.document) {
        formData.append('Document', pvData.document);
      }
      
      const attendeesArray = Array.isArray(pvData.attendees) 
        ? pvData.attendees 
        : [pvData.attendees].filter(Boolean);
      
      attendeesArray.forEach((attendee, index) => {
        formData.append(`Attendees[${index}]`, attendee.trim());
      });
      
      // Remove points handling

      const response = await apiClient.post('/committeePV', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        id: response.data.id,
        ...response.data
      };
    } catch (error) {
      console.error('Error creating committee PV:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      await apiClient.delete(`/committeePV/${id}`);
    } catch (error) {
      console.error(`Error deleting PV with id ${id}:`, error);
      throw error;
    }
  },

  async downloadDocument(id) {
    try {
      const response = await apiClient.get(`/committeePV/${id}/document`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'committee-pv-document.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error(`Error downloading document for PV ${id}:`, error);
      throw error;
    }
  },

  async getCommitteeNames() {
    try {
      const response = await apiClient.get('/committeePV/committees');
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
        "لجنة الاعلام"
      ];
    }
  },

};

export default committeePVService;