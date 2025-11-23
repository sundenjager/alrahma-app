// usersService.js - Fixed version
import { apiClient } from '../config/api'; // ✅ Use centralized client

// Users service methods
export const usersService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users'); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  },

  // Register new user
  registerUser: async (userData) => {
    try {
      const response = await apiClient.post('/users/register-with-email', userData);
      return response.data;
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      
      const backendData = error.response?.data;
      console.error('Backend response data:', backendData);
      
      let errorMessage = 'Failed to register user';
      
      if (backendData) {
        // Try different possible error formats
        if (backendData.Error) {
          errorMessage = backendData.Error;
        } else if (backendData.message) {
          errorMessage = backendData.message;
        } else if (backendData.errors) {
          // ASP.NET Core validation errors
          const errors = Object.values(backendData.errors).flat();
          errorMessage = errors.join(', ');
        } else if (backendData.Errors) {
          // Custom errors array
          errorMessage = Array.isArray(backendData.Errors) 
            ? backendData.Errors.join('; ') 
            : JSON.stringify(backendData.Errors);
        }
      }
      
      console.error('Extracted error message:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await apiClient.put(`/users/${id}`, userData); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      await apiClient.delete(`/users/${id}`); // ✅ Use apiClient
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  },

  // Approve user
  approveUser: async (id) => {
    try {
      await apiClient.patch(`/users/${id}/approve`); // ✅ Use apiClient
    } catch (error) {
      console.error('Error approving user:', error);
      throw new Error(error.response?.data?.message || 'Failed to approve user');
    }
  },

  // Search users
  searchUsers: async (searchTerm) => {
    try {
      const response = await apiClient.get('/users'); // ✅ Use apiClient
      const users = response.data;
      return users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to search users');
    }
  },

  // Update user profile (for regular users)
  updateProfile: async (id, userData) => {
    try {
      const response = await apiClient.patch(`/users/${id}/profile`, userData); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Update password
  updatePassword: async (id, passwordData) => {
    try {
      const response = await apiClient.put(`/users/${id}/password`, passwordData); // ✅ Use apiClient
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error(error.response?.data?.message || 'Failed to update password');
    }
  }
};

export default usersService;