using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlRahmaBackend.Interfaces
{
  public interface IOngoingProjectRepository
  {
    Task<IEnumerable<OngoingProject>> GetAllOngoingProjectsAsync();
    Task<OngoingProject> GetOngoingProjectWithDetailsAsync(int id);
    Task<OngoingProject> CreateOngoingProjectAsync(OngoingProject project);
    Task UpdateOngoingProjectAsync(OngoingProject project);
    Task DeleteOngoingProjectAsync(int id);
    Task CompleteOngoingProjectAsync(int id);
    Task UpdateProjectBudgetAsync(int id, decimal spent, decimal remaining);
    Task UpdateTaskStatusAsync(int taskId, string status);
    Task<IEnumerable<OngoingProject>> GetCompletedProjectsAsync();
  }
}