using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EquipmentDispatchController : ControllerBase
    {
        private readonly IEquipmentDispatchService _dispatchService;
        private readonly ILogger<EquipmentDispatchController> _logger;
        private readonly ApplicationDbContext _context;

        public EquipmentDispatchController(
            IEquipmentDispatchService dispatchService, 
            ILogger<EquipmentDispatchController> logger,
            ApplicationDbContext context)
        {
            _dispatchService = dispatchService;
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentDispatch>>> GetAll()
        {
            try
            {
                var dispatches = await _dispatchService.GetAllAsync();
                return Ok(dispatches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all equipment dispatches");
                return StatusCode(500, new { Error = "An error occurred while retrieving dispatches" });
            }
        }

        [HttpGet("ongoing")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentDispatch>>> GetOngoing()
        {
            try
            {
                var ongoingDispatches = await _dispatchService.GetOngoingDispatchesAsync();
                return Ok(ongoingDispatches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ongoing equipment dispatches");
                return StatusCode(500, new { Error = "An error occurred while retrieving ongoing dispatches" });
            }
        }

        [HttpGet("history")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentDispatch>>> GetHistory()
        {
            try
            {
                var history = await _dispatchService.GetDispatchHistoryAsync();
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dispatch history");
                return StatusCode(500, new { Error = "An error occurred while retrieving dispatch history" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<EquipmentDispatch>> GetById(int id)
        {
            try
            {
                var dispatch = await _dispatchService.GetByIdAsync(id);
                if (dispatch == null)
                {
                    return NotFound(new { Error = "Dispatch record not found" });
                }
                return Ok(dispatch);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dispatch with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while retrieving the dispatch" });
            }
        }

        [HttpGet("equipment/{equipmentId}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentDispatch>>> GetByEquipmentId(int equipmentId)
        {
            try
            {
                var dispatches = await _dispatchService.GetByEquipmentIdAsync(equipmentId);
                return Ok(dispatches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dispatches for equipment ID: {EquipmentId}", equipmentId);
                return StatusCode(500, new { Error = "An error occurred while retrieving equipment dispatches" });
            }
        }

        [HttpGet("search")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentDispatch>>> Search([FromQuery] string term)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(term))
                {
                    return BadRequest(new { Error = "Search term is required" });
                }

                var results = await _dispatchService.SearchAsync(term);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching dispatches with term: {Term}", term);
                return StatusCode(500, new { Error = "An error occurred while searching dispatches" });
            }
        }

        [HttpGet("available-equipment")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<MedicalEquipment>>> GetAvailableEquipment(
            [FromQuery] string usageType = "للاعارة")
        {
            try
            {
                var availableEquipment = await _dispatchService.GetAvailableEquipmentAsync(usageType);
                return Ok(availableEquipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available equipment");
                return StatusCode(500, new { Error = "An error occurred while retrieving available equipment" });
            }
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<EquipmentDispatch>> Create(
            [FromForm] int MedicalEquipmentId,
            [FromForm] string Beneficiary,
            [FromForm] string PatientPhone,
            [FromForm] string PatientCIN,
            [FromForm] string Coordinator,
            [FromForm] string ResponsiblePerson,
            [FromForm] string ResponsiblePersonPhone,
            [FromForm] string ResponsiblePersonCIN,
            [FromForm] string Notes,
            [FromForm] string EquipmentReference,
            [FromForm] DateTime DispatchDate,
            [FromForm] IFormFile PDFFile)
        {
            try
            {
                // Validate required fields
                if (MedicalEquipmentId <= 0)
                    return BadRequest(new { Error = "Valid MedicalEquipmentId is required" });
                
                if (string.IsNullOrEmpty(Beneficiary))
                    return BadRequest(new { Error = "Beneficiary is required" });

                if (PDFFile == null || PDFFile.Length == 0)
                    return BadRequest(new { Error = "PDF file is required" });

                // Validate file type
                var allowedExtensions = new[] { ".pdf" };
                var fileExtension = Path.GetExtension(PDFFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { Error = "Only PDF files are allowed" });
                }

                // Validate file size (5MB max)
                if (PDFFile.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { Error = "File size cannot exceed 5MB" });
                }

                var dispatch = new EquipmentDispatch
                {
                    MedicalEquipmentId = MedicalEquipmentId,
                    Beneficiary = Beneficiary?.Trim(),
                    PatientPhone = PatientPhone?.Trim(),
                    PatientCIN = PatientCIN?.Trim(),
                    Coordinator = Coordinator?.Trim(),
                    ResponsiblePerson = ResponsiblePerson?.Trim(),
                    ResponsiblePersonPhone = ResponsiblePersonPhone?.Trim(),
                    ResponsiblePersonCIN = ResponsiblePersonCIN?.Trim(),
                    Notes = Notes?.Trim(),
                    EquipmentReference = EquipmentReference?.Trim(),
                    DispatchDate = DispatchDate,
                    CreatedBy = User.Identity?.Name,
                    CreatedAt = DateTime.UtcNow
                };

                var createdDispatch = await _dispatchService.CreateAsync(dispatch, PDFFile);
                
                _logger.LogInformation("Dispatch created with ID: {DispatchId} by user: {UserId}", 
                    createdDispatch.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(GetById), new { id = createdDispatch.Id }, createdDispatch);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating dispatch");
                return StatusCode(500, new { Error = "A database error occurred. Please check the data and try again." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while creating dispatch");
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating dispatch");
                return StatusCode(500, new { Error = "An unexpected error occurred while creating the dispatch" });
            }
        }

        [HttpGet("download/{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<IActionResult> DownloadFile(int id)
        {
            try
            {
                var dispatch = await _dispatchService.GetByIdAsync(id);
                if (dispatch == null || string.IsNullOrEmpty(dispatch.PDFFilePath))
                {
                    return NotFound(new { Error = "File not found" });
                }

                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", dispatch.PDFFilePath.TrimStart('/'));
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { Error = "File not found on server" });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var fileName = Path.GetFileName(filePath);

                _logger.LogInformation("File downloaded for dispatch ID: {DispatchId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return File(fileBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file for dispatch ID: {Id}", id);
                return StatusCode(500, new { Error = "Error downloading file" });
            }
        }

        [HttpPut("{id}")]
[Consumes("multipart/form-data")]
[Authorize(Policy = "RequireAdminRole")]
public async Task<IActionResult> Update(int id, 
    [FromForm] int MedicalEquipmentId,
    [FromForm] string Beneficiary,
    [FromForm] string PatientPhone,
    [FromForm] string PatientCIN,
    [FromForm] string Coordinator,
    [FromForm] string ResponsiblePerson,
    [FromForm] string ResponsiblePersonPhone,
    [FromForm] string ResponsiblePersonCIN,
    [FromForm] string Notes,
    [FromForm] string EquipmentReference,
    [FromForm] DateTime DispatchDate,
    [FromForm] IFormFile PDFFile)
    {
        try
        {
            // Validate input
            if (id <= 0)
                return BadRequest(new { Error = "Invalid dispatch ID" });

            if (MedicalEquipmentId <= 0)
                return BadRequest(new { Error = "Valid MedicalEquipmentId is required" });

            // Validate file if provided
            if (PDFFile != null && PDFFile.Length > 0)
            {
                var allowedExtensions = new[] { ".pdf" };
                var fileExtension = Path.GetExtension(PDFFile.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { Error = "Only PDF files are allowed" });
                }

                if (PDFFile.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { Error = "File size cannot exceed 5MB" });
                }
            }

            var dispatch = new EquipmentDispatch
            {
                Id = id,
                MedicalEquipmentId = MedicalEquipmentId,
                Beneficiary = Beneficiary?.Trim(),
                PatientPhone = PatientPhone?.Trim(),
                PatientCIN = PatientCIN?.Trim(),
                Coordinator = Coordinator?.Trim(),
                ResponsiblePerson = ResponsiblePerson?.Trim(),
                ResponsiblePersonPhone = ResponsiblePersonPhone?.Trim(),
                ResponsiblePersonCIN = ResponsiblePersonCIN?.Trim(),
                Notes = Notes?.Trim(),
                EquipmentReference = EquipmentReference?.Trim(),
                DispatchDate = DispatchDate,
                UpdatedBy = User.Identity?.Name,
                UpdatedAt = DateTime.UtcNow
            };

            // Now this will work with the updated service method
            var updatedDispatch = await _dispatchService.UpdateAsync(dispatch, PDFFile);
            
            _logger.LogInformation("Dispatch updated with ID: {DispatchId} by user: {UserId}", 
                id, User.Identity?.Name);

            return Ok(updatedDispatch);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while updating dispatch ID: {Id}", id);
            return BadRequest(new { Error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Dispatch not found for update: {Id}", id);
            return NotFound(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating dispatch with ID: {Id}", id);
            return StatusCode(500, new { Error = "An error occurred while updating the dispatch" });
        }
    }

    [HttpPatch("{id}/return")]
    [Authorize(Policy = "RequireAdminRole")]
    public async Task<IActionResult> MarkAsReturned(int id, [FromBody] ReturnDispatchDto returnDto)
    {
        try
        {
            if (returnDto == null || returnDto.ReturnDate == default)
            {
                return BadRequest(new { Error = "Return date is required" });
            }

            if (returnDto.ReturnDate > DateTime.UtcNow)
            {
                return BadRequest(new { Error = "Return date cannot be in the future" });
            }

            // Now this will work with the updated service method
            var result = await _dispatchService.MarkAsReturnedAsync(
                id, returnDto.ReturnDate, returnDto.ReturnNotes, User.Identity?.Name);

            if (result == null)
            {
                return NotFound(new { Error = $"Dispatch with ID {id} not found" });
            }

            _logger.LogInformation("Dispatch marked as returned with ID: {DispatchId} by user: {UserId}", 
                id, User.Identity?.Name);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid argument while marking dispatch as returned: {Id}", id);
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking dispatch as returned with ID: {Id}", id);
            return StatusCode(500, new { Error = "An error occurred while processing your request" });
        }
    }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _dispatchService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { Error = "Dispatch record not found" });
                }

                _logger.LogInformation("Dispatch deleted with ID: {DispatchId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting dispatch with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the dispatch" });
            }
        }

        // Alternative implementation without service if service methods don't exist
        [HttpPatch("{id}/return-direct")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> MarkAsReturnedDirect(int id, [FromBody] ReturnDispatchDto returnDto)
        {
            try
            {
                if (returnDto == null || returnDto.ReturnDate == default)
                {
                    return BadRequest(new { Error = "Return date is required" });
                }

                var dispatch = await _context.EquipmentDispatches.FindAsync(id);
                if (dispatch == null)
                {
                    return NotFound(new { Error = "Dispatch record not found" });
                }

                dispatch.ReturnDate = returnDto.ReturnDate;
                dispatch.ReturnNotes = returnDto.ReturnNotes;
                dispatch.UpdatedBy = User.Identity?.Name;
                dispatch.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Dispatch marked as returned with ID: {DispatchId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return Ok(dispatch);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking dispatch as returned with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while processing your request" });
            }
        }
    }
}