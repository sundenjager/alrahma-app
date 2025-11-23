// ongoingProjectsService.js
import { apiClient } from '../config/api'; // ✅ Use centralized client

const getOngoingProjects = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Force status to be "in_progress" and remove status from filters
    params.append('status', 'in_progress');
    
    // Add other filters if they exist
    if (filters.committee) params.append('committee', filters.committee);
    if (filters.year) params.append('year', filters.year);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/OngoingProjects?${params.toString()}`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching ongoing projects:', error);
    throw error;
  }
};

const completeProject = async (projectId) => {
  try {
    const response = await apiClient.post(`/OngoingProjects/${projectId}/complete`); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error completing project:', error);
    throw error;
  }
};

const updateProjectBudget = async (projectId, budgetData) => {
  try {
    const response = await apiClient.put(`/OngoingProjects/${projectId}/budget`, budgetData); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error updating project budget:', error);
    throw error;
  }
};

const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await apiClient.put(`/OngoingProjects/tasks/${taskId}/status`, { status }); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

const getCompletedProjects = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters if provided
    if (filters.committee) params.append('committee', filters.committee);
    if (filters.year) params.append('year', filters.year);
    if (filters.search) params.append('search', filters.search);

    // Make sure the URL is correct - no trailing slash before query params
    const url = `/OngoingProjects/completed${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await apiClient.get(url); // ✅ Use apiClient
    return response.data;
  } catch (error) {
    console.error('Error fetching completed projects:', error);
    throw error;
  }
};

const getCommittees = async () => {
  try {
    const response = await apiClient.get('/OngoingProjects/committees');
    return response.data;
  } catch (error) {
    console.error('Error fetching committees:', error);
    throw error;
  }
};

const getYears = async () => {
  try {
    const response = await apiClient.get('/OngoingProjects/years');
    return response.data;
  } catch (error) {
    console.error('Error fetching years:', error);
    throw error;
  }
};

export default {
  getOngoingProjects,
  getCompletedProjects,
  completeProject,
  updateProjectBudget,
  updateTaskStatus,
  getCommittees,
  getYears,
};