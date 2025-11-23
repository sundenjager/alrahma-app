using AlRahmaBackend.Data;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Interfaces;
using AlRahmaBackend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AlRahmaBackend.Repositories
{
    public class OngoingProjectRepository : IOngoingProjectRepository
    {
        private readonly ApplicationDbContext _context;

        public OngoingProjectRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<OngoingProject>> GetAllOngoingProjectsAsync()
        {
            return await _context.OngoingProjects
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                // REMOVED: .ThenInclude(t => t.AssignedMembers)
                .Include(p => p.Partners)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<OngoingProject> GetOngoingProjectWithDetailsAsync(int id)
        {
            return await _context.OngoingProjects
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                // REMOVED: .ThenInclude(t => t.AssignedMembers)
                .Include(p => p.Partners)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<OngoingProject> CreateOngoingProjectAsync(OngoingProject project)
        {
            _context.OngoingProjects.Add(project);
            await _context.SaveChangesAsync();
            return project;
        }

        public async Task UpdateOngoingProjectAsync(OngoingProject project)
        {
            _context.Entry(project).State = EntityState.Modified;
            project.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteOngoingProjectAsync(int id)
        {
            var project = await _context.OngoingProjects.FindAsync(id);
            if (project != null)
            {
                _context.OngoingProjects.Remove(project);
                await _context.SaveChangesAsync();
            }
        }

        public async Task CompleteOngoingProjectAsync(int id)
        {
            var project = await _context.OngoingProjects
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project != null)
            {
                project.ImplementationStatus = "completed";
                project.CompletionDate = DateTime.UtcNow;
                project.UpdatedAt = DateTime.UtcNow;

                // Mark all tasks as completed
                foreach (var phase in project.Phases)
                {
                    foreach (var task in phase.Tasks)
                    {
                        task.Status = "completed";
                    }
                }

                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateProjectBudgetAsync(int id, decimal spent, decimal remaining)
        {
            var project = await _context.OngoingProjects.FindAsync(id);
            if (project != null)
            {
                project.Spent = spent;
                project.Remaining = remaining;
                project.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
        
        public async Task<IEnumerable<OngoingProject>> GetCompletedProjectsAsync()
        {
            return await _context.OngoingProjects
                .Where(p => p.ImplementationStatus == "completed")
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                // REMOVED: .ThenInclude(t => t.AssignedMembers)
                .Include(p => p.Partners)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task UpdateTaskStatusAsync(int taskId, string status)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task != null)
            {
                task.Status = status;
                await _context.SaveChangesAsync();
            }
        }
    }
}