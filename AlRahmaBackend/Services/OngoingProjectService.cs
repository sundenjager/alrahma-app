using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Interfaces;
using AlRahmaBackend.Models;
using AutoMapper;

namespace AlRahmaBackend.Services
{
    public class OngoingProjectService
    {
        private readonly IOngoingProjectRepository _repository;
        private readonly IMapper _mapper;

        public OngoingProjectService(IOngoingProjectRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<OngoingProjectDto>> GetFilteredOngoingProjectsAsync(
            string status, string committee, string year, string search)
        {
            // Always filter by in_progress status
            var projects = (await _repository.GetAllOngoingProjectsAsync())
                .Where(p => p.ImplementationStatus == "in_progress");

            // Apply additional filters if they exist
            if (!string.IsNullOrEmpty(committee) && committee != "الكل")
            {
                projects = projects.Where(p =>
                    p.Committee.Contains(committee, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(year) && year != "الكل")
            {
                projects = projects.Where(p =>
                    p.Year.Equals(year, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(search))
            {
                projects = projects.Where(p =>
                    p.Project.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (p.ProjectCode != null && p.ProjectCode.Contains(search, StringComparison.OrdinalIgnoreCase)));
            }

            return _mapper.Map<IEnumerable<OngoingProjectDto>>(projects);
        }

        public async Task<IEnumerable<OngoingProjectDto>> GetCompletedProjectsAsync(
            string committee = "", string year = "", string search = "")
        {
            var projects = await _repository.GetCompletedProjectsAsync();

            // Apply filters
            if (!string.IsNullOrEmpty(committee) && committee != "الكل")
            {
                projects = projects.Where(p => p.Committee.Contains(committee, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(year) && year != "الكل")
            {
                projects = projects.Where(p => p.Year.Equals(year, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(search))
            {
                projects = projects.Where(p =>
                    p.Project.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    (p.ProjectCode != null && p.ProjectCode.Contains(search, StringComparison.OrdinalIgnoreCase)));
            }

            return _mapper.Map<IEnumerable<OngoingProjectDto>>(projects);
        }

        // New Method: GetOngoingProjectByIdAsync
        public async Task<OngoingProjectDto> GetOngoingProjectByIdAsync(int id)
        {
            var project = await _repository.GetOngoingProjectWithDetailsAsync(id);
            if (project == null)
            {
                throw new KeyNotFoundException("Project not found");
            }

            var projectDto = _mapper.Map<OngoingProjectDto>(project);
            // Calculate progress (example logic: based on completed tasks)
            projectDto.Progress = CalculateProgress(project);
            return projectDto;
        }

        // New Method: CreateOngoingProjectAsync
        public async Task<OngoingProjectDto> CreateOngoingProjectAsync(OngoingProjectCreateDto projectDto)
        {
            if (projectDto == null)
            {
                throw new ArgumentException("Project data is required");
            }

            // Validate DTO
            if (string.IsNullOrWhiteSpace(projectDto.Project))
            {
                throw new ArgumentException("Project name is required");
            }

            // Parse dates
            if (!DateTime.TryParse(projectDto.StartDate, out DateTime startDate))
            {
                throw new ArgumentException("Invalid start date format");
            }

            DateTime? completionDate = null;
            DateTime parsedCompletionDate;
            
            if (!string.IsNullOrEmpty(projectDto.CompletionDate))
            {
                if (!DateTime.TryParse(projectDto.CompletionDate, out parsedCompletionDate))
                {
                    throw new ArgumentException("Invalid completion date format");
                }
                completionDate = parsedCompletionDate;
            }

            if (completionDate.HasValue && startDate > completionDate.Value)
            {
                throw new ArgumentException("Start date cannot be after completion date");
            }

            if (startDate < DateTime.UtcNow.Date)
            {
                throw new ArgumentException("Start date cannot be in the past");
            }

            var project = _mapper.Map<OngoingProject>(projectDto);
            project.StartDate = startDate;
            project.CompletionDate = completionDate;
            project.CreatedAt = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;
            project.ImplementationStatus = projectDto.ImplementationStatus ?? "in_progress";

            var createdProject = await _repository.CreateOngoingProjectAsync(project);
            return _mapper.Map<OngoingProjectDto>(createdProject);
        }

        // New Method: UpdateOngoingProjectAsync
        public async Task UpdateOngoingProjectAsync(OngoingProjectUpdateDto projectDto)
        {
            if (projectDto == null)
            {
                throw new ArgumentException("Project data is required");
            }

            var existingProject = await _repository.GetOngoingProjectWithDetailsAsync(projectDto.Id);
            if (existingProject == null)
            {
                throw new KeyNotFoundException("Project not found");
            }

            // Update fields using AutoMapper
            _mapper.Map(projectDto, existingProject);
            existingProject.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateOngoingProjectAsync(existingProject);
        }

        // New Method: DeleteOngoingProjectAsync
        public async Task DeleteOngoingProjectAsync(int id)
        {
            var project = await _repository.GetOngoingProjectWithDetailsAsync(id);
            if (project == null)
            {
                throw new KeyNotFoundException("Project not found");
            }

            await _repository.DeleteOngoingProjectAsync(id);
        }

        // New Method: GetCommitteesAsync
        public async Task<IEnumerable<string>> GetCommitteesAsync()
        {
            var committees = await _repository.GetAllOngoingProjectsAsync();
            return committees.Select(p => p.Committee)
                            .Distinct()
                            .OrderBy(c => c)
                            .ToList();
        }

        // New Method: GetProjectYearsAsync
        public async Task<IEnumerable<int>> GetProjectYearsAsync()
        {
            var years = await _repository.GetAllOngoingProjectsAsync();
            return years.Select(p => int.Parse(p.Year))
                        .Distinct()
                        .OrderByDescending(y => y)
                        .ToList();
        }

        public async Task CompleteOngoingProjectAsync(int id)
        {
            var project = await _repository.GetOngoingProjectWithDetailsAsync(id);
            if (project == null)
            {
                throw new KeyNotFoundException("Project not found");
            }

            // Update project status and completion date
            project.ImplementationStatus = "completed";
            project.CompletionDate = DateTime.UtcNow;
            project.UpdatedAt = DateTime.UtcNow;

            // Complete all tasks if needed
            foreach (var phase in project.Phases)
            {
                foreach (var task in phase.Tasks)
                {
                    task.Status = "completed";
                }
            }

            await _repository.UpdateOngoingProjectAsync(project);
        }

        public async Task UpdateProjectBudgetAsync(int id, BudgetUpdateDto budgetUpdate)
        {
            // Validate inputs
            if (budgetUpdate.Spent < 0 || budgetUpdate.Remaining < 0)
                throw new ArgumentException("Budget values cannot be negative");

            if (budgetUpdate.NewBudget.HasValue && budgetUpdate.NewBudget < 0)
                throw new ArgumentException("New budget cannot be negative");

            // Get the project
            var project = await _repository.GetOngoingProjectWithDetailsAsync(id);
            if (project == null)
                throw new ArgumentException("Project not found");

            // Calculate new values
            if (budgetUpdate.NewBudget.HasValue)
            {
                // If updating the total budget
                project.Budget = budgetUpdate.NewBudget.Value;
                project.Remaining = budgetUpdate.NewBudget.Value - budgetUpdate.Spent;
            }
            else
            {
                // Standard update of spent/remaining
                project.Spent = budgetUpdate.Spent;
                project.Remaining = budgetUpdate.Remaining;
            }

            // Validate the calculations
            if (project.Remaining < 0)
                throw new ArgumentException("Remaining budget cannot be negative");

            if (Math.Abs((project.Spent + project.Remaining) - project.Budget) > 0.01m)
                throw new ArgumentException("Spent + remaining must equal total budget");

            await _repository.UpdateOngoingProjectAsync(project);
        }

        public async Task UpdateTaskStatusAsync(int taskId, string status)
        {
            if (status != "completed" && status != "pending" && status != "in_progress" && status != "blocked")
                throw new ArgumentException("Invalid task status");

            await _repository.UpdateTaskStatusAsync(taskId, status);
        }

        // Helper method to calculate progress
        private int CalculateProgress(OngoingProject project)
        {
            if (project.Phases == null || !project.Phases.Any())
                return 0;

            var totalTasks = project.Phases.Sum(p => p.Tasks?.Count ?? 0);
            if (totalTasks == 0)
                return 0;

            var completedTasks = project.Phases.Sum(p => p.Tasks?.Count(t => t.Status == "completed") ?? 0);
            return (int)((completedTasks / (double)totalTasks) * 100);
        }
    }
}