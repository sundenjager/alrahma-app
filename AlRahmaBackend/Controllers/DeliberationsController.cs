using AlRahmaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Http;
using AlRahmaBackend.Data;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace AlRahmaBackend.Controllers
{
    /// <summary>
    /// API controller for managing deliberations (basic info and documents only)
    /// </summary>
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DeliberationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DeliberationsController> _logger;
        private readonly IWebHostEnvironment _env;

        public DeliberationsController(ApplicationDbContext context, ILogger<DeliberationsController> logger, IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _env = env;
        }

        /// <summary>
        /// Get all deliberations with optional filtering
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public async Task<ActionResult<IEnumerable<Deliberation>>> GetDeliberations(
            [FromQuery] string searchTerm = null,
            [FromQuery] string date = null)
        {
            try
            {
                _logger.LogInformation("User {UserId} accessed deliberations list with filters", User.FindFirstValue(ClaimTypes.NameIdentifier));

                var query = _context.Deliberations
                    .Include(d => d.Attendees)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(searchTerm))
                {
                    query = query.Where(d =>
                        d.Number.Contains(searchTerm) ||
                        d.Attendees.Any(a => a.Name.Contains(searchTerm))
                    );
                }

                if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var dateFilter))
                {
                    query = query.Where(d => d.DateTime.Date == dateFilter.Date);
                }

                var result = await query.OrderByDescending(d => d.DateTime).ToListAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving deliberations for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific deliberation by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public async Task<ActionResult<Deliberation>> GetDeliberation(int id)
        {
            try
            {
                var deliberation = await _context.Deliberations
                    .Include(d => d.Attendees)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (deliberation == null)
                {
                    _logger.LogWarning("Deliberation {DeliberationId} not found by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound(new { message = "Deliberation not found" });
                }

                _logger.LogInformation("User {UserId} accessed deliberation {DeliberationId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);
                return Ok(deliberation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving deliberation {DeliberationId} for user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        /// <summary>
        /// Create a new deliberation
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<ActionResult<Deliberation>> PostDeliberation([FromForm] DeliberationCreateDto dto)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to create new deliberation", User.FindFirstValue(ClaimTypes.NameIdentifier));
                _logger.LogInformation("Received data - Number: {Number}, DateTime: {DateTime}, Attendees: {Attendees}, HasDocument: {HasDocument}", 
                    dto.Number, dto.DateTime, dto.Attendees, dto.Document != null);

                if (string.IsNullOrEmpty(dto.Number))
                {
                    _logger.LogWarning("Validation failed: Number is required");
                    return BadRequest(new { errors = new { Number = new[] { "Meeting number is required" } } });
                }

                if (dto.DateTime == default)
                {
                    _logger.LogWarning("Validation failed: DateTime is required");
                    return BadRequest(new { errors = new { DateTime = new[] { "Valid date and time is required" } } });
                }

                if (string.IsNullOrEmpty(dto.Attendees))
                {
                    _logger.LogWarning("Validation failed: Attendees are required");
                    return BadRequest(new { errors = new { Attendees = new[] { "At least one attendee is required" } } });
                }

                // Create model
                var deliberation = new Deliberation
                {
                    Number = dto.Number,
                    DateTime = dto.DateTime,
                    CreatedAt = DateTime.UtcNow
                };

                // Handle optional document
                if (dto.Document != null)
                {
                    var uploadResult = await SaveDocument(dto.Document);
                    if (!uploadResult.Success)
                    {
                        _logger.LogWarning("Document upload failed: {Error}", uploadResult.ErrorMessage);
                        return BadRequest(new { error = uploadResult.ErrorMessage });
                    }

                    deliberation.DocumentPath = uploadResult.FilePath;
                }

                // Parse and add attendees
                var attendeeNames = dto.Attendees.Split(',')
                    .Select(a => a.Trim())
                    .Where(a => !string.IsNullOrEmpty(a))
                    .Distinct(StringComparer.OrdinalIgnoreCase);

                foreach (var name in attendeeNames)
                {
                    deliberation.Attendees.Add(new DeliberationAttendee { Name = name });
                }

                _context.Deliberations.Add(deliberation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deliberation {DeliberationId} created by user {UserId}", deliberation.Id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return CreatedAtAction(nameof(GetDeliberation), new { id = deliberation.Id }, deliberation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating deliberation for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }


        /// <summary>
        /// Delete a deliberation
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> DeleteDeliberation(int id)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to delete deliberation {DeliberationId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                var deliberation = await _context.Deliberations.FindAsync(id);
                if (deliberation == null)
                {
                    _logger.LogWarning("Deliberation {DeliberationId} not found for deletion by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound(new { message = "Deliberation not found" });
                }

                // Delete associated document if exists
                if (!string.IsNullOrEmpty(deliberation.DocumentPath))
                {
                    DeleteDocument(deliberation.DocumentPath);
                }

                _context.Deliberations.Remove(deliberation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deliberation {DeliberationId} deleted successfully by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting deliberation {DeliberationId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        /// <summary>
        /// Get list of available committees (kept for potential future use)
        /// </summary>
        [HttpGet("committees")]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public ActionResult<IEnumerable<string>> GetCommittees()
        {
            try
            {
                return Ok(new List<string>
                {
                    "لجنة الشباب",
                    "لجنة التخطيط و الدراسات",
                    "لجنة الصحة",
                    "لجنة الأسرة",
                    "لجنة التنمية",
                    "لجنة الكفالة",
                    "الهيئة المديرة",
                    "لجنة وقتية"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving committees for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        /// <summary>
        /// Download deliberation document
        /// </summary>
        [HttpGet("{id}/document")]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public IActionResult DownloadDocument(int id)
        {
            try
            {
                var deliberation = _context.Deliberations.Find(id);
                if (deliberation == null || string.IsNullOrEmpty(deliberation.DocumentPath))
                {
                    _logger.LogWarning("Document not found for deliberation {DeliberationId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound(new { message = "Document not found in database" });
                }

                var filePath = Path.Combine(_env.WebRootPath, "uploads", "deliberations", deliberation.DocumentPath);

                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Document file not found at path: {FilePath} for user {UserId}", filePath, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound(new
                    {
                        message = $"Document file not found",
                        storedPath = deliberation.DocumentPath
                    });
                }

                _logger.LogInformation("Document downloaded for deliberation {DeliberationId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                var fileStream = System.IO.File.OpenRead(filePath);
                return File(fileStream, "application/octet-stream", Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document for deliberation {DeliberationId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private bool DeliberationExists(int id)
        {
            return _context.Deliberations.Any(e => e.Id == id);
        }

        private async Task<(bool Success, string FilePath, string ErrorMessage)> SaveDocument(IFormFile document)
        {
            try
            {
                if (document == null || document.Length == 0)
                    return (true, null, null); // Document is optional

                // Enhanced file validation
                var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
                var extension = Path.GetExtension(document.FileName).ToLower();
                
                if (!allowedExtensions.Contains(extension))
                    return (false, null, "Invalid document type. Allowed types: PDF, DOC, DOCX");
                
                if (document.Length > 10 * 1024 * 1024) // 10MB limit
                    return (false, null, "Document size exceeds 10MB limit");

                // Validate PDF signature if PDF
                if (extension == ".pdf" && !await IsValidPdfFile(document))
                    return (false, null, "Invalid PDF file");

                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "deliberations");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{document.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await document.CopyToAsync(stream);
                }

                return (true, uniqueFileName, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving deliberation document");
                return (false, null, "Error saving document");
            }
        }

        private async Task<bool> IsValidPdfFile(IFormFile file)
        {
            try
            {
                if (file.Length == 0) return false;

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var header = memoryStream.ToArray().Take(4).ToArray();
                
                // PDF signature: %PDF
                return header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46;
            }
            catch
            {
                return false;
            }
        }

        private void DeleteDocument(string documentPath)
        {
            try
            {
                if (string.IsNullOrEmpty(documentPath)) return;

                var fullPath = Path.Combine(_env.WebRootPath, "uploads", "deliberations", documentPath);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting deliberation document: {DocumentPath}", documentPath);
            }
        }
    }

    // Simplified DTO classes without decisions
    public class DeliberationCreateDto
    {
        [Required(ErrorMessage = "Meeting number is required")]
        public string Number { get; set; }

        [Required(ErrorMessage = "Date and time is required")]
        public DateTime DateTime { get; set; }

        [Required(ErrorMessage = "Attendees are required")]
        public string Attendees { get; set; }

        public IFormFile Document { get; set; }
    }

    public class DeliberationUpdateDto
    {
        [Required(ErrorMessage = "ID is required")]
        public int Id { get; set; }

        [Required(ErrorMessage = "Meeting number is required")]
        public string Number { get; set; }

        [Required(ErrorMessage = "Date and time is required")]
        public DateTime DateTime { get; set; }

        [Required(ErrorMessage = "Attendees are required")]
        public string Attendees { get; set; }

        public IFormFile Document { get; set; }
    }
}