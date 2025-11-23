using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace AlRahmaBackend.Controllers
{
    [Authorize] // ← REQUIRED: Global authentication
    [Route("api/[controller]")]
    [ApiController]
    public class ActImmController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ActImmController> _logger;

        public ActImmController(
            ApplicationDbContext context, 
            IWebHostEnvironment env,
            ILogger<ActImmController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        // GET: api/ActImm
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,User")]
        public async Task<ActionResult<IEnumerable<ActImm>>> GetActImms(
            string type = "all",
            string status = "all",
            bool? isActive = null,
            int? categoryId = null,
            string search = null, // ADD THIS
            DateTime? startDate = null, // ADD THIS
            DateTime? endDate = null, // ADD THIS
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                var query = _context.ActImms
                    .Include(a => a.Category)
                    .AsQueryable();

                // Apply filters
                if (type != "all")
                    query = query.Where(a => a.SourceNature == (type == "achat" ? "شراء" : "تبرع"));
                
                if (status != "all")
                    query = query.Where(a => a.Status == status);
                
                if (isActive.HasValue)
                    query = query.Where(a => a.IsActive == isActive.Value);
                
                if (categoryId.HasValue)
                    query = query.Where(a => a.CategoryId == categoryId.Value);

                // ADD SEARCH FILTER
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(a => 
                        a.Brand.Contains(search) || 
                        a.Number.Contains(search) ||
                        a.Source.Contains(search) ||
                        a.UsageLocation.Contains(search)
                    );
                }

                // ADD DATE RANGE FILTER
                if (startDate.HasValue)
                    query = query.Where(a => a.DateOfDeployment >= startDate.Value);
                
                if (endDate.HasValue)
                    query = query.Where(a => a.DateOfDeployment <= endDate.Value);

                // Pagination
                var totalCount = await query.CountAsync();
                var items = await query
                    .OrderByDescending(a => a.DateOfDeployment)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                Response.Headers.Add("X-Total-Count", totalCount.ToString());
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving assets");
                return StatusCode(500, "An error occurred while retrieving assets");
            }
        }

        // GET: api/ActImm/5
        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view specific assets
        public async Task<ActionResult<ActImm>> GetActImm(int id)
        {
            try
            {
                var actImm = await _context.ActImms
                    .Include(a => a.Category)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (actImm == null)
                {
                    _logger.LogWarning("Asset {AssetId} not found by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                _logger.LogInformation("User {UserId} accessed asset {AssetId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);
                return Ok(actImm);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving asset {AssetId} for user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving the asset");
            }
        }

        // POST: api/ActImm
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can create assets
        public async Task<ActionResult<ActImm>> PostActImm([FromForm] ActImmDto dto)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to create new asset", User.FindFirstValue(ClaimTypes.NameIdentifier));

                // Validate category exists
                var category = await _context.ActImmCategories.FindAsync(dto.CategoryId);
                if (category == null)
                {
                    _logger.LogWarning("Invalid category {CategoryId} specified by user {UserId}", dto.CategoryId, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return BadRequest("Invalid category specified");
                }

                // Process file upload with enhanced security
                var fileResult = await ProcessFileUpload(dto.LegalFile);
                if (!fileResult.Success)
                {
                    _logger.LogWarning("File upload failed for user {UserId}: {Error}", User.FindFirstValue(ClaimTypes.NameIdentifier), fileResult.ErrorMessage);
                    return BadRequest(fileResult.ErrorMessage);
                }

                var actImm = new ActImm
                {
                    CategoryId = dto.CategoryId,
                    Category = category,
                    Brand = dto.Brand,
                    Number = dto.Number,
                    MonetaryValue = dto.MonetaryValue,
                    UsageLocation = dto.UsageLocation,
                    Source = dto.Source,
                    SourceNature = dto.SourceNature,
                    DateOfDeployment = dto.DateOfDeployment,
                    DateOfEnd = dto.DateOfEnd,
                    IsActive = dto.IsActive,
                    Status = dto.Status,
                    LegalFilePath = fileResult.FilePath,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ActImms.Add(actImm);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Asset {AssetId} created successfully by user {UserId}", actImm.Id, User.FindFirstValue(ClaimTypes.NameIdentifier));

                return CreatedAtAction(nameof(GetActImm), new { id = actImm.Id }, actImm);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating asset by user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while creating the asset");
            }
        }

        // PUT: api/ActImm/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can update assets
        public async Task<IActionResult> PutActImm(int id, [FromForm] ActImmDto dto)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to update asset {AssetId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                var actImm = await _context.ActImms.FindAsync(id);
                if (actImm == null)
                {
                    _logger.LogWarning("Asset {AssetId} not found for update by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                // Validate category exists if being changed
                if (actImm.CategoryId != dto.CategoryId)
                {
                    var category = await _context.ActImmCategories.FindAsync(dto.CategoryId);
                    if (category == null)
                    {
                        _logger.LogWarning("Invalid category {CategoryId} specified during update by user {UserId}", dto.CategoryId, User.FindFirstValue(ClaimTypes.NameIdentifier));
                        return BadRequest("Invalid category specified");
                    }

                    actImm.CategoryId = dto.CategoryId;
                    actImm.Category = category;
                }

                // Update other properties
                actImm.Brand = dto.Brand;
                actImm.Number = dto.Number;
                actImm.UsageLocation = dto.UsageLocation;
                actImm.Source = dto.Source;
                actImm.SourceNature = dto.SourceNature;
                actImm.DateOfDeployment = dto.DateOfDeployment;
                actImm.DateOfEnd = dto.DateOfEnd;
                actImm.IsActive = dto.IsActive;
                actImm.Status = dto.Status;
                actImm.UpdatedAt = DateTime.UtcNow;

                // Handle file update with security
                if (dto.LegalFile != null && dto.LegalFile.Length > 0)
                {
                    if (!string.IsNullOrEmpty(actImm.LegalFilePath))
                    {
                        _logger.LogInformation("Deleting old file for asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                        DeleteFile(actImm.LegalFilePath);
                    }

                    var fileResult = await ProcessFileUpload(dto.LegalFile);
                    if (!fileResult.Success)
                    {
                        _logger.LogWarning("File upload failed during update for user {UserId}: {Error}", User.FindFirstValue(ClaimTypes.NameIdentifier), fileResult.ErrorMessage);
                        return BadRequest(fileResult.ErrorMessage);
                    }

                    actImm.LegalFilePath = fileResult.FilePath;
                }

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Asset {AssetId} updated successfully by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while updating the asset");
            }
        }

        // DELETE: api/ActImm/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")] // ← Only SuperAdmin can delete assets (most restrictive)
        public async Task<IActionResult> DeleteActImm(int id)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to delete asset {AssetId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                var actImm = await _context.ActImms.FindAsync(id);
                if (actImm == null)
                {
                    _logger.LogWarning("Asset {AssetId} not found for deletion by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                // Delete associated file
                if (!string.IsNullOrEmpty(actImm.LegalFilePath))
                {
                    _logger.LogInformation("Deleting file for asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    DeleteFile(actImm.LegalFilePath);
                }

                _context.ActImms.Remove(actImm);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Asset {AssetId} deleted successfully by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while deleting the asset");
            }
        }

        // GET: api/ActImm/categories
        [HttpGet("categories")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← Public access to categories
        public async Task<ActionResult<IEnumerable<ActImmCategory>>> GetCategories()
        {
            try
            {
                return await _context.ActImmCategories
                    .Where(c => c.IsActive)
                    .OrderBy(c => c.Name)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving categories");
            }
        }

        // GET: api/ActImm/download/{filePath}
        [HttpGet("download/{*filePath}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← Authenticated users can download files
        public IActionResult DownloadFile(string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                    return BadRequest("File path is required");

                var fullPath = Path.Combine(_env.WebRootPath, filePath);
                
                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning("File not found: {FilePath} requested by user {UserId}", filePath, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound("File not found");
                }

                var fileBytes = System.IO.File.ReadAllBytes(fullPath);
                var fileName = Path.GetFileName(fullPath);
                var contentType = GetContentType(fileName);

                _logger.LogInformation("File {FileName} downloaded by user {UserId}", fileName, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file: {FilePath} by user {UserId}", filePath, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "Error downloading file");
            }
        }

        // GET: api/ActImm/fileinfo/{id}
        [HttpGet("fileinfo/{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← Authenticated users can get file info
        public async Task<ActionResult> GetFileInfo(int id)
        {
            try
            {
                var actImm = await _context.ActImms.FindAsync(id);
                if (actImm == null || string.IsNullOrEmpty(actImm.LegalFilePath))
                {
                    _logger.LogWarning("File info requested for non-existent asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                var fullPath = Path.Combine(_env.WebRootPath, actImm.LegalFilePath);
                if (!System.IO.File.Exists(fullPath))
                {
                    _logger.LogWarning("File not found on disk for asset {AssetId} requested by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound("File not found");
                }

                var fileInfo = new FileInfo(fullPath);
                
                _logger.LogInformation("File info retrieved for asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return Ok(new
                {
                    FileName = Path.GetFileName(actImm.LegalFilePath),
                    FileSize = fileInfo.Length,
                    FileType = Path.GetExtension(actImm.LegalFilePath),
                    UploadDate = fileInfo.CreationTimeUtc
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file info for asset {AssetId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "Error retrieving file information");
            }
        }

        private async Task<(bool Success, string FilePath, string ErrorMessage)> ProcessFileUpload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return (true, null, null);

            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            
            if (!allowedExtensions.Contains(extension))
                return (false, null, "Invalid file type. Allowed types: PDF, JPG, JPEG, PNG");
            
            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                return (false, null, "File size exceeds 5MB limit");

            // Enhanced security: Check file signature
            if (!await IsValidFileSignature(file))
                return (false, null, "Invalid file content");

            var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "actimm");
            Directory.CreateDirectory(uploadsPath);
            
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            return (true, Path.Combine("uploads", "actimm", fileName), null);
        }

        private async Task<bool> IsValidFileSignature(IFormFile file)
        {
            try
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileHeader = memoryStream.ToArray().Take(4).ToArray();

                var validSignatures = new Dictionary<string, byte[]>
                {
                    { ".pdf", new byte[] { 0x25, 0x50, 0x44, 0x46 } }, // %PDF
                    { ".jpg", new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 } }, // JPEG
                    { ".jpeg", new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 } }, // JPEG
                    { ".png", new byte[] { 0x89, 0x50, 0x4E, 0x47 } }  // PNG
                };

                var extension = Path.GetExtension(file.FileName).ToLower();
                if (validSignatures.TryGetValue(extension, out var signature))
                {
                    return fileHeader.Take(signature.Length).SequenceEqual(signature);
                }

                return false;
            }
            catch
            {
                return false;
            }
        }

        private string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLower();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
        }

        private void DeleteFile(string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath)) return;

                var fullPath = Path.Combine(_env.WebRootPath, filePath);
                if (System.IO.File.Exists(fullPath))
                    System.IO.File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FilePath}", filePath);
            }
        }

        private bool ActImmExists(int id) => 
            _context.ActImms.Any(e => e.Id == id);
    }
}