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
    public class SuggestedProgramRepository : ISuggestedProgramRepository
    {
        private readonly ApplicationDbContext _context;

        public SuggestedProgramRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SuggestedProgram>> GetAllAsync(SuggestedProgramFilterDto filter)
        {
            var query = _context.SuggestedPrograms
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                // REMOVED: .ThenInclude(t => t.AssignedMembers)
                .Include(p => p.Partners)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filter.Committee) && filter.Committee != "الكل")
                query = query.Where(p => p.Committee == filter.Committee);

            if (!string.IsNullOrEmpty(filter.Year) && filter.Year != "الكل")
                query = query.Where(p => p.Year == filter.Year);

            return await query.OrderByDescending(p => p.CompletionDate).ToListAsync();
        }

        public async Task<SuggestedProgram> GetByIdAsync(int id, bool includePartners = false)
        {
            var query = _context.SuggestedPrograms
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                // REMOVED: .ThenInclude(t => t.AssignedMembers)
                .AsQueryable();

            if (includePartners)
            {
                query = query.Include(p => p.Partners);
            }

            return await query.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<SuggestedProgram> CreateAsync(SuggestedProgram program)
        {
            program.Year = program.CompletionDate.HasValue
                ? program.CompletionDate.Value.Year.ToString()
                : DateTime.UtcNow.Year.ToString();
            _context.SuggestedPrograms.Add(program);
            await _context.SaveChangesAsync();
            return program;
        }

        public async Task<SuggestedProgram> UpdateAsync(SuggestedProgram program)
        {
            program.UpdatedAt = DateTime.UtcNow;
            _context.Entry(program).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return program;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var program = await _context.SuggestedPrograms.FindAsync(id);
            if (program == null) return false;

            _context.SuggestedPrograms.Remove(program);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<string>> GetCommitteesAsync()
        {
            return await _context.SuggestedPrograms
                .Select(p => p.Committee)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetYearsAsync()
        {
            return await _context.SuggestedPrograms
                .Select(p => p.Year)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();
        }

        public async Task<IEnumerable<SuggestedProgram>> GetPendingProgramsAsync()
        {
            return await _context.SuggestedPrograms
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                // REMOVED: .ThenInclude(t => t.AssignedMembers)
                .Include(p => p.Partners)
                .Where(p => p.ImplementationStatus.ToLower() == "pending")
                .ToListAsync();
        }
        
        public async Task<IEnumerable<SuggestedProgram>> GetApprovedProgramsAsync()
        {
            return await _context.SuggestedPrograms
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                .Include(p => p.Partners)
                .Where(p => p.ImplementationStatus.ToLower() == "approved")
                .ToListAsync();
        }
    }
}