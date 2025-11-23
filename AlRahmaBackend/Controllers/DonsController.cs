using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints in this controller
    public class DonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<DonsController> _logger;

        public DonsController(
            ApplicationDbContext context,
            IWebHostEnvironment env,
            ILogger<DonsController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<Dons>>> GetDons()
        {
            try
            {
                var dons = await _context.Dons.ToListAsync();
                return Ok(dons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dons");
                return StatusCode(500, new { Error = "An error occurred while retrieving dons" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<Dons>> GetDons(int id)
        {
            try
            {
                var dons = await _context.Dons.FindAsync(id);
                if (dons == null) return NotFound();
                return Ok(dons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dons with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while retrieving the dons" });
            }
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create
        public async Task<ActionResult<Dons>> CreateDons([FromForm] DonsCreateDto dto)
        {
            try
            {
                // Manual validation
                if (string.IsNullOrWhiteSpace(dto.Reference))
                    return BadRequest(new { errors = new { Reference = "Reference is required" } });

                // Map to Entity
                var dons = new Dons
                {
                    Reference = dto.Reference,
                    Category = dto.Category,
                    Brand = dto.Brand,
                    Source = dto.Source,
                    Usage = dto.Usage,
                    DateOfEntry = dto.RegistrationDate ?? DateTime.Now,
                    DateOfExit = dto.DateOfExit,
                    Status = dto.Status ?? "صالح",
                    Description = dto.Description,
                    Nature = dto.Nature,
                    DonsType = dto.DonsType,
                    DonsScope = dto.DonsScope,
                    MonetaryValue = dto.MonetaryValue,
                    TestatorNationality = dto.TestatorNationality,
                    TestamentNature = dto.TestamentNature,
                    TestamentStatus = dto.TestamentStatus,
                    RegistrationDate = dto.RegistrationDate,
                    ExecutionDate = dto.ExecutionDate,
                };

                // Handle file upload
                if (dto.LegalFile != null && dto.LegalFile.Length > 0)
                {
                    var uploadResult = await SaveFile(dto.LegalFile);
                    if (!uploadResult.Success)
                    {
                        return BadRequest(new { Error = uploadResult.ErrorMessage });
                    }
                    dons.LegalFilePath = uploadResult.FilePath;
                }
                else
                {
                    return BadRequest(new { Error = "Legal file is required" });
                }

                _context.Dons.Add(dons);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetDons), new { id = dons.Id }, dons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating dons");
                return StatusCode(500, new { Error = "An error occurred while creating the dons" });
            }
        }

        [HttpGet("download/{id}")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can download
        public async Task<IActionResult> DownloadFile(int id)
        {
            try
            {
                var dons = await _context.Dons.FindAsync(id);
                if (dons == null || string.IsNullOrEmpty(dons.LegalFilePath))
                {
                    return NotFound();
                }

                // Get the physical file path
                var filePath = Path.Combine(_env.WebRootPath, dons.LegalFilePath.TrimStart('/'));

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound();
                }

                // Return the file
                var fileName = Path.GetFileName(filePath);
                return PhysicalFile(filePath, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file for dons ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while downloading the file" });
            }
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update
        public async Task<IActionResult> UpdateDons(int id, [FromForm] DonsUpdateDto donsUpdate)
        {
            try
            {
                if (id != donsUpdate.Id)
                {
                    return BadRequest();
                }

                var existingDons = await _context.Dons.FindAsync(id);
                if (existingDons == null)
                {
                    return NotFound();
                }

                // Update only the fields we want to change
                existingDons.ExecutionDate = donsUpdate.ExecutionDate;
                existingDons.TestamentStatus = donsUpdate.TestamentStatus;
                
                // Handle file update if provided
                if (donsUpdate.LegalFile != null)
                {
                    var uploadResult = await SaveFile(donsUpdate.LegalFile);
                    if (!uploadResult.Success)
                    {
                        return BadRequest(new { Error = uploadResult.ErrorMessage });
                    }
                    
                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(existingDons.LegalFilePath))
                    {
                        DeleteFile(existingDons.LegalFilePath);
                    }
                    
                    existingDons.LegalFilePath = uploadResult.FilePath;
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!DonsExists(id))
                {
                    return NotFound();
                }
                _logger.LogError(ex, "Concurrency error updating dons with ID: {Id}", id);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the dons" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating dons with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the dons" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> DeleteDons(int id)
        {
            try
            {
                var dons = await _context.Dons.FindAsync(id);
                if (dons == null)
                {
                    return NotFound();
                }

                // Delete associated file if exists
                if (!string.IsNullOrEmpty(dons.LegalFilePath))
                {
                    DeleteFile(dons.LegalFilePath);
                }

                _context.Dons.Remove(dons);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting dons with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the dons" });
            }
        }
        
        [HttpPatch("{id}/execution")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update execution status
        public async Task<IActionResult> UpdateExecutionStatus(int id, [FromBody] UpdateExecutionDto dto)
        {
            try
            {
                var dons = await _context.Dons.FindAsync(id);
                if (dons == null) return NotFound();

                dons.ExecutionDate = dto.ExecutionDate;
                dons.TestamentStatus = "نفذت"; // Automatically set status to "executed"

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating execution status for dons ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the execution status" });
            }
        }

        private bool DonsExists(int id)
        {
            return _context.Dons.Any(e => e.Id == id);
        }

        private Dictionary<string, string[]> ValidateDons(Dons dons)
        {
            var errors = new Dictionary<string, string[]>();

            // Common validations
            if (string.IsNullOrWhiteSpace(dons.Reference))
                errors.Add("Reference", new[] { "Reference is required" });

            if (string.IsNullOrWhiteSpace(dons.Category))
                errors.Add("Category", new[] { "Category is required" });

            if (string.IsNullOrWhiteSpace(dons.Brand))
                errors.Add("Brand", new[] { "Brand is required" });

            if (string.IsNullOrWhiteSpace(dons.Source))
                errors.Add("Source", new[] { "Source is required" });

            if (string.IsNullOrWhiteSpace(dons.Usage))
                errors.Add("Usage", new[] { "Usage is required" });

            // Testament-specific validations
            if (dons.Nature == "testament")
            {
                if (string.IsNullOrWhiteSpace(dons.TestatorNationality))
                    errors.Add("TestatorNationality", new[] { "Testator nationality is required" });

                if (string.IsNullOrWhiteSpace(dons.TestamentNature))
                    errors.Add("TestamentNature", new[] { "Testament nature is required" });

                if (string.IsNullOrWhiteSpace(dons.TestamentStatus))
                    errors.Add("TestamentStatus", new[] { "Testament status is required" });

                if (!dons.RegistrationDate.HasValue)
                    errors.Add("RegistrationDate", new[] { "Registration date is required" });

                if (dons.ExecutionDate.HasValue && dons.RegistrationDate.HasValue &&
                    dons.ExecutionDate < dons.RegistrationDate)
                    errors.Add("ExecutionDate", new[] { "Execution date cannot be before registration date" });
            }

            return errors;
        }

        private async Task<(bool Success, string FilePath, string ErrorMessage)> SaveFile(IFormFile file)
        {
            try
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "dons");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                return (true, $"/uploads/dons/{uniqueFileName}", null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving file");
                return (false, null, "Error saving file");
            }
        }

        private void DeleteFile(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_env.WebRootPath, filePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FilePath}", filePath);
            }
        }
    }
}