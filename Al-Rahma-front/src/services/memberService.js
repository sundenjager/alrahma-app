// memberService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

// Fetch all members
export const fetchMembers = async () => {
  try {
    const response = await apiClient.get('/members'); // ✅ Use apiClient
    return response.data.map(member => ({
      ...member,
      updateDates: member.updateDates || []
    }));
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(`Failed to fetch members: ${errorMessage}`);
  }
};

// Add a new member
export const addMember = async (memberData) => {
  try {
    const dataToSend = {
      ...memberData,
      birthDate: memberData.birthDate || null,
      isActive: memberData.isActive !== undefined ? memberData.isActive : true
    };
    const response = await apiClient.post('/members', dataToSend); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.title || error.message;
    throw new Error(errorMsg || "Failed to add member.");
  }
};

// Update a member
export const updateMember = async (id, member) => {
  try {
    const dataToSend = {
      ...member,
      birthDate: member.birthDate || null,
      isActive: member.isActive !== undefined ? member.isActive : true
    };
    
    const response = await apiClient.put(`/members/${id}`, dataToSend); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(`Failed to update member: ${errorMessage}`);
  }
};

// Delete a member
export const deleteMember = async (id) => {
  try {
    const response = await apiClient.delete(`/members/${id}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data || 
                        error.message || 
                        'Failed to delete member';
    throw new Error(errorMessage);
  }
};

// Add an update date to a member
export const addUpdateDate = async (id, date) => {
  try {
    const response = await apiClient.post(`/members/${id}/update-dates`, { date }); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(`Failed to add update date: ${errorMessage}`);
  }
};

export const checkCINUnique = async (cin) => {
  try {
    const response = await apiClient.get('/members/check-cin-unique', { // ✅ Use apiClient
      params: { cin }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking CIN uniqueness:', error);
    return false;
  }
};

export const getMembersByMembershipYear = async (year) => {
  try {
    const response = await apiClient.get('/members/by-membership-year', { // ✅ Use apiClient
      params: { year }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    throw new Error(`Failed to fetch members by year: ${errorMessage}`);
  }
};

export const getAvailableYears = async () => {
  try {
    const response = await apiClient.get('/members/available-years'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching available years:', error);
    return [];
  }
};

export const fetchActivePreviousYearMembers = async () => {
  try {
    const response = await apiClient.get('/members/active-previous-year'); // ✅ Use apiClient
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    return response.data.map(member => ({
      ...member,
      lastUpdateDate: member.lastUpdateDate ? new Date(member.lastUpdateDate) : null,
      dateOfMembership: new Date(member.dateOfMembership),
      membershipDuration: calculateMembershipDuration(
        new Date(member.dateOfMembership),
        member.lastUpdateDate ? new Date(member.lastUpdateDate) : null
      ),
      eligibilityYear: previousYear,
      isEligible: isMemberEligible(
        new Date(member.dateOfMembership),
        member.lastUpdateDate ? new Date(member.lastUpdateDate) : null,
        previousYear
      )
    }));
  } catch (error) {
    throw new Error(`Failed to fetch active members: ${error.response?.data?.message || error.message}`);
  }
};

export const getMembersByCommitteeAndYear = async (committee, year = new Date().getFullYear()) => {
  try {


    if (!committee || committee.trim() === '') {
      throw new Error('Committee parameter is required');
    }

    const response = await apiClient.get('/members/by-committee-and-year', { // ✅ Use apiClient
      params: {
        volunteerField: committee.trim(),
        year: year
      }
    });
    
    
    // Process data
    const processedMembers = response.data.map(member => {
      const name = member.name || member.Name || '';
      const lastname = member.lastname || member.Lastname || ''; 
      const fullName = `${name} ${lastname}`.trim() || 'اسم غير محدد';
      
      return {
        id: member.id || member.Id,
        name: name,
        lastname: lastname,
        fullName: fullName,
        cin: member.cin || member.Cin || '',
        tel: member.tel || member.Tel || '',
        volunteerField: member.volunteerField || member.VolunteerField || '',
        isActive: member.isActive !== undefined ? member.isActive : true,
        dateOfMembership: member.dateOfMembership || member.DateOfMembership,
        ...member
      };
    });

    return processedMembers;
    
  } catch (error) {
    console.error('getMembersByCommitteeAndYear Error:', error);
    
    if (error.response?.status === 404) {
      const errorData = error.response.data;
      
      // Return empty array instead of throwing error for 404
      return [];
    } else if (error.response?.status === 500) {
      throw new Error(`خطأ في الخادم: ${error.response.data?.message || 'حاول مرة أخرى لاحقاً'}`);
    } else {
      throw new Error(`فشل في جلب أعضاء اللجنة: ${error.message}`);
    }
  }
};

// Helper functions
const calculateMembershipDuration = (joinDate, lastUpdateDate = null) => {
  const referenceDate = lastUpdateDate || new Date();
  return (referenceDate.getFullYear() - joinDate.getFullYear()) * 12 + 
        (referenceDate.getMonth() - joinDate.getMonth());
};

const isMemberEligible = (joinDate, lastUpdateDate, targetYear) => {
  return joinDate.getFullYear() === targetYear || 
        (lastUpdateDate && lastUpdateDate.getFullYear() === targetYear);
};