using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlRahmaBackend.Interfaces
{
    public interface ISuggestedProgramRepository
    {
        Task<IEnumerable<SuggestedProgram>> GetAllAsync(SuggestedProgramFilterDto filter);
        Task<SuggestedProgram> GetByIdAsync(int id, bool includePartners = false);
        Task<SuggestedProgram> CreateAsync(SuggestedProgram program);
        Task<SuggestedProgram> UpdateAsync(SuggestedProgram program);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<string>> GetCommitteesAsync();
        Task<IEnumerable<string>> GetYearsAsync();
        Task<IEnumerable<SuggestedProgram>> GetPendingProgramsAsync();
        
        // Add the missing method
        Task<IEnumerable<SuggestedProgram>> GetApprovedProgramsAsync();
    }
}