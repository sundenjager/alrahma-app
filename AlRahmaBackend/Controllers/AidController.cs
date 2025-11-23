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
using AlRahmaBackend.Services;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace AlRahmaBackend.Controllers
{
    [Authorize] // ← REQUIRED: Global authentication
    [Route("api/[controller]")]
    [ApiController]
    public class AidController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<AidController> _logger;
        private readonly AidStockHelperService _aidStockHelperService;

        public AidController(
            ApplicationDbContext context,
            IWebHostEnvironment env,
            ILogger<AidController> logger,
            AidStockHelperService aidStockHelperService)
        {
            _context = context;
            _env = env;
            _logger = logger;
            _aidStockHelperService = aidStockHelperService;
        }

        // GET: api/aid/subcategories/with-stock
        [HttpGet("subcategories/with-stock")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view stock
        public async Task<ActionResult<IEnumerable<object>>> GetSubCategoriesWithStock()
        {
            try
            {
                _logger.LogInformation("User {UserId} accessed subcategories with stock", User.FindFirstValue(ClaimTypes.NameIdentifier));

                var subCategoriesWithStock = await _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .ThenInclude(sc => sc.SuppliesCategory)
                    .Where(s => s.Quantity > 0)
                    .Select(s => new
                    {
                        Id = s.SuppliesSubCategoryId,
                        Name = s.SuppliesSubCategory.Name,
                        SuppliesCategoryId = s.SuppliesSubCategory.SuppliesCategoryId,
                        CategoryName = s.SuppliesSubCategory.SuppliesCategory.Name,
                        UnitPrice = s.SuppliesSubCategory.UnitPrice,
                        AvailableQuantity = s.Quantity,
                        TotalValue = s.TotalValue
                    })
                    .OrderBy(x => x.Name)
                    .ToListAsync();

                return Ok(subCategoriesWithStock);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching subcategories with stock for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view aids
        public async Task<ActionResult<IEnumerable<AidDto>>> GetAids()
        {
            try
            {
                _logger.LogInformation("User {UserId} accessed aids list", User.FindFirstValue(ClaimTypes.NameIdentifier));

                var aids = await _context.Aids
                    .Include(a => a.Items)
                        .ThenInclude(i => i.SuppliesSubCategory)
                            .ThenInclude(sc => sc.SuppliesCategory)
                    .Include(a => a.OngoingProject)
                    .Select(a => new AidDto
                    {
                        Id = a.Id,
                        Reference = a.Reference,
                        Usage = a.Usage,
                        DateOfAid = a.DateOfAid,
                        Description = a.Description,
                        LegalFilePath = a.LegalFilePath,
                        AidType = a.AidType,
                        MonetaryValue = a.MonetaryValue,
                        OngoingProjectId = a.OngoingProjectId,
                        OngoingProjectName = a.OngoingProject != null ? a.OngoingProject.Project : null,
                        Items = a.Items.Select(i => new AidItemDto
                        {
                            Id = i.Id,
                            SuppliesSubCategoryId = i.SuppliesSubCategoryId,
                            Quantity = i.Quantity,
                            SubCategoryName = i.SuppliesSubCategory.Name,
                            UnitPrice = i.SuppliesSubCategory.UnitPrice,
                            TotalValue = i.TotalValue
                        }).ToList()
                    })
                    .ToListAsync();

                return aids;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving aids for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving aids");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view specific aid
        public async Task<ActionResult<AidDto>> GetAid(int id)
        {
            try
            {
                var aid = await _context.Aids
                    .Include(a => a.Items)
                        .ThenInclude(i => i.SuppliesSubCategory)
                            .ThenInclude(sc => sc.SuppliesCategory)
                    .Include(a => a.OngoingProject)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (aid == null)
                {
                    _logger.LogWarning("Aid {AidId} not found by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                _logger.LogInformation("User {UserId} accessed aid {AidId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                return new AidDto
                {
                    Id = aid.Id,
                    Reference = aid.Reference,
                    Usage = aid.Usage,
                    DateOfAid = aid.DateOfAid,
                    Description = aid.Description,
                    LegalFilePath = aid.LegalFilePath,
                    AidType = aid.AidType,
                    MonetaryValue = aid.MonetaryValue,
                    OngoingProjectId = aid.OngoingProjectId,
                    OngoingProjectName = aid.OngoingProject != null ? aid.OngoingProject.Project : null,
                    Items = aid.Items.Select(i => new AidItemDto
                    {
                        Id = i.Id,
                        SuppliesSubCategoryId = i.SuppliesSubCategoryId,
                        Quantity = i.Quantity,
                        SubCategoryName = i.SuppliesSubCategory.Name,
                        UnitPrice = i.SuppliesSubCategory.UnitPrice,
                        TotalValue = i.TotalValue
                    }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving aid {AidId} for user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving the aid");
            }
        }

        [HttpPost("create")]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can create aids
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> CreateAidBasic()
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to create new aid", User.FindFirstValue(ClaimTypes.NameIdentifier));

                var form = await Request.ReadFormAsync();

                if (form == null || !form.Any())
                    return BadRequest(new { error = "Request body cannot be empty" });

                if (!form.TryGetValue("Reference", out var reference) || string.IsNullOrWhiteSpace(reference))
                    return BadRequest(new { error = "Reference is required", field = "reference" });

                var referenceValue = reference.ToString();
                if (await _context.Aids.AnyAsync(a => a.Reference == referenceValue))
                {
                    _logger.LogWarning("Duplicate reference attempt: {Reference} by user {UserId}", referenceValue, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return BadRequest(new
                    {
                        error = "Duplicate reference number",
                        details = $"An aid with reference '{referenceValue}' already exists"
                    });
                }

                if (!form.TryGetValue("DateOfAid", out var dateOfAidStr) || !DateTime.TryParse(dateOfAidStr, out var dateOfAid))
                    return BadRequest(new { error = "Valid DateOfAid is required", field = "dateOfAid" });

                decimal monetaryValue = 0;
                var aidType = form.TryGetValue("AidType", out var type) ? type.ToString() : "نقدي";
                
                if (aidType == "نقدي")
                {
                    if (!form.TryGetValue("MonetaryValue", out var monetaryValueStr) || !decimal.TryParse(monetaryValueStr, out monetaryValue) || monetaryValue <= 0)
                        return BadRequest(new { error = "Valid MonetaryValue is required for cash aids", field = "monetaryValue" });
                }
                else
                {
                    monetaryValue = 0;
                }

                // Get OngoingProjectId from form data
                var ongoingProjectId = form.TryGetValue("OngoingProjectId", out var opIdStr) && 
                                    int.TryParse(opIdStr, out var opId) ? opId : (int?)null;

                // Validate OngoingProject exists if provided
                if (ongoingProjectId.HasValue)
                {
                    var projectExists = await _context.OngoingProjects
                        .AnyAsync(op => op.Id == ongoingProjectId.Value);
                    if (!projectExists)
                    {
                        _logger.LogWarning("Invalid project ID {ProjectId} specified by user {UserId}", ongoingProjectId, User.FindFirstValue(ClaimTypes.NameIdentifier));
                        return BadRequest(new { error = "Ongoing project not found", field = "ongoingProjectId" });
                    }
                }

                var strategy = _context.Database.CreateExecutionStrategy();

                return await strategy.ExecuteAsync<IActionResult>(async () =>
                {
                    try
                    {
                        var aid = new Aid
                        {
                            Reference = referenceValue,
                            Usage = form.TryGetValue("Usage", out var usage) ? usage.ToString() : string.Empty,
                            DateOfAid = dateOfAid,
                            Description = form.TryGetValue("Description", out var desc) ? desc.ToString() : string.Empty,
                            AidType = aidType,
                            MonetaryValue = monetaryValue,
                            OngoingProjectId = ongoingProjectId,
                            LegalFilePath = string.Empty,
                            Items = new List<AidItem>()
                        };

                        var legalFile = form.Files.GetFile("LegalFile");
                        if (legalFile != null && legalFile.Length > 0)
                        {
                            var uploadResult = await SaveFile(legalFile);
                            if (!uploadResult.Success)
                                return BadRequest(new { error = uploadResult.ErrorMessage });

                            aid.LegalFilePath = uploadResult.FilePath;
                        }

                        _context.Aids.Add(aid);
                        await _context.SaveChangesAsync();

                        _logger.LogInformation("Aid {AidId} created successfully by user {UserId}", aid.Id, User.FindFirstValue(ClaimTypes.NameIdentifier));

                        return Ok(new
                        {
                            success = true,
                            aidId = aid.Id,
                            ongoingProjectId = aid.OngoingProjectId,
                            message = "Aid created successfully"
                        });
                    }
                    catch (DbUpdateException ex)
                    {
                        _logger.LogError(ex, "Database error creating aid for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));

                        if (IsDuplicateKeyError(ex))
                        {
                            return BadRequest(new
                            {
                                error = "Duplicate reference number",
                                details = "This reference number is already in use"
                            });
                        }

                        return StatusCode(500, new
                        {
                            error = "Database error",
                            details = ex.InnerException?.Message ?? ex.Message
                        });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating aid for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                        return StatusCode(500, new
                        {
                            error = "Internal server error",
                            details = ex.Message
                        });
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing aid creation for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new
                {
                    error = "Error processing request",
                    details = ex.Message
                });
            }
        }

        [HttpPost("{aidId}/items")]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can add aid items
        public async Task<IActionResult> AddAidItems(int aidId, [FromBody] List<AidItemCreateDto> items)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            
            return await strategy.ExecuteAsync<IActionResult>(async () =>
            {
                try
                {
                    _logger.LogInformation("User {UserId} attempting to add items to aid {AidId}", User.FindFirstValue(ClaimTypes.NameIdentifier), aidId);

                    var aid = await _context.Aids
                        .Include(a => a.Items)
                        .FirstOrDefaultAsync(a => a.Id == aidId);

                    if (aid == null)
                    {
                        _logger.LogWarning("Aid {AidId} not found for item addition by user {UserId}", aidId, User.FindFirstValue(ClaimTypes.NameIdentifier));
                        return NotFound(new { error = "Aid not found" });
                    }

                    if (items == null || items.Count == 0)
                        return BadRequest(new { error = "No items provided" });

                    // Verify all subcategories exist
                    var subCategoryIds = items.Select(i => i.SuppliesSubCategoryId).Distinct();
                    var existingSubCategories = await _context.SuppliesSubCategories
                        .Where(sc => subCategoryIds.Contains(sc.Id))
                        .ToListAsync();

                    if (existingSubCategories.Count != subCategoryIds.Count())
                    {
                        _logger.LogWarning("Invalid subcategories specified by user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                        return BadRequest(new { error = "One or more subcategories not found" });
                    }

                    // Check stock availability
                    var stockValidationErrors = new List<string>();
                    foreach (var item in items)
                    {
                        var hasStock = await _aidStockHelperService.CheckStockAvailability(
                            item.SuppliesSubCategoryId, item.Quantity);

                        if (!hasStock)
                        {
                            var subCategory = existingSubCategories.FirstOrDefault(sc => sc.Id == item.SuppliesSubCategoryId);
                            var stock = await _context.Stocks
                                .FirstOrDefaultAsync(s => s.SuppliesSubCategoryId == item.SuppliesSubCategoryId);

                            var availableQuantity = stock?.Quantity ?? 0;
                            stockValidationErrors.Add($"Not enough stock for {subCategory?.Name}. Requested: {item.Quantity}, Available: {availableQuantity}");
                        }
                    }

                    if (stockValidationErrors.Any())
                    {
                        _logger.LogWarning("Stock validation failed for user {UserId}: {Errors}", User.FindFirstValue(ClaimTypes.NameIdentifier), string.Join("; ", stockValidationErrors));
                        return BadRequest(new
                        {
                            error = "Stock validation failed",
                            details = string.Join("; ", stockValidationErrors)
                        });
                    }

                    // Add new items
                    foreach (var item in items)
                    {
                        aid.Items.Add(new AidItem
                        {
                            SuppliesSubCategoryId = item.SuppliesSubCategoryId,
                            Quantity = item.Quantity
                        });
                    }

                    // Update MonetaryValue based on aid type
                    if (aid.AidType == "عيني")
                    {
                        var totalValue = aid.Items.Sum(i => 
                            i.Quantity * (existingSubCategories.FirstOrDefault(sc => sc.Id == i.SuppliesSubCategoryId)?.UnitPrice ?? 0));
                        aid.MonetaryValue = totalValue;
                    }
                    else if (aid.AidType == "نقدي وعيني")
                    {
                        var itemsValue = aid.Items.Sum(i => 
                            i.Quantity * (existingSubCategories.FirstOrDefault(sc => sc.Id == i.SuppliesSubCategoryId)?.UnitPrice ?? 0));
                        aid.MonetaryValue += itemsValue;
                    }

                    await _context.SaveChangesAsync();
                    
                    // Update stock
                    await _aidStockHelperService.UpdateStockFromAidAsync(aidId);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Items added to aid {AidId} by user {UserId}", aidId, User.FindFirstValue(ClaimTypes.NameIdentifier));

                    return Ok(new
                    {
                        success = true,
                        itemsAdded = items.Count,
                        monetaryValue = aid.MonetaryValue,
                        message = "Items added successfully"
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error adding aid items for user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return StatusCode(500, new
                    {
                        error = "Internal server error",
                        details = ex.Message
                    });
                }
            });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can update aids
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateAid(int id, [FromForm] AidUpdateDto dto)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to update aid {AidId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                if (id != dto.Id)
                {
                    return BadRequest("ID mismatch");
                }

                var existingAid = await _context.Aids
                    .Include(a => a.Items)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (existingAid == null)
                {
                    _logger.LogWarning("Aid {AidId} not found for update by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                if (dto.AidType == "نقدي" || dto.AidType == "نقدي وعيني")
                {
                    if (dto.MonetaryValue <= 0)
                    {
                        return BadRequest(new { errors = new { MonetaryValue = "MonetaryValue must be greater than 0 for cash aids" } });
                    }
                }

                var subCategoryIds = dto.Items.Select(i => i.SuppliesSubCategoryId).Distinct();
                var existingSubCategories = await _context.SuppliesSubCategories
                    .Where(sc => subCategoryIds.Contains(sc.Id))
                    .ToListAsync();

                if (existingSubCategories.Count != subCategoryIds.Count())
                {
                    _logger.LogWarning("Invalid subcategories specified during update by user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return BadRequest(new { errors = new { Items = "One or more subcategories not found" } });
                }

                // Update basic properties
                existingAid.Reference = dto.Reference;
                existingAid.Usage = dto.Usage;
                existingAid.DateOfAid = dto.DateOfAid;
                existingAid.Description = dto.Description;
                existingAid.AidType = dto.AidType;
                existingAid.MonetaryValue = dto.AidType == "عيني"
                    ? existingAid.Items.Sum(i =>
                        i.Quantity * (existingSubCategories.FirstOrDefault(sc => sc.Id == i.SuppliesSubCategoryId)?.UnitPrice ?? 0))
                    : dto.MonetaryValue;

                // Handle file update
                if (dto.LegalFile != null)
                {
                    var uploadResult = await SaveFile(dto.LegalFile);
                    if (!uploadResult.Success)
                    {
                        return BadRequest(new { Error = uploadResult.ErrorMessage });
                    }

                    if (!string.IsNullOrEmpty(existingAid.LegalFilePath))
                    {
                        DeleteFile(existingAid.LegalFilePath);
                    }

                    existingAid.LegalFilePath = uploadResult.FilePath;
                }

                // Update items
                var itemsToRemove = existingAid.Items
                    .Where(existing => !dto.Items.Any(newItem => newItem.Id == existing.Id))
                    .ToList();

                foreach (var item in itemsToRemove)
                {
                    _context.AidItems.Remove(item);
                }

                foreach (var itemDto in dto.Items)
                {
                    var existingItem = existingAid.Items.FirstOrDefault(i => i.Id == itemDto.Id);
                    if (existingItem != null)
                    {
                        existingItem.SuppliesSubCategoryId = itemDto.SuppliesSubCategoryId;
                        existingItem.Quantity = itemDto.Quantity;
                    }
                    else
                    {
                        existingAid.Items.Add(new AidItem
                        {
                            SuppliesSubCategoryId = itemDto.SuppliesSubCategoryId,
                            Quantity = itemDto.Quantity
                        });
                    }
                }

                if (existingAid.AidType == "عيني")
                {
                    existingAid.MonetaryValue = existingAid.Items.Sum(i =>
                        i.Quantity * (existingSubCategories.FirstOrDefault(sc => sc.Id == i.SuppliesSubCategoryId)?.UnitPrice ?? 0));
                }

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Aid {AidId} updated successfully by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!AidExists(id))
                {
                    return NotFound();
                }
                _logger.LogError(ex, "Concurrency error updating aid {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { Error = "An error occurred while updating the aid" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating aid {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { Error = "An error occurred while updating the aid" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")] // ← Only SuperAdmin can delete aids (most restrictive)
        public async Task<IActionResult> DeleteAid(int id)
        {
            try
            {
                _logger.LogInformation("User {UserId} attempting to delete aid {AidId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);

                var aid = await _context.Aids
                    .Include(a => a.Items)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (aid == null)
                {
                    _logger.LogWarning("Aid {AidId} not found for deletion by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                try
                {
                    // First, delete all related StockTransaction records
                    var stockTransactions = await _context.StockTransactions
                        .Where(st => st.AidId == id)
                        .ToListAsync();
                    
                    _context.StockTransactions.RemoveRange(stockTransactions);

                    // Revert stock
                    await _aidStockHelperService.RevertStockFromAidAsync(id);
                    
                    if (!string.IsNullOrEmpty(aid.LegalFilePath))
                    {
                        DeleteFile(aid.LegalFilePath);
                    }

                    _context.Aids.Remove(aid);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Aid {AidId} deleted successfully by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NoContent();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error deleting aid {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return StatusCode(500, new { Error = "An error occurred while deleting the aid" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing aid deletion {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, new { Error = "An error occurred while deleting the aid" });
            }
        }

        [HttpGet("by-project/{projectId}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view project aids
        public async Task<ActionResult<IEnumerable<AidDto>>> GetAidsByProject(int projectId)
        {
            try
            {
                _logger.LogInformation("User {UserId} accessed aids for project {ProjectId}", User.FindFirstValue(ClaimTypes.NameIdentifier), projectId);

                var aids = await _context.Aids
                    .Include(a => a.Items)
                        .ThenInclude(i => i.SuppliesSubCategory)
                    .Include(a => a.OngoingProject)
                    .Where(a => a.OngoingProjectId == projectId)
                    .Select(a => new AidDto
                    {
                        Id = a.Id,
                        Reference = a.Reference,
                        Usage = a.Usage,
                        DateOfAid = a.DateOfAid,
                        Description = a.Description,
                        LegalFilePath = a.LegalFilePath,
                        AidType = a.AidType,
                        MonetaryValue = a.MonetaryValue,
                        OngoingProjectId = a.OngoingProjectId,
                        OngoingProjectName = a.OngoingProject.Project,
                        Items = a.Items.Select(i => new AidItemDto
                        {
                            Id = i.Id,
                            SuppliesSubCategoryId = i.SuppliesSubCategoryId,
                            Quantity = i.Quantity,
                            SubCategoryName = i.SuppliesSubCategory.Name,
                            UnitPrice = i.SuppliesSubCategory.UnitPrice,
                            TotalValue = i.TotalValue
                        }).ToList()
                    })
                    .ToListAsync();

                return aids;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving aids for project {ProjectId} by user {UserId}", projectId, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving project aids");
            }
        }

        [HttpGet("download/{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← Authenticated users can download files
        public async Task<IActionResult> DownloadFile(int id)
        {
            try
            {
                var aid = await _context.Aids.FindAsync(id);
                if (aid == null || string.IsNullOrEmpty(aid.LegalFilePath))
                {
                    _logger.LogWarning("File download requested for non-existent aid {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                var filePath = Path.Combine(_env.WebRootPath, aid.LegalFilePath.TrimStart('/'));
                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning("File not found for aid {AidId} requested by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                _logger.LogInformation("File downloaded for aid {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return PhysicalFile(filePath, "application/octet-stream", Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file for aid {AidId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "Error downloading file");
            }
        }

        private bool AidExists(int id)
        {
            return _context.Aids.Any(e => e.Id == id);
        }

        private bool IsDuplicateKeyError(DbUpdateException ex)
        {
            return ex.InnerException is SqlException sqlEx &&
                (sqlEx.Number == 2601 || sqlEx.Number == 2627);
        }

        private async Task<(bool Success, string FilePath, string ErrorMessage)> SaveFile(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return (false, null, "File is required");

                // Enhanced file validation
                var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
                var extension = Path.GetExtension(file.FileName).ToLower();
                
                if (!allowedExtensions.Contains(extension))
                    return (false, null, "Invalid file type. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX");
                
                if (file.Length > 10 * 1024 * 1024) // 10MB limit
                    return (false, null, "File size exceeds 10MB limit");

                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "aids");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                return (true, $"/uploads/aids/{uniqueFileName}", null);
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