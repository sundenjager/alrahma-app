using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AlRahmaBackend.Data;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using System.Security.Claims;

namespace AlRahmaBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CommitteePVController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<CommitteePVController> _logger;

        public CommitteePVController(
            ApplicationDbContext context, 
            IWebHostEnvironment env,
            ILogger<CommitteePVController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public async Task<ActionResult<IEnumerable<CommitteePVDetailDto>>> GetAll()
        {
            try 
            {
                _logger.LogInformation("User {UserId} accessed committee meeting minutes list", User.FindFirstValue(ClaimTypes.NameIdentifier));

                var pvs = await _context.CommitteePVs
                    .Include(pv => pv.Attendees)
                    .OrderByDescending(pv => pv.DateTime)
                    .Select(pv => new CommitteePVDetailDto
                    {
                        Id = pv.Id,
                        Number = pv.Number,
                        DateTime = pv.DateTime,
                        Committee = pv.Committee,
                        DocumentPath = pv.DocumentPath,
                        Attendees = pv.Attendees.Select(a => a.Name).ToList(),
                        CreatedAt = pv.CreatedAt,
                        UpdatedAt = pv.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(pvs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting committee PVs for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving meeting minutes");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public async Task<ActionResult<CommitteePVDetailDto>> GetById(int id)
        {
            try
            {
                var committeePV = await _context.CommitteePVs
                    .Include(pv => pv.Attendees)
                    .FirstOrDefaultAsync(pv => pv.Id == id);

                if (committeePV == null)
                {
                    _logger.LogWarning("Committee PV {PVId} not found by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                _logger.LogInformation("User {UserId} accessed committee PV {PVId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                return Ok(new CommitteePVDetailDto
                {
                    Id = committeePV.Id,
                    Number = committeePV.Number,
                    DateTime = committeePV.DateTime,
                    Committee = committeePV.Committee,
                    DocumentPath = committeePV.DocumentPath,
                    Attendees = committeePV.Attendees.Select(a => a.Name).ToList(),
                    CreatedAt = committeePV.CreatedAt,
                    UpdatedAt = committeePV.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting committee PV {PVId} for user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving the meeting minutes");
            }
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<ActionResult<CommitteePVDetailDto>> Create([FromForm] CreatePVDto pvDto)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to create committee PV", User.FindFirstValue(ClaimTypes.NameIdentifier));

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for PV creation by user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return BadRequest(ModelState);
                }

                if (pvDto.Document != null && !IsValidDocumentType(pvDto.Document))
                {
                    _logger.LogWarning("Invalid document type attempted by user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return BadRequest("Invalid document type. Only PDF files are allowed.");
                }

                var committeePV = new CommitteePV
                {
                    Number = pvDto.Number,
                    DateTime = pvDto.DateTime,
                    Committee = pvDto.Committee,
                    DocumentPath = await SaveDocument(pvDto.Document),
                    CreatedAt = DateTime.UtcNow
                };

                _context.CommitteePVs.Add(committeePV);
                await _context.SaveChangesAsync();

                // Add attendees
                foreach (var attendeeName in pvDto.Attendees)
                {
                    _context.Attendees.Add(new Attendee
                    {
                        Name = attendeeName.Trim(),
                        CommitteePVId = committeePV.Id
                    });
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Committee PV {PVId} created successfully by user {UserId}", committeePV.Id, User.FindFirstValue(ClaimTypes.NameIdentifier));

                var result = new CommitteePVDetailDto
                {
                    Id = committeePV.Id,
                    Number = committeePV.Number,
                    DateTime = committeePV.DateTime,
                    Committee = committeePV.Committee,
                    DocumentPath = committeePV.DocumentPath,
                    Attendees = pvDto.Attendees,
                    CreatedAt = committeePV.CreatedAt
                };

                return CreatedAtAction(nameof(GetById), new { id = committeePV.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating committee PV for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while creating the meeting minutes");
            }
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to delete committee PV {PVId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                var committeePV = await _context.CommitteePVs
                    .Include(pv => pv.Attendees)
                    .FirstOrDefaultAsync(pv => pv.Id == id);

                if (committeePV == null)
                {
                    _logger.LogWarning("Committee PV {PVId} not found for deletion by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                if (!string.IsNullOrEmpty(committeePV.DocumentPath))
                {
                    DeleteDocument(committeePV.DocumentPath);
                }

                _context.CommitteePVs.Remove(committeePV);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Committee PV {PVId} deleted successfully by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting committee PV {PVId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while deleting the meeting minutes");
            }
        }

        [HttpGet("committees")]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public IActionResult GetCommitteeNames()
        {
            try
            {
                return Ok(new[] {
                    "لجنة الشباب",
                    "لجنة التخطيط و الدراسات",
                    "لجنة الصحة",
                    "لجنة الأسرة",
                    "لجنة التنمية",
                    "لجنة الكفالة",
                    "لجنة الاعلام"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving committee names for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving committee names");
            }
        }

        [HttpGet("{id}/document")]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public async Task<IActionResult> DownloadDocument(int id)
        {
            try
            {
                var pv = await _context.CommitteePVs.FindAsync(id);
                if (pv == null || string.IsNullOrEmpty(pv.DocumentPath))
                {
                    _logger.LogWarning("Document not found for PV {PVId} requested by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound("Document not found");
                }

                var filePath = Path.Combine(_env.WebRootPath, pv.DocumentPath);
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("Document file not found for PV {PVId} requested by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound("Document file not found");
                }

                _logger.LogInformation("Document downloaded for PV {PVId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                var fileStream = System.IO.File.OpenRead(filePath);
                return File(fileStream, "application/pdf", Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document for PV {PVId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while downloading the document");
            }
        }

        // Remove all suggestion-related endpoints:
        // - GetAllPoints()
        // - GetPendingSuggestions()
        // - UpdateSuggestionStatus()

        private bool CommitteePVExists(int id)
        {
            return _context.CommitteePVs.Any(e => e.Id == id);
        }

        private async Task<string> SaveDocument(IFormFile document)
        {
            if (document == null || document.Length == 0)
                return null;

            if (!await IsValidPdfFile(document))
            {
                throw new InvalidOperationException("Invalid PDF file");
            }

            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "committee-pv");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(document.FileName)}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await document.CopyToAsync(fileStream);
            }

            return Path.Combine("uploads", "committee-pv", uniqueFileName);
        }

        private async Task<bool> IsValidPdfFile(IFormFile file)
        {
            try
            {
                if (file.Length == 0) return false;

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var header = memoryStream.ToArray().Take(4).ToArray();
                
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
                if (string.IsNullOrEmpty(documentPath))
                    return;

                var fullPath = Path.Combine(_env.WebRootPath, documentPath);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document: {DocumentPath}", documentPath);
            }
        }

        private bool IsValidDocumentType(IFormFile file)
        {
            var allowedExtensions = new[] { ".pdf" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            return allowedExtensions.Contains(extension);
        }
    }
}