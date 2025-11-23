// membershipHistoryService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

// Fetch members who did not update their membership this year
export const getMembersNotUpdatedThisYear = async () => {
  try {
    const response = await apiClient.get('/MembershipHistory/not-updated-this-year'); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    throw new Error('فشل في جلب الأعضاء الذين لم يجددوا عضويتهم هذا العام');
  }
};

// Fetch membership history for a specific member
export const getMembershipHistory = async (memberId) => {
  try {
    const response = await apiClient.get(`/MembershipHistory/member/${memberId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching membership history:', error);
    // Return empty array instead of throwing error for 404
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error('فشل في جلب سجل العضوية');
  }
};

export const getMembershipHistoryRecord = async (id) => {
  try {
    const response = await apiClient.get(`/MembershipHistory/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('فشل في جلب سجل العضوية');
  }
};

// Add a new membership update
export const addMembershipUpdate = async (memberId, updateDate, cardNumber) => {
  try {
    if (!memberId || !updateDate || !cardNumber) {
      throw new Error('جميع الحقول مطلوبة');
    }

    const response = await apiClient.post('/MembershipHistory', {
      memberId,
      updateDate,
      cardNumber
    });

    return response.data;
  } catch (error) {
    throw new Error(error.message || 'فشل في إضافة تحديث العضوية');
  }
};

export const deleteMembershipRecord = async (id) => {
  try {
    const response = await apiClient.delete(`/MembershipHistory/${id}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.Error || error.message || 'فشل في حذف سجل العضوية';
    throw new Error(errorMessage);
  }
};

export const updateMembershipRecord = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/MembershipHistory/${id}`, updateData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.Error || error.message || 'فشل في تحديث سجل العضوية';
    throw new Error(errorMessage);
  }
};