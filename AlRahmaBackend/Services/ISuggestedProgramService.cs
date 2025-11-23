using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlRahmaBackend.Interfaces
{
    public interface ISuggestedProgramService
    {
        Task<IEnumerable<SuggestedProgram>> GetAllProgramsAsync();
        Task<SuggestedProgram> GetProgramByIdAsync(int id);
        Task<IEnumerable<SuggestedProgram>> GetPendingProgramsAsync();
        Task<SuggestedProgram> CreateProgramAsync(SuggestedProgram program, List<PhaseDto> phases, List<ProgramPartnerDto> partners = null);
        Task<SuggestedProgram> UpdateProgramAsync(int id, SuggestedProgramUpdateDto programDto, List<PhaseDto> phases = null, List<ProgramPartnerDto> partners = null);
        Task<bool> DeleteProgramAsync(int id);
        Task<IEnumerable<Phase>> GetProgramPhasesAsync(int programId);
        Task<Phase> GetPhaseByIdAsync(int phaseId);
        Task<bool> DeletePhaseAsync(int phaseId);
        Task<IEnumerable<SuggestedProgram>> GetProgramsByCommitteeAsync(string committee);
        Task<IEnumerable<SuggestedProgram>> GetProgramsByYearAsync(int year);
        Task<IEnumerable<SuggestedProgram>> GetProgramsByStatusAsync(string status);
        Task<SuggestedProgramReadDto> UpdateProgramStatusAsync(int id, UpdateProgramStatusDto statusDto);
        Task<bool> UpdateProgramFundingStatusAsync(int id, string fundingStatus);
        Task<SuggestedProgram> RefuseProgramAsync(int id, string commentary);
        Task<OngoingProject> ApproveProgramAsync(ApproveProgramDto approvalDto);
    }
}