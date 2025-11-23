  // suggestedProgramsService.js
  import { apiClient } from '../config/api'; // ✅ Use centralized client

  // Get all programs with optional filtering
  export const getPrograms = async (filter = {}) => {
    try {
      const response = await apiClient.get('/suggestedprograms', { // ✅ Use apiClient
        params: filter,
        paramsSerializer: (params) =>
          Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&'),
      });

      return (
        response.data.data.map((program) => ({
          ...program,
          phases: program.phases?.map((phase) => ({
            ...phase,
            tasks: phase.tasks?.map((task) => ({
              ...task,
              // REMOVE: assignedMembers processing
            })) || [],
          })) || [],
          partners: program.partners || [],
        })) || []
      );
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  };

  export const getProgramById = async (id) => {
    try {
      const response = await apiClient.get(`/suggestedprograms/${id}`, { // ✅ Use apiClient
        params: {
          includePartners: true,
        },
      });


      if (!response.data.data) return null;

      const program = response.data.data;
      return {
        ...program,
        phases: program.phases?.map((phase) => ({
          ...phase,
          tasks: phase.tasks?.map((task) => ({
            ...task,
            assignedMembers: task.memberNames
              ?.filter((name) => name && typeof name === 'string' && name.trim() !== '' && name !== 'undefined') // Filter invalid names
              .map((name) => ({
                name: name.trim(),
                taskId: task.taskId || task.id,
              })) || [],
          })) || [],
        })) || [],
        partners: program.partners || [],
      };
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  };

  // Create a new program
  export const createProgram = async (programData) => {
    try {
      const formattedData = {
        ...programData,
        statusComment: programData.statusComment || '',
        phases: programData.phases.map((phase) => ({
          ...phase,
          tasks: phase.tasks.map((task) => ({
            ...task,
            memberNames: task.memberNames || [],
          })),
        })),
      };

      const response = await apiClient.post('/suggestedprograms', formattedData); // ✅ Use apiClient
      return response.data.data;
      return response.data.data;
    } catch (error) {
      console.error('Error creating program:', error.response?.data || error.message);
      let errorMessage = 'Failed to create program';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.join(', ');
          } else if (typeof error.response.data.errors === 'object') {
            errorMessage = Object.entries(error.response.data.errors)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
          }
        }
      }
      throw new Error(errorMessage);
    }
  };

  export const updateProgram = async (programData) => {
    try {
      const formattedData = {
        ...programData,
        phases: programData.phases.map((phase) => ({
          ...phase,
          tasks: phase.tasks.map((task) => ({
            ...task,
            memberNames: task.memberNames || [],
          })),
        })),
        partners: programData.partners || [],
      };

      const response = await apiClient.put(`/suggestedprograms/${programData.id}`, formattedData); // ✅ Use apiClient
      return response.data.data || null;
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  };

  // Delete a program
  export const deleteProgram = async (id) => {
    try {
      const response = await apiClient.delete(`/suggestedprograms/${id}`); // ✅ Use apiClient
      return response.data.success || false;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  };

  // Get committees list
  export const getCommittees = async () => {
    try {
      const response = await apiClient.get('/suggestedprograms/committees'); // ✅ Use apiClient
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching committees:', error);
      throw error;
    }
  };

  // Get years list
  export const getYears = async () => {
    try {
      const response = await apiClient.get('/suggestedprograms/years'); // ✅ Use apiClient
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching years:', error);
      throw error;
    }
  };

  // Refuse a program
  export const refuseProgram = async (id, commentary) => {
    try {
      const response = await apiClient.patch(`/suggestedprograms/${id}/refuse`, { commentary }); // ✅ Use apiClient
      return response.data.data;
    } catch (error) {
      console.error('Error refusing program:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.errors?.join(', ') ||
          'Failed to refuse program'
      );
    }
  };

  // Approve a program
  export const approveProgram = async (programId, newBudget, commentary) => {
    try {
      const response = await apiClient.post('/suggestedprograms/approve', { // ✅ Use apiClient
        programId,
        newBudget,
        commentary,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error approving program:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to approve program');
    }
  };

  // Get pending programs
  export const getPendingPrograms = async () => {
    try {
      const response = await apiClient.get('/suggestedprograms/pending'); // ✅ Use apiClient
      return (
        response.data.data.map((program) => ({
          ...program,
          phases: program.phases?.map((phase) => ({
            ...phase,
            tasks: phase.tasks?.map((task) => ({
              ...task,
              assignedMembers: task.memberNames
                ?.filter((name) => name && typeof name === 'string' && name.trim() !== '' && name !== 'undefined') // Filter invalid names
                .map((name) => ({
                  name: name.trim(),
                  taskId: task.taskId || task.id,
                })) || [],
            })) || [],
          })) || [],
          partners: program.partners || [],
        })) || []
      );
    } catch (error) {
      console.error('Error fetching pending programs:', error);
      throw error;
    }
  };