using AlRahmaBackend.DTOs;
using AlRahmaBackend.Interfaces;
using AlRahmaBackend.Models;
using AlRahmaBackend.Services;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace AlRahmaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all endpoints
    public class SuggestedProgramsController : ControllerBase
    {
        private readonly ISuggestedProgramRepository _programRepository;
        private readonly ISuggestedProgramService _programService;
        private readonly IMapper _mapper;
        private readonly ILogger<SuggestedProgramsController> _logger;

        public SuggestedProgramsController(
            ISuggestedProgramRepository programRepository,
            ISuggestedProgramService programService,
            IMapper mapper,
            ILogger<SuggestedProgramsController> logger)
        {
            _programRepository = programRepository;
            _programService = programService;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// Get all suggested programs with optional filtering
        /// </summary>
        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<IActionResult> GetAll([FromQuery] SuggestedProgramFilterDto filter)
        {
            try
            {
                _logger.LogInformation("Fetching suggested programs with filters by user {UserId}", User.Identity?.Name);

                var programs = await _programRepository.GetAllAsync(filter);
                var result = _mapper.Map<IEnumerable<SuggestedProgramReadDto>>(programs);
                
                _logger.LogInformation("Retrieved {Count} suggested programs for user {UserId}", 
                    result.Count(), User.Identity?.Name);
                    
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching suggested programs by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { success = false, message = "Failed to retrieve programs", error = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific program by ID with all details
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid program ID" });
                }

                _logger.LogInformation("Fetching suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                var program = await _programRepository.GetByIdAsync(id, true);
                if (program == null)
                {
                    _logger.LogWarning("Suggested program with ID {ProgramId} not found, requested by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { success = false, message = "Program not found" });
                }

                var result = _mapper.Map<SuggestedProgramReadDto>(program);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { success = false, message = "Failed to retrieve program", error = ex.Message });
            }
        }

       [HttpPost]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> Create([FromBody] SuggestedProgramCreateDto programDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for program creation by user {UserId}", User.Identity?.Name);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid input",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                // FIX: Use 'Project' instead of 'Name'
                if (string.IsNullOrWhiteSpace(programDto.Project))
                {
                    return BadRequest(new { success = false, message = "Program name (Project) is required" });
                }

                // Validate dates
                if (!DateTime.TryParse(programDto.StartDate, out var startDate) || startDate < DateTime.UtcNow.Date)
                {
                    return BadRequest(new { success = false, message = "Valid future start date is required" });
                }

                if (!string.IsNullOrEmpty(programDto.CompletionDate))
                {
                    if (!DateTime.TryParse(programDto.CompletionDate, out var completionDate) || completionDate < startDate)
                    {
                        return BadRequest(new { success = false, message = "Completion date must be after start date" });
                    }
                }

                _logger.LogInformation("Creating new suggested program '{ProgramName}' by user {UserId}", 
                    programDto.Project, User.Identity?.Name); // FIX: Use Project instead of Name

                var program = _mapper.Map<SuggestedProgram>(programDto);
                program.StartDate = startDate;
                program.CompletionDate = string.IsNullOrEmpty(programDto.CompletionDate) ? 
                    null : DateTime.Parse(programDto.CompletionDate);
                program.CreatedBy = User.Identity?.Name; // This should work now with the added property
                program.CreatedAt = DateTime.UtcNow;

                // FIX: Use PhaseDto instead of ProgramPhaseDto
                var createdProgram = await _programService.CreateProgramAsync(
                    program,
                    programDto.Phases ?? new List<PhaseDto>(), // FIX: Use PhaseDto
                    programDto.Partners ?? new List<ProgramPartnerDto>());

                var result = _mapper.Map<SuggestedProgramReadDto>(createdProgram);
                
                _logger.LogInformation("Suggested program created with ID {ProgramId} by user {UserId}", 
                    result.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(GetById), new { id = result.Id }, new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating suggested program by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while creating the program",
                    error = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> Update(int id, [FromBody] SuggestedProgramUpdateDto programDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for program update by user {UserId}", User.Identity?.Name);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid input",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                if (id <= 0 || id != programDto.Id)
                {
                    return BadRequest(new { success = false, message = "Invalid program ID" });
                }

                _logger.LogInformation("Updating suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                var existingProgram = await _programRepository.GetByIdAsync(id, true);
                if (existingProgram == null)
                {
                    _logger.LogWarning("Suggested program with ID {ProgramId} not found for update by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { success = false, message = "Program not found" });
                }

                // FIX: Use PhaseDto instead of ProgramPhaseDto
                var updatedProgram = await _programService.UpdateProgramAsync(
                    id, 
                    programDto, 
                    programDto.Phases ?? new List<PhaseDto>(), // FIX: Use PhaseDto
                    programDto.Partners ?? new List<ProgramPartnerDto>()
                );

                if (updatedProgram == null)
                {
                    return NotFound(new { success = false, message = "Program not found" });
                }

                var result = _mapper.Map<SuggestedProgramReadDto>(updatedProgram);
                
                _logger.LogInformation("Suggested program updated with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating the program",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Delete a program
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid program ID" });
                }

                _logger.LogInformation("Deleting suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                var success = await _programRepository.DeleteAsync(id);
                if (!success)
                {
                    _logger.LogWarning("Suggested program with ID {ProgramId} not found for deletion by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { success = false, message = "Program not found" });
                }

                _logger.LogInformation("Suggested program deleted with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                return Ok(new { success = true, message = "Program deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while deleting the program",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all unique committee names
        /// </summary>
        [HttpGet("committees")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<IActionResult> GetCommittees()
        {
            try
            {
                _logger.LogInformation("Fetching committees by user {UserId}", User.Identity?.Name);

                var committees = await _programRepository.GetCommitteesAsync();
                
                _logger.LogInformation("Retrieved {Count} committees for user {UserId}", 
                    committees?.Count() ?? 0, User.Identity?.Name);

                return Ok(new
                {
                    success = true,
                    data = committees?.OrderBy(c => c).ToList() ?? new List<string>()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching committees by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve committees",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get all unique years
        /// </summary>
        [HttpGet("years")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<IActionResult> GetYears()
        {
            try
            {
                _logger.LogInformation("Fetching years by user {UserId}", User.Identity?.Name);

                var years = await _programRepository.GetYearsAsync();
                
                _logger.LogInformation("Retrieved {Count} years for user {UserId}", 
                    years?.Count() ?? 0, User.Identity?.Name);

                return Ok(new
                {
                    success = true,
                    data = years?.OrderByDescending(y => y).ToList() ?? new List<string>()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching years by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve years",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Approve a suggested program and convert it to an ongoing project
        /// </summary>
        [HttpPost("approve")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can approve
        public async Task<IActionResult> ApproveProgram([FromBody] ApproveProgramDto approvalDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for program approval by user {UserId}", User.Identity?.Name);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid input",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                if (approvalDto.ProgramId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid program ID" });
                }

                _logger.LogInformation("Approving suggested program with ID {ProgramId} by user {UserId}", 
                    approvalDto.ProgramId, User.Identity?.Name);

                var ongoingProject = await _programService.ApproveProgramAsync(approvalDto);
                
                _logger.LogInformation("Suggested program approved and converted to ongoing project by user {UserId}", 
                    User.Identity?.Name);

                return Ok(new
                {
                    success = true,
                    data = _mapper.Map<OngoingProjectDto>(ongoingProject)
                });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Program not found for approval by user {UserId}: {Message}", 
                    User.Identity?.Name, ex.Message);
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Invalid operation during program approval by user {UserId}: {Message}", 
                    User.Identity?.Name, ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving suggested program by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while approving the program",
                    error = ex.Message
                });
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateProgramStatus(int id, [FromBody] UpdateProgramStatusDto statusDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for program status update by user {UserId}", User.Identity?.Name);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid input",
                        errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid program ID" });
                }

                // FIX: Use ImplementationStatus instead of Status
                _logger.LogInformation("Updating status for program with ID {ProgramId} to {Status} by user {UserId}", 
                    id, statusDto.ImplementationStatus, User.Identity?.Name);

                var updatedProgram = await _programService.UpdateProgramStatusAsync(id, statusDto);
                
                _logger.LogInformation("Program status updated for ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                return Ok(new
                {
                    success = true,
                    data = _mapper.Map<SuggestedProgramReadDto>(updatedProgram)
                });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Program not found for status update by user {UserId}: {Message}", 
                    User.Identity?.Name, ex.Message);
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("Invalid operation during program status update by user {UserId}: {Message}", 
                    User.Identity?.Name, ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating program status for ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "An error occurred while updating the program status",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Refuse a suggested program
        /// </summary>
        [HttpPatch("{id}/refuse")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can refuse
        public async Task<IActionResult> RefuseProgram(int id, [FromBody] RefuseProgramDto refuseDto)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid program ID" });
                }

                if (string.IsNullOrWhiteSpace(refuseDto.Commentary))
                {
                    return BadRequest(new { success = false, message = "Commentary is required for refusal" });
                }

                _logger.LogInformation("Refusing suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                var result = await _programService.RefuseProgramAsync(id, refuseDto.Commentary);
                
                _logger.LogInformation("Suggested program refused with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);

                return Ok(new { success = true, data = result });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("Program not found for refusal by user {UserId}: {Message}", 
                    User.Identity?.Name, ex.Message);
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refusing suggested program with ID {ProgramId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to refuse program",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get pending programs
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<IActionResult> GetPendingPrograms()
        {
            try
            {
                _logger.LogInformation("Fetching pending suggested programs by user {UserId}", User.Identity?.Name);

                var programs = await _programRepository.GetPendingProgramsAsync();
                var result = _mapper.Map<IEnumerable<SuggestedProgramReadDto>>(programs);
                
                _logger.LogInformation("Retrieved {Count} pending programs for user {UserId}", 
                    result.Count(), User.Identity?.Name);

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching pending suggested programs by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve pending programs",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get approved programs
        /// </summary>
        [HttpGet("approved")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<IActionResult> GetApprovedPrograms()
        {
            try
            {
                _logger.LogInformation("Fetching approved suggested programs by user {UserId}", User.Identity?.Name);

                var programs = await _programRepository.GetApprovedProgramsAsync();
                var result = _mapper.Map<IEnumerable<SuggestedProgramReadDto>>(programs);
                
                _logger.LogInformation("Retrieved {Count} approved programs for user {UserId}", 
                    result.Count(), User.Identity?.Name);

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching approved suggested programs by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve approved programs",
                    error = ex.Message
                });
            }
        }
    }
}