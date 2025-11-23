using AlRahmaBackend.Models;
using AlRahmaBackend.Data;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Interfaces;
using AutoMapper;
using AlRahmaBackend.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AlRahmaBackend.Services
{
    public class SuggestedProgramService : ISuggestedProgramService
    {
        private readonly ISuggestedProgramRepository _programRepository;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<SuggestedProgramService> _logger;

        public SuggestedProgramService(ApplicationDbContext context, ISuggestedProgramRepository programRepository, IMapper mapper, ILogger<SuggestedProgramService> logger)
        {
            _context = context;
            _programRepository = programRepository;
            _mapper = mapper;
            _logger = logger;
        }
        
        public async Task<IEnumerable<SuggestedProgram>> GetAllProgramsAsync()
        {
            return await _context.SuggestedPrograms
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                .Include(p => p.Partners)
                .ToListAsync();
        }

        public async Task<SuggestedProgram> GetProgramByIdAsync(int id)
        {
            return await _context.SuggestedPrograms
                .Include(p => p.Phases)
                    .ThenInclude(ph => ph.Tasks)
                .Include(p => p.Partners)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<SuggestedProgram>> GetPendingProgramsAsync()
        {
            return await _programRepository.GetPendingProgramsAsync();
        }

        public async Task<SuggestedProgram> CreateProgramAsync(SuggestedProgram program, List<PhaseDto> phases, List<ProgramPartnerDto> partners = null)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    _logger.LogInformation("=== STARTING PROGRAM CREATION ===");

                    if (program == null)
                        throw new ArgumentNullException(nameof(program));

                    program.ImplementationStatus ??= "pending";
                    program.CreatedAt = DateTime.UtcNow;
                    program.StatusComment ??= string.Empty;

                    // Add partners to navigation property (EF will handle the FK)
                    if (partners != null && partners.Any())
                    {
                        foreach (var partnerDto in partners)
                        {
                            if (partnerDto == null) continue;
                            var partner = _mapper.Map<ProgramPartner>(partnerDto);
                            program.Partners.Add(partner); // <-- EF sets SuggestedProgramId automatically after SaveChanges
                        }
                    }

                    // Add the program (with partners) to the context
                    _context.SuggestedPrograms.Add(program);
                    await _context.SaveChangesAsync(); // Inserts program + partners in one go

                    // Add phases and tasks
                    if (phases != null && phases.Any())
                    {
                        foreach (var phaseDto in phases)
                        {
                            if (phaseDto == null) continue;

                            var phase = _mapper.Map<Phase>(phaseDto);
                            phase.SuggestedProgramId = program.Id;

                            if (!DateTime.TryParse(phaseDto.StartDate, out var phaseStartDate))
                                throw new ArgumentException($"Invalid phase start date format: {phaseDto.StartDate}");

                            if (!DateTime.TryParse(phaseDto.EndDate, out var phaseEndDate))
                                throw new ArgumentException($"Invalid phase end date format: {phaseDto.EndDate}");

                            phase.StartDate = phaseStartDate;
                            phase.EndDate = phaseEndDate;

                            _context.Phases.Add(phase);
                            await _context.SaveChangesAsync();

                            // Add tasks for this phase
                            if (phaseDto.Tasks != null && phaseDto.Tasks.Any())
                            {
                                foreach (var taskDto in phaseDto.Tasks)
                                {
                                    if (taskDto == null) continue;

                                    var task = _mapper.Map<ProjectTask>(taskDto);
                                    task.PhaseId = phase.Id;
                                    task.Status = "pending";

                                    _context.Tasks.Add(task);
                                }
                                await _context.SaveChangesAsync(); // Save all tasks for this phase in one batch
                            }
                        }
                    }

                    await transaction.CommitAsync();

                    // Return the full program with navigation properties
                    var result = await _context.SuggestedPrograms
                        .AsNoTracking()
                        .Include(p => p.Phases)
                            .ThenInclude(ph => ph.Tasks)
                        .Include(p => p.Partners)
                        .FirstOrDefaultAsync(p => p.Id == program.Id);

                    return result;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "=== ERROR IN PROGRAM CREATION ===");
                    throw new ApplicationException("Failed to create program. See logs for details.", ex);
                }
            });
        }


        public async Task<SuggestedProgram> UpdateProgramAsync(int id, SuggestedProgramUpdateDto programDto, List<PhaseDto> phases = null, List<ProgramPartnerDto> partners = null)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    _logger.LogInformation($"=== STARTING PROGRAM UPDATE {id} ===");

                    var existingProgram = await _context.SuggestedPrograms
                        .Include(p => p.Phases)
                            .ThenInclude(ph => ph.Tasks)
                        .Include(p => p.Partners)
                        .FirstOrDefaultAsync(p => p.Id == id);

                    if (existingProgram == null)
                    {
                        _logger.LogWarning($"Program with ID {id} not found");
                        return null;
                    }

                    // Update main program properties
                    _mapper.Map(programDto, existingProgram);
                    
                    // Update dates if provided
                    if (!string.IsNullOrEmpty(programDto.StartDate))
                    {
                        if (DateTime.TryParse(programDto.StartDate, out var startDate))
                            existingProgram.StartDate = startDate;
                    }

                    if (!string.IsNullOrEmpty(programDto.CompletionDate))
                    {
                        if (DateTime.TryParse(programDto.CompletionDate, out var completionDate))
                            existingProgram.CompletionDate = completionDate;
                    }

                    existingProgram.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Program {id} updated");

                    // Update phases if provided
                    if (phases != null && phases.Any())
                    {
                        _logger.LogInformation($"Updating {phases.Count} phases");

                        // Delete existing phases for this program
                        var existingPhases = await _context.Phases
                            .Where(p => p.SuggestedProgramId == id)
                            .Include(p => p.Tasks)
                            .ToListAsync();

                        foreach (var existingPhase in existingPhases)
                        {
                            // Delete tasks
                            _context.Tasks.RemoveRange(existingPhase.Tasks);

                            // Delete phase
                            _context.Phases.Remove(existingPhase);
                        }
                        await _context.SaveChangesAsync();

                        // Add new phases
                        foreach (var phaseDto in phases)
                        {
                            if (phaseDto == null) continue;

                            var phase = _mapper.Map<Phase>(phaseDto);
                            phase.SuggestedProgramId = id;

                            if (!DateTime.TryParse(phaseDto.StartDate, out var phaseStartDate))
                                throw new ArgumentException($"Invalid phase start date format: {phaseDto.StartDate}");

                            if (!DateTime.TryParse(phaseDto.EndDate, out var phaseEndDate))
                                throw new ArgumentException($"Invalid phase end date format: {phaseDto.EndDate}");

                            phase.StartDate = phaseStartDate;
                            phase.EndDate = phaseEndDate;

                            _context.Phases.Add(phase);
                            await _context.SaveChangesAsync();

                            if (phaseDto.Tasks != null && phaseDto.Tasks.Any())
                            {
                                foreach (var taskDto in phaseDto.Tasks)
                                {
                                    if (taskDto == null) continue;

                                    var task = _mapper.Map<ProjectTask>(taskDto);
                                    task.PhaseId = phase.Id;
                                    task.Status = "pending";

                                    _context.Tasks.Add(task);
                                    await _context.SaveChangesAsync();

                                    // REMOVED: All TaskMember creation code
                                    // No more member assignment to tasks
                                }
                            }
                        }
                    }

                    // Update partners if provided
                    if (partners != null)
                    {
                        // Delete existing partners
                        var existingPartners = await _context.ProgramPartners
                            .Where(pp => pp.SuggestedProgramId == id)
                            .ToListAsync();
                        _context.ProgramPartners.RemoveRange(existingPartners);
                        

                        // Add new partners
                        foreach (var partnerDto in partners)
                        {
                            if (partnerDto != null)
                            {
                                var partner = _mapper.Map<ProgramPartner>(partnerDto);
                                partner.SuggestedProgramId = id;
                                _context.ProgramPartners.Add(partner);
                            }
                        }
                        
                    }

                    await transaction.CommitAsync();
                    _logger.LogInformation($"=== PROGRAM UPDATE {id} COMPLETED SUCCESSFULLY ===");

                    var result = await _context.SuggestedPrograms
                        .AsNoTracking()
                        .Include(p => p.Phases)
                            .ThenInclude(ph => ph.Tasks)
                        .Include(p => p.Partners)
                        .FirstOrDefaultAsync(p => p.Id == id);

                    return result;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"=== ERROR IN PROGRAM UPDATE {id} ===");
                    try
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError($"Transaction rolled back for program update {id}");
                    }
                    catch (Exception rollbackEx)
                    {
                        _logger.LogError(rollbackEx, $"Error rolling back transaction for program update {id}");
                    }

                    throw new ApplicationException($"Failed to update program {id}. See logs for details.", ex);
                }
            });
        }

        public async Task<bool> DeleteProgramAsync(int id)
        {
            var program = await _context.SuggestedPrograms
                .Include(p => p.Phases)
                .ThenInclude(ph => ph.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (program == null)
                return false;

            _context.SuggestedPrograms.Remove(program);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Phase>> GetProgramPhasesAsync(int programId)
        {
            return await _context.Phases
                .Where(p => p.SuggestedProgramId == programId)
                .Include(p => p.Tasks)
                .ToListAsync();
        }

        public async Task<Phase> GetPhaseByIdAsync(int phaseId)
        {
            return await _context.Phases
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == phaseId);
        }

        public async Task<bool> DeletePhaseAsync(int phaseId)
        {
            var phase = await _context.Phases.FindAsync(phaseId);
            if (phase == null)
                return false;

            _context.Phases.Remove(phase);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<SuggestedProgram>> GetProgramsByCommitteeAsync(string committee)
        {
            return await _context.SuggestedPrograms
                .Where(p => p.Committee == committee)
                .ToListAsync();
        }

        public async Task<IEnumerable<SuggestedProgram>> GetProgramsByYearAsync(int year)
        {
            return await _context.SuggestedPrograms
                .Where(p => p.Year == year.ToString())
                .ToListAsync();
        }

        public async Task<IEnumerable<SuggestedProgram>> GetProgramsByStatusAsync(string status)
        {
            return await _context.SuggestedPrograms
                .Where(p => p.ImplementationStatus == status)
                .ToListAsync();
        }

        public async Task<SuggestedProgramReadDto> UpdateProgramStatusAsync(int id, UpdateProgramStatusDto statusDto)
        {
            var program = await _programRepository.GetByIdAsync(id);
            if (program == null)
            {
                throw new KeyNotFoundException("Program not found");
            }

            // Update implementation status and related fields
            program.ImplementationStatus = statusDto.ImplementationStatus;
            program.StatusComment = statusDto.StatusComment;
            program.DecisionDate = statusDto.DecisionDate ?? DateTime.UtcNow;
            program.UpdatedAt = DateTime.UtcNow;

            var updatedProgram = await _programRepository.UpdateAsync(program);
            return _mapper.Map<SuggestedProgramReadDto>(updatedProgram);
        }

        public async Task<bool> UpdateProgramFundingStatusAsync(int id, string fundingStatus)
        {
            var program = await _context.SuggestedPrograms.FindAsync(id);
            if (program == null)
                return false;

            program.FundingStatus = fundingStatus;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SuggestedProgram> RefuseProgramAsync(int id, string commentary)
        {
            var program = await _programRepository.GetByIdAsync(id);
            if (program == null)
                throw new KeyNotFoundException("Program not found");

            program.ImplementationStatus = "rejected";
            program.RefusalCommentary = commentary;
            program.DecisionDate = DateTime.UtcNow;

            return await _programRepository.UpdateAsync(program);
        }

        public async Task<OngoingProject> ApproveProgramAsync(ApproveProgramDto approvalDto)
        {
            var strategy = _context.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    // 1. Validate input
                    if (approvalDto == null)
                        throw new ArgumentNullException(nameof(approvalDto));

                    if (approvalDto.NewBudget < 0)
                        throw new ArgumentException("Budget cannot be negative");

                    // 2. Load the program with all related data (no tracking)
                    var program = await _context.SuggestedPrograms
                        .AsNoTracking()
                        .Include(p => p.Phases)
                            .ThenInclude(ph => ph.Tasks)
                        .Include(p => p.Partners)
                        .FirstOrDefaultAsync(p => p.Id == approvalDto.ProgramId);

                    if (program == null)
                        throw new KeyNotFoundException($"Program with ID {approvalDto.ProgramId} not found");

                    if (program.ImplementationStatus != "pending")
                        throw new InvalidOperationException($"Cannot approve program in {program.ImplementationStatus} status");

                    // 3. Create the new ongoing project
                    var ongoingProject = new OngoingProject
                    {
                        OriginalProgramId = program.Id,
                        Project = program.Project,
                        ProjectCode = program.ProjectCode,
                        StartDate = program.StartDate,
                        CompletionDate = program.CompletionDate,
                        Period = program.Period,
                        Place = program.Place,
                        Beneficiaries = program.Beneficiaries,
                        BeneficiariesCount = program.BeneficiariesCount,
                        TargetGroup = program.TargetGroup,
                        Budget = approvalDto.NewBudget,
                        TotalCost = program.TotalCost,
                        BudgetSource = program.BudgetSource,
                        FundingStatus = program.FundingStatus,
                        ImplementationStatus = "in_progress",
                        ProjectManager = program.ProjectManager,
                        ContactPhone = program.ContactPhone,
                        Details = program.Details,
                        Notes = program.Notes,
                        Committee = program.Committee,
                        Year = program.Year,
                        BudgetCommentary = approvalDto.Commentary
                    };

                    // 4. Save the ongoing project to generate its ID
                    _context.OngoingProjects.Add(ongoingProject);
                    await _context.SaveChangesAsync();

                    // 5. Update the original program status
                    var attachedProgram = await _context.SuggestedPrograms.FindAsync(program.Id);
                    attachedProgram.ImplementationStatus = "approved";
                    attachedProgram.Budget = approvalDto.NewBudget;
                    attachedProgram.BudgetCommentary = approvalDto.Commentary;
                    attachedProgram.UpdatedAt = DateTime.UtcNow;
                    attachedProgram.DecisionDate = DateTime.UtcNow; // Set DecisionDate
                    await _context.SaveChangesAsync();

                    // 6. Copy all phases with their tasks (using the new OngoingProject ID)
                    if (program.Phases != null)
                    {
                        foreach (var oldPhase in program.Phases)
                        {
                            var newPhase = new Phase
                            {
                                Title = oldPhase.Title,
                                StartDate = oldPhase.StartDate,
                                EndDate = oldPhase.EndDate,
                                Description = oldPhase.Description,
                                Budget = oldPhase.Budget,
                                OngoingProjectId = ongoingProject.Id,
                                Tasks = new List<ProjectTask>()
                            };

                            _context.Phases.Add(newPhase);
                            await _context.SaveChangesAsync();

                            // Copy tasks for this phase
                            if (oldPhase.Tasks != null)
                            {
                                foreach (var oldTask in oldPhase.Tasks)
                                {
                                    var newTask = new ProjectTask
                                    {
                                        Title = oldTask.Title,
                                        Description = oldTask.Description,
                                        Status = "pending",
                                        PhaseId = newPhase.Id
                                    };

                                    _context.Tasks.Add(newTask);
                                    await _context.SaveChangesAsync();

                                    // REMOVED: Copy assigned members - no more TaskMembers
                                }
                            }
                        }
                    }

                    // 7. Copy partners
                    if (program.Partners != null)
                    {
                        foreach (var partner in program.Partners)
                        {
                            _context.ProgramPartners.Add(new ProgramPartner
                            {
                                OngoingProjectId = ongoingProject.Id,
                                Name = partner.Name,
                                Type = partner.Type,
                                ContactPerson = partner.ContactPerson,
                                ContactPhone = partner.ContactPhone,
                                ContactEmail = partner.ContactEmail,
                                ContributionAmount = partner.ContributionAmount,
                                ContributionType = partner.ContributionType
                            });
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Return the complete ongoing project
                    return await _context.OngoingProjects
                        .Include(op => op.Phases)
                            .ThenInclude(p => p.Tasks)
                        .Include(op => op.Partners)
                        .FirstOrDefaultAsync(op => op.Id == ongoingProject.Id);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error approving program {ProgramId}", approvalDto?.ProgramId);
                    throw new ApplicationException("Failed to approve program. See logs for details.", ex);
                }
            });
        }
    }
}