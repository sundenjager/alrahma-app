using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using AlRahmaBackend.DTOs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MedicalEquipmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly ILogger<MedicalEquipmentController> _logger;

        public MedicalEquipmentController(ApplicationDbContext context, IWebHostEnvironment hostEnvironment, ILogger<MedicalEquipmentController> logger)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<MedicalEquipment>>> GetMedicalEquipments(
            [FromQuery] string category = "all",
            [FromQuery] string search = "",
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null)
        {
            try
            {
                IQueryable<MedicalEquipment> query = _context.MedicalEquipments
                    .Include(e => e.Dispatches)
                    .AsNoTracking();

                if (category != "all" && !string.IsNullOrEmpty(category))
                {
                    query = query.Where(e => e.Category == category);
                }

                if (!string.IsNullOrEmpty(search))
                {
                    search = search.Trim();
                    query = query.Where(e =>
                        e.Reference.Contains(search) ||
                        e.Category.Contains(search) ||
                        e.Source.Contains(search) ||
                        e.Usage.Contains(search));
                }

                var totalCount = await query.CountAsync();
                
                // ✅ Apply pagination ONLY if both page and pageSize are provided
                if (page.HasValue && pageSize.HasValue)
                {
                    // Validate pagination parameters
                    int validPage = page.Value < 1 ? 1 : page.Value;
                    int validPageSize = pageSize.Value < 1 || pageSize.Value > 100 ? 10 : pageSize.Value;
                    
                    var items = await query
                        .OrderBy(e => e.Reference)
                        .Skip((validPage - 1) * validPageSize)
                        .Take(validPageSize)
                        .ToListAsync();
                        
                    Response.Headers.Add("X-Total-Count", totalCount.ToString());
                    Response.Headers.Add("X-Page", validPage.ToString());
                    Response.Headers.Add("X-Page-Size", validPageSize.ToString());
                    
                    return Ok(items);
                }
                else
                {
                    // ✅ Return ALL items when pagination is not specified
                    var allItems = await query
                        .OrderBy(e => e.Reference)
                        .ToListAsync();
                        
                    Response.Headers.Add("X-Total-Count", totalCount.ToString());
                    
                    return Ok(allItems);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving medical equipment list");
                return StatusCode(500, new
                {
                    Status = 500,
                    Title = "Server Error",
                    Detail = "An error occurred while retrieving equipment",
                    TraceId = HttpContext.TraceIdentifier
                });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<MedicalEquipment>> GetMedicalEquipment(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid equipment ID" });
                }

                var equipment = await _context.MedicalEquipments
                    .Include(e => e.Dispatches)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (equipment == null)
                {
                    return NotFound(new
                    {
                        Status = 404,
                        Title = "Not Found",
                        Detail = $"Medical equipment with ID {id} not found",
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                return Ok(equipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving medical equipment with ID: {Id}", id);
                return StatusCode(500, new
                {
                    Status = 500,
                    Title = "Server Error",
                    Detail = "An error occurred while retrieving the equipment",
                    TraceId = HttpContext.TraceIdentifier
                });
            }
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<MedicalEquipment>> PostMedicalEquipment([FromForm] MedicalEquipmentCreateDto equipmentDto)
        {
            try
            {
                // Validate input - only required fields
                var errors = new Dictionary<string, List<string>>();

                if (string.IsNullOrEmpty(equipmentDto.Category))
                    AddError(errors, "Category", "Category is required");

                if (string.IsNullOrEmpty(equipmentDto.Usage))
                    AddError(errors, "Usage", "Usage type is required");

                if (equipmentDto.DateOfEntry == default)
                    AddError(errors, "DateOfEntry", "Valid date of entry is required");


                if (errors.Any())
                {
                    return BadRequest(new
                    {
                        Status = 400,
                        Title = "Validation Failed",
                        Errors = errors,
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                // Validate file only if provided (optional)
                if (equipmentDto.LegalFile != null && equipmentDto.LegalFile.Length > 0)
                {
                    var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
                    var fileExtension = Path.GetExtension(equipmentDto.LegalFile.FileName).ToLowerInvariant();
                    
                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        AddError(errors, "LegalFile", "Allowed file types: PDF, JPG, PNG, DOC, DOCX");
                    }

                    if (equipmentDto.LegalFile.Length > 10 * 1024 * 1024)
                    {
                        AddError(errors, "LegalFile", "File size cannot exceed 10MB");
                    }
                }

                if (errors.Any())
                {
                    return BadRequest(new
                    {
                        Status = 400,
                        Title = "Validation Failed",
                        Errors = errors,
                        TraceId = HttpContext.TraceIdentifier
                    });
                }

                // AUTO-GENERATE REFERENCE
                string generatedReference = await GenerateUniqueReferenceAsync();
                
                var equipment = new MedicalEquipment
                {
                    Reference = generatedReference,
                    Category = equipmentDto.Category.Trim(),
                    Brand = equipmentDto.Brand?.Trim(),
                    Source = equipmentDto.Source?.Trim(),
                    Usage = equipmentDto.Usage.Trim(),
                    DateOfEntry = equipmentDto.DateOfEntry,
                    MonetaryValue = equipmentDto.MonetaryValue,
                    DateOfExit = equipmentDto.DateOfExit,
                    AcquisitionType = equipmentDto.AcquisitionType?.Trim(),
                    Status = equipmentDto.Status?.Trim() ?? "صالح",
                    Description = equipmentDto.Description?.Trim(), // Can be null/empty
                    CreatedBy = User.Identity?.Name,
                    CreatedAt = DateTime.UtcNow
                };

                // Handle file upload only if provided (optional)
                if (equipmentDto.LegalFile != null && equipmentDto.LegalFile.Length > 0)
                {
                    var uploadResult = await SaveFile(equipmentDto.LegalFile);
                    if (!uploadResult.Success)
                    {
                        return BadRequest(new
                        {
                            Status = 400,
                            Title = "File Upload Error",
                            Detail = uploadResult.ErrorMessage,
                            TraceId = HttpContext.TraceIdentifier
                        });
                    }
                    equipment.LegalFilePath = uploadResult.FilePath;
                }

                _context.MedicalEquipments.Add(equipment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Medical equipment created with ID: {EquipmentId}, Reference: {Reference} by user: {UserId}", 
                    equipment.Id, equipment.Reference, User.Identity?.Name);

                return CreatedAtAction(nameof(GetMedicalEquipment), new { id = equipment.Id }, equipment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating medical equipment");
                return StatusCode(500, new
                {
                    Status = 500,
                    Title = "Server Error",
                    Detail = "An unexpected error occurred",
                    TraceId = HttpContext.TraceIdentifier
                });
            }
        }
        // Method to generate unique reference
        private async Task<string> GenerateUniqueReferenceAsync()
        {
            string reference;
            bool isUnique;
            int attempts = 0;
            const int maxAttempts = 10;

            do
            {
                // Option 1: Simple sequential based on count
                var count = await _context.MedicalEquipments.CountAsync();
                reference = $"EQ-{(count + 1).ToString().PadLeft(4, '0')}";

                // Option 2: Year-based with sequence
                // var year = DateTime.Now.Year;
                // var yearCount = await _context.MedicalEquipments
                //     .CountAsync(e => e.CreatedAt.Year == year);
                // reference = $"EQ-{year}-{(yearCount + 1).ToString().PadLeft(3, '0')}";

                // Option 3: Category-based (if you want category-specific sequences)
                // var categoryCount = await _context.MedicalEquipments
                //     .CountAsync(e => e.Category == category);
                // reference = $"{categoryAbbreviation}-{(categoryCount + 1).ToString().PadLeft(4, '0')}";

                // Check if reference already exists
                isUnique = !await _context.MedicalEquipments.AnyAsync(e => e.Reference == reference);
                attempts++;

                if (attempts >= maxAttempts)
                {
                    // Fallback: Use GUID if we can't generate a unique sequential reference
                    reference = $"EQ-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                    break;
                }

            } while (!isUnique);

            return reference;
        }

        

        [HttpPut("{id}/update-details")]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateDetails(int id, [FromForm] MedicalEquipmentMinimalUpdateDto dto)
        {
            if (id != dto.Id) return BadRequest("ID mismatch");

            var equipment = await _context.MedicalEquipments.FindAsync(id);
            if (equipment == null) return NotFound();

            // Update only allowed fields
            if (dto.DateOfEntry.HasValue) equipment.DateOfEntry = dto.DateOfEntry.Value;
            if (dto.DateOfExit.HasValue) equipment.DateOfExit = dto.DateOfExit.Value;
            if (!string.IsNullOrEmpty(dto.Status)) equipment.Status = dto.Status.Trim();

            // Handle file
            if (dto.LegalFile != null && dto.LegalFile.Length > 0)
            {
                var upload = await SaveFile(dto.LegalFile);
                if (!upload.Success) return BadRequest(upload.ErrorMessage);

                if (!string.IsNullOrEmpty(equipment.LegalFilePath))
                    DeleteFile(equipment.LegalFilePath);

                equipment.LegalFilePath = upload.FilePath;
            }

            equipment.UpdatedBy = User.Identity?.Name;
            equipment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")]
        public async Task<IActionResult> DeleteMedicalEquipment(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid equipment ID" });
                }

                var equipment = await _context.MedicalEquipments
                    .Include(e => e.Dispatches)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (equipment == null)
                {
                    return NotFound(new { Error = "Medical equipment not found" });
                }

                // Check if equipment has dispatches
                if (equipment.Dispatches?.Any() == true)
                {
                    return BadRequest(new 
                    { 
                        Error = "Cannot delete equipment that has dispatch records. Delete dispatches first." 
                    });
                }

                // Delete associated file if exists
                if (!string.IsNullOrEmpty(equipment.LegalFilePath))
                {
                    DeleteFile(equipment.LegalFilePath);
                }

                _context.MedicalEquipments.Remove(equipment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Medical equipment deleted with ID: {EquipmentId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting medical equipment with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the equipment" });
            }
        }

        [HttpGet("{id}/dispatches")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentDispatch>>> GetEquipmentDispatches(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid equipment ID" });
                }

                // Verify equipment exists
                if (!await _context.MedicalEquipments.AnyAsync(e => e.Id == id))
                {
                    return NotFound(new { Error = "Medical equipment not found" });
                }

                var dispatches = await _context.EquipmentDispatches
                    .Where(d => d.MedicalEquipmentId == id)
                    .OrderByDescending(d => d.DispatchDate)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(dispatches);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching equipment dispatches for equipment ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while fetching dispatch history" });
            }
        }

        [HttpGet("download/{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public IActionResult DownloadFile(int id)
        {
            try 
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid equipment ID" });
                }

                var equipment = _context.MedicalEquipments
                    .AsNoTracking()
                    .FirstOrDefault(e => e.Id == id);
                    
                if (equipment == null) 
                    return NotFound(new { Error = "Equipment not found" });
                
                if (string.IsNullOrEmpty(equipment.LegalFilePath))
                    return NotFound(new { Error = "No file associated with this equipment" });

                var filePath = Path.Combine(_hostEnvironment.WebRootPath, equipment.LegalFilePath.TrimStart('/'));

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { Error = "File not found on server" });

                var fileName = Path.GetFileName(filePath);
                var contentType = GetContentType(fileName);

                _logger.LogInformation("File downloaded for equipment ID: {EquipmentId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return PhysicalFile(filePath, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file for equipment ID: {Id}", id);
                return StatusCode(500, new { Error = "Internal server error" });
            }
        }

        private void AddError(Dictionary<string, List<string>> errors, string key, string message)
        {
            if (!errors.ContainsKey(key))
                errors[key] = new List<string>();
            errors[key].Add(message);
        }

        private bool MedicalEquipmentExists(int id)
        {
            return _context.MedicalEquipments.Any(e => e.Id == id);
        }

        private string GetContentType(string filename)
        {
            var extension = Path.GetExtension(filename).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                _ => "application/octet-stream"
            };
        }

        private async Task<(bool Success, string FilePath, string ErrorMessage)> SaveFile(IFormFile file)
        {
            try
            {
                var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "Uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                return (true, $"/Uploads/{uniqueFileName}", null);
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
                var fullPath = Path.Combine(_hostEnvironment.WebRootPath, filePath.TrimStart('/'));
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