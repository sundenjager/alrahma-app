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
using Microsoft.Data.SqlClient;
using AlRahmaBackend.Services;
using Microsoft.AspNetCore.Hosting;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class SuppliesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<SuppliesController> _logger;
        private readonly StockHelperService _stockHelperService;

        public SuppliesController(
            ApplicationDbContext context,
            IWebHostEnvironment env,
            ILogger<SuppliesController> logger,
            StockHelperService stockHelperService)
        {
            _context = context;
            _env = env;
            _logger = logger;
            _stockHelperService = stockHelperService;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<SuppliesDto>>> GetSupplies()
        {
            try
            {
                _logger.LogInformation("Fetching all supplies by user {UserId}", User.Identity?.Name);

                var supplies = await _context.Supplies
                    .Include(s => s.Items)
                        .ThenInclude(i => i.SuppliesSubCategory)
                            .ThenInclude(sc => sc.SuppliesCategory)
                    .Include(s => s.OngoingProject)
                    .AsNoTracking() // Read-only for security
                    .Select(s => new SuppliesDto
                    {
                        Id = s.Id,
                        Reference = s.Reference,
                        Source = s.Source,
                        Usage = s.Usage,
                        DateOfEntry = s.DateOfEntry,
                        DateOfExit = s.DateOfExit,
                        Status = s.Status,
                        Description = s.Description,
                        LegalFilePath = s.LegalFilePath,
                        SuppliesType = s.SuppliesType,
                        SuppliesScope = s.SuppliesScope,
                        SuppliesNature = s.SuppliesNature,
                        MonetaryValue = s.MonetaryValue,
                        OngoingProjectId = s.OngoingProjectId,
                        CreatedBy = s.CreatedBy,
                        CreatedAt = s.CreatedAt,
                        UpdatedBy = s.UpdatedBy,
                        UpdatedAt = s.UpdatedAt,
                        OngoingProject = s.OngoingProject != null ? new OngoingProjectDto
                        {
                            Id = s.OngoingProject.Id,
                            Project = s.OngoingProject.Project,
                            ProjectCode = s.OngoingProject.ProjectCode,
                            ImplementationStatus = s.OngoingProject.ImplementationStatus,
                            Committee = s.OngoingProject.Committee,
                            Year = s.OngoingProject.Year
                        } : null,
                        Items = s.Items.Select(i => new SuppliesItemDto
                        {
                            Id = i.Id,
                            SuppliesSubCategoryId = i.SuppliesSubCategoryId,
                            Quantity = i.Quantity,
                            SubCategoryName = i.SuppliesSubCategory.Name,
                            UnitPrice = i.SuppliesSubCategory.UnitPrice,
                            TotalValue = i.TotalValue
                        }).ToList()
                    })
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} supplies for user {UserId}", supplies.Count, User.Identity?.Name);
                return Ok(supplies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving supplies" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<SuppliesDto>> GetSupplies(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid supplies ID" });
                }

                _logger.LogInformation("Fetching supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);

                var supplies = await _context.Supplies
                    .Include(s => s.Items)
                        .ThenInclude(i => i.SuppliesSubCategory)
                            .ThenInclude(sc => sc.SuppliesCategory)
                    .Include(s => s.OngoingProject)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (supplies == null)
                {
                    _logger.LogWarning("Supplies with ID {SuppliesId} not found, requested by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Supplies not found" });
                }

                var suppliesDto = new SuppliesDto
                {
                    Id = supplies.Id,
                    Reference = supplies.Reference,
                    Source = supplies.Source,
                    Usage = supplies.Usage,
                    DateOfEntry = supplies.DateOfEntry,
                    DateOfExit = supplies.DateOfExit,
                    Status = supplies.Status,
                    Description = supplies.Description,
                    LegalFilePath = supplies.LegalFilePath,
                    SuppliesType = supplies.SuppliesType,
                    SuppliesScope = supplies.SuppliesScope,
                    SuppliesNature = supplies.SuppliesNature,
                    MonetaryValue = supplies.MonetaryValue,
                    OngoingProjectId = supplies.OngoingProjectId,
                    CreatedBy = supplies.CreatedBy,
                    CreatedAt = supplies.CreatedAt,
                    UpdatedBy = supplies.UpdatedBy,
                    UpdatedAt = supplies.UpdatedAt,
                    OngoingProject = supplies.OngoingProject != null ? new OngoingProjectDto
                    {
                        Id = supplies.OngoingProject.Id,
                        Project = supplies.OngoingProject.Project,
                        ProjectCode = supplies.OngoingProject.ProjectCode,
                        ImplementationStatus = supplies.OngoingProject.ImplementationStatus,
                        Committee = supplies.OngoingProject.Committee,
                        Year = supplies.OngoingProject.Year
                    } : null,
                    Items = supplies.Items.Select(i => new SuppliesItemDto
                    {
                        Id = i.Id,
                        SuppliesSubCategoryId = i.SuppliesSubCategoryId,
                        Quantity = i.Quantity,
                        SubCategoryName = i.SuppliesSubCategory.Name,
                        UnitPrice = i.SuppliesSubCategory.UnitPrice,
                        TotalValue = i.TotalValue
                    }).ToList()
                };

                return Ok(suppliesDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving the supplies" });
            }
        }

        [HttpPost("create")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create
        public async Task<IActionResult> CreateSuppliesBasic()
        {
            try 
            {
                var form = await Request.ReadFormAsync();
                
                if (form == null || !form.Any())
                    return BadRequest(new { Error = "Request body cannot be empty" });
                    
                // Validate required fields
                if (!form.TryGetValue("Reference", out var reference) || string.IsNullOrWhiteSpace(reference))
                    return BadRequest(new { Error = "Reference is required", Field = "reference" });
                
                var referenceValue = reference.ToString().Trim();
                if (await _context.Supplies.AnyAsync(s => s.Reference == referenceValue))
                {
                    return Conflict(new { 
                        Error = "Duplicate reference number",
                        Details = $"Supplies with reference '{referenceValue}' already exists"
                    });
                }
                
                if (!form.TryGetValue("DateOfEntry", out var dateOfEntryStr) || !DateTime.TryParse(dateOfEntryStr, out var dateOfEntry))
                    return BadRequest(new { Error = "Valid DateOfEntry is required", Field = "dateOfEntry" });

                // Validate future dates
                if (dateOfEntry > DateTime.UtcNow)
                    return BadRequest(new { Error = "DateOfEntry cannot be in the future", Field = "dateOfEntry" });

                // Validate MonetaryValue for نقدي and نقدي وعيني
                decimal monetaryValue = 0;
                var suppliesType = form.TryGetValue("SuppliesType", out var type) ? type.ToString() : "نقدي";
                var suppliesNature = form.TryGetValue("SuppliesNature", out var nature) ? nature.ToString() : "Donation";
                
                if (suppliesType == "نقدي" || suppliesType == "نقدي وعيني")
                {
                    if (!form.TryGetValue("MonetaryValue", out var monetaryValueStr) || !decimal.TryParse(monetaryValueStr, out monetaryValue) || monetaryValue <= 0)
                        return BadRequest(new { Error = "Valid MonetaryValue is required for cash supplies", Field = "monetaryValue" });
                }

                // Validate OngoingProjectId if provided
                int? ongoingProjectId = null;
                if (form.TryGetValue("OngoingProjectId", out var projectIdStr) && !string.IsNullOrEmpty(projectIdStr))
                {
                    if (int.TryParse(projectIdStr, out var projectId))
                    {
                        // Verify the project exists
                        var projectExists = await _context.OngoingProjects.AnyAsync(p => p.Id == projectId);
                        if (!projectExists)
                        {
                            return BadRequest(new { Error = "OngoingProject not found", Field = "ongoingProjectId" });
                        }
                        ongoingProjectId = projectId;
                    }
                    else
                    {
                        return BadRequest(new { Error = "Invalid OngoingProjectId", Field = "ongoingProjectId" });
                    }
                }

                _logger.LogInformation("Creating new supplies with reference {Reference} by user {UserId}", 
                    referenceValue, User.Identity?.Name);

                var strategy = _context.Database.CreateExecutionStrategy();
                
                return await strategy.ExecuteAsync<IActionResult>(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        var supplies = new Supplies
                        {
                            Reference = referenceValue,
                            Source = form.TryGetValue("Source", out var source) ? source.ToString().Trim() : string.Empty,
                            Usage = form.TryGetValue("Usage", out var usage) ? usage.ToString().Trim() : string.Empty,
                            DateOfEntry = dateOfEntry,
                            Status = form.TryGetValue("Status", out var status) ? status.ToString() : "صالح",
                            Description = form.TryGetValue("Description", out var desc) ? desc.ToString().Trim() : string.Empty,
                            SuppliesType = suppliesType,
                            SuppliesScope = form.TryGetValue("SuppliesScope", out var scope) ? scope.ToString() : "عمومي",
                            SuppliesNature = suppliesNature,
                            MonetaryValue = monetaryValue,
                            OngoingProjectId = ongoingProjectId,
                            LegalFilePath = string.Empty,
                            CreatedBy = User.Identity?.Name,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedBy = User.Identity?.Name,
                            UpdatedAt = DateTime.UtcNow,
                            Items = new List<SuppliesItem>()
                        };

                        if (form.TryGetValue("DateOfExit", out var dateOfExitStr) && DateTime.TryParse(dateOfExitStr, out var dateOfExit))
                        {
                            if (dateOfExit < dateOfEntry)
                                return BadRequest(new { Error = "DateOfExit cannot be before DateOfEntry", Field = "dateOfExit" });
                            supplies.DateOfExit = dateOfExit;
                        }

                        var legalFile = form.Files.GetFile("LegalFile");
                        if (legalFile != null && legalFile.Length > 0)
                        {
                            // Validate file type and size
                            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
                            var fileExtension = Path.GetExtension(legalFile.FileName).ToLowerInvariant();
                            
                            if (!allowedExtensions.Contains(fileExtension))
                            {
                                return BadRequest(new { Error = "Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX", Field = "legalFile" });
                            }

                            if (legalFile.Length > 10 * 1024 * 1024) // 10MB
                            {
                                return BadRequest(new { Error = "File size cannot exceed 10MB", Field = "legalFile" });
                            }

                            var uploadResult = await SaveFile(legalFile);
                            if (!uploadResult.Success)
                                return BadRequest(new { Error = uploadResult.ErrorMessage });
                            
                            supplies.LegalFilePath = uploadResult.FilePath;
                        }

                        _context.Supplies.Add(supplies);
                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        _logger.LogInformation("Supplies created with ID {SuppliesId} by user {UserId}", 
                            supplies.Id, User.Identity?.Name);

                        return Ok(new 
                        {
                            success = true,
                            suppliesId = supplies.Id,
                            message = "Supplies created successfully"
                        });
                    }
                    catch (DbUpdateException ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Database error creating supplies by user {UserId}", User.Identity?.Name);
                        
                        if (IsDuplicateKeyError(ex))
                        {
                            return Conflict(new { 
                                Error = "Duplicate reference number",
                                Details = "This reference number is already in use"
                            });
                        }
                        
                        return StatusCode(500, new { 
                            Error = "Database error",
                            Details = ex.InnerException?.Message ?? ex.Message
                        });
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Error creating supplies by user {UserId}", User.Identity?.Name);
                        return StatusCode(500, new { 
                            Error = "Internal server error",
                            Details = ex.Message
                        });
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing supplies creation by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { 
                    Error = "Error processing request",
                    Details = ex.Message
                });
            }
        }

        [HttpPost("{suppliesId}/items")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can add items
        public async Task<IActionResult> AddSuppliesItems(int suppliesId, [FromBody] List<Dictionary<string, object>> items)
        {
            try
            {
                if (suppliesId <= 0)
                {
                    return BadRequest(new { Error = "Invalid supplies ID" });
                }

                if (items == null || items.Count == 0)
                {
                    return BadRequest(new { Error = "No items provided" });
                }

                _logger.LogInformation("Adding items to supplies ID {SuppliesId} by user {UserId}", 
                    suppliesId, User.Identity?.Name);

                var strategy = _context.Database.CreateExecutionStrategy();
                
                return await strategy.ExecuteAsync<IActionResult>(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        var supplies = await _context.Supplies
                            .Include(s => s.Items)
                            .FirstOrDefaultAsync(s => s.Id == suppliesId);

                        if (supplies == null)
                        {
                            _logger.LogWarning("Supplies with ID {SuppliesId} not found for adding items by user {UserId}", 
                                suppliesId, User.Identity?.Name);
                            return NotFound(new { Error = "Supplies not found" });
                        }

                        // Verify all subcategories exist
                        var subCategoryIds = items.Select(i => 
                            int.Parse(i["suppliesSubCategoryId"].ToString())).Distinct();
                        var existingSubCategories = await _context.SuppliesSubCategories
                            .Where(sc => subCategoryIds.Contains(sc.Id))
                            .ToListAsync();

                        if (existingSubCategories.Count != subCategoryIds.Count())
                        {
                            return BadRequest(new { Error = "One or more subcategories not found" });
                        }

                        // Add new items
                        foreach (var item in items)
                        {
                            var subCategoryId = int.Parse(item["suppliesSubCategoryId"].ToString());
                            var quantity = int.Parse(item["quantity"].ToString());
                            
                            if (quantity <= 0)
                            {
                                return BadRequest(new { Error = "Quantity must be greater than 0" });
                            }

                            var subCategory = existingSubCategories.First(sc => sc.Id == subCategoryId);

                            supplies.Items.Add(new SuppliesItem
                            {
                                SuppliesSubCategoryId = subCategoryId,
                                Quantity = quantity,
                                CreatedBy = User.Identity?.Name,
                                CreatedAt = DateTime.UtcNow
                            });
                        }

                        // Update MonetaryValue for عيني supplies
                        if (supplies.SuppliesType == "عيني")
                        {
                            var totalValue = supplies.Items.Sum(i => 
                                i.Quantity * (existingSubCategories.FirstOrDefault(sc => sc.Id == i.SuppliesSubCategoryId)?.UnitPrice ?? 0));
                            supplies.MonetaryValue = totalValue;
                        }

                        supplies.UpdatedBy = User.Identity?.Name;
                        supplies.UpdatedAt = DateTime.UtcNow;

                        await _context.SaveChangesAsync();
                        await _stockHelperService.UpdateStockFromSupplyAsync(supplies.Id);
                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        _logger.LogInformation("Added {Count} items to supplies ID {SuppliesId} by user {UserId}", 
                            items.Count, suppliesId, User.Identity?.Name);

                        return Ok(new 
                        {
                            success = true,
                            itemsAdded = items.Count,
                            monetaryValue = supplies.MonetaryValue,
                            message = "Items added successfully"
                        });
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Error adding supplies items to ID {SuppliesId} by user {UserId}", 
                            suppliesId, User.Identity?.Name);
                        return StatusCode(500, new { 
                            Error = "Internal server error",
                            Details = ex.Message
                        });
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing supplies items addition by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { 
                    Error = "Error processing request",
                    Details = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update
        public async Task<IActionResult> UpdateSupplies(int id, [FromForm] SuppliesUpdateDto dto)
        {
            try
            {
                if (id <= 0 || id != dto.Id)
                {
                    return BadRequest(new { Error = "Invalid supplies ID" });
                }

                _logger.LogInformation("Updating supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);

                var existingSupplies = await _context.Supplies
                    .Include(s => s.Items)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (existingSupplies == null)
                {
                    _logger.LogWarning("Supplies with ID {SuppliesId} not found for update by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Supplies not found" });
                }

                // Validate MonetaryValue for نقدي and نقدي وعيني
                if (dto.SuppliesType == "نقدي" || dto.SuppliesType == "نقدي وعيني")
                {
                    if (dto.MonetaryValue <= 0)
                    {
                        return BadRequest(new { Error = "MonetaryValue must be greater than 0 for cash supplies" });
                    }
                }

                // Validate OngoingProjectId if provided
                if (dto.OngoingProjectId.HasValue)
                {
                    var projectExists = await _context.OngoingProjects.AnyAsync(p => p.Id == dto.OngoingProjectId.Value);
                    if (!projectExists)
                    {
                        return BadRequest(new { Error = "OngoingProject not found" });
                    }
                }

                // Verify all subcategories exist
                var subCategoryIds = dto.Items.Select(i => i.SuppliesSubCategoryId).Distinct();
                var existingSubCategories = await _context.SuppliesSubCategories
                    .Where(sc => subCategoryIds.Contains(sc.Id))
                    .ToListAsync();

                if (existingSubCategories.Count != subCategoryIds.Count())
                {
                    return BadRequest(new { Error = "One or more subcategories not found" });
                }

                // Update basic properties
                existingSupplies.Reference = dto.Reference.Trim();
                existingSupplies.Source = dto.Source?.Trim();
                existingSupplies.Usage = dto.Usage?.Trim();
                existingSupplies.DateOfEntry = dto.DateOfEntry;
                existingSupplies.DateOfExit = dto.DateOfExit;
                existingSupplies.Status = dto.Status ?? "صالح";
                existingSupplies.Description = dto.Description?.Trim();
                existingSupplies.SuppliesType = dto.SuppliesType;
                existingSupplies.SuppliesScope = dto.SuppliesScope;
                existingSupplies.SuppliesNature = dto.SuppliesNature;
                existingSupplies.OngoingProjectId = dto.OngoingProjectId;
                existingSupplies.UpdatedBy = User.Identity?.Name;
                existingSupplies.UpdatedAt = DateTime.UtcNow;

                // Handle file update if provided
                if (dto.LegalFile != null && dto.LegalFile.Length > 0)
                {
                    // Validate file type and size
                    var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx" };
                    var fileExtension = Path.GetExtension(dto.LegalFile.FileName).ToLowerInvariant();
                    
                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        return BadRequest(new { Error = "Invalid file type. Allowed types: PDF, JPG, PNG, DOC, DOCX" });
                    }

                    if (dto.LegalFile.Length > 10 * 1024 * 1024) // 10MB
                    {
                        return BadRequest(new { Error = "File size cannot exceed 10MB" });
                    }

                    var uploadResult = await SaveFile(dto.LegalFile);
                    if (!uploadResult.Success)
                    {
                        return BadRequest(new { Error = uploadResult.ErrorMessage });
                    }
                    
                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(existingSupplies.LegalFilePath))
                    {
                        DeleteFile(existingSupplies.LegalFilePath);
                    }
                    
                    existingSupplies.LegalFilePath = uploadResult.FilePath;
                }

                // Update items
                var itemsToRemove = existingSupplies.Items
                    .Where(existing => !dto.Items.Any(newItem => newItem.Id == existing.Id))
                    .ToList();

                foreach (var item in itemsToRemove)
                {
                    _context.SuppliesItems.Remove(item);
                }

                foreach (var itemDto in dto.Items)
                {
                    var existingItem = existingSupplies.Items.FirstOrDefault(i => i.Id == itemDto.Id);
                    if (existingItem != null)
                    {
                        // Update existing item
                        existingItem.SuppliesSubCategoryId = itemDto.SuppliesSubCategoryId;
                        existingItem.Quantity = itemDto.Quantity;
                        existingItem.UpdatedBy = User.Identity?.Name;
                        existingItem.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        // Add new item
                        existingSupplies.Items.Add(new SuppliesItem
                        {
                            SuppliesSubCategoryId = itemDto.SuppliesSubCategoryId,
                            Quantity = itemDto.Quantity,
                            CreatedBy = User.Identity?.Name,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                // Recalculate MonetaryValue for عيني supplies after updating items
                if (existingSupplies.SuppliesType == "عيني")
                {
                    existingSupplies.MonetaryValue = existingSupplies.Items.Sum(i => 
                        i.Quantity * (existingSubCategories.FirstOrDefault(sc => sc.Id == i.SuppliesSubCategoryId)?.UnitPrice ?? 0));
                }
                else
                {
                    existingSupplies.MonetaryValue = dto.MonetaryValue;
                }

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Supplies updated with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!SuppliesExists(id))
                {
                    return NotFound(new { Error = "Supplies not found" });
                }
                _logger.LogError(ex, "Concurrency error updating supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the supplies" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while updating the supplies" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> DeleteSupplies(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid supplies ID" });
                }

                _logger.LogInformation("Deleting supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);

                var supplies = await _context.Supplies
                    .Include(s => s.Items)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (supplies == null)
                {
                    _logger.LogWarning("Supplies with ID {SuppliesId} not found for deletion by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Supplies not found" });
                }

                // Revert stock first
                await _stockHelperService.RevertStockFromSupplyAsync(id);
                
                // Delete associated file if exists
                if (!string.IsNullOrEmpty(supplies.LegalFilePath))
                {
                    DeleteFile(supplies.LegalFilePath);
                }

                _context.Supplies.Remove(supplies);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Supplies deleted with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting supplies with ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deleting the supplies" });
            }
        }

        [HttpGet("download/{id}")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can download files
        public async Task<IActionResult> DownloadFile(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid supplies ID" });
                }

                var supplies = await _context.Supplies.FindAsync(id);
                if (supplies == null || string.IsNullOrEmpty(supplies.LegalFilePath))
                {
                    return NotFound(new { Error = "File not found" });
                }

                var filePath = Path.Combine(_env.WebRootPath, supplies.LegalFilePath.TrimStart('/'));
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { Error = "File not found on server" });
                }

                _logger.LogInformation("File downloaded for supplies ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);

                return PhysicalFile(filePath, "application/octet-stream", Path.GetFileName(filePath));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file for supplies ID {SuppliesId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "Error downloading file" });
            }
        }

        [HttpGet("by-project/{projectId}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<SuppliesDto>>> GetSuppliesByProject(int projectId)
        {
            try
            {
                if (projectId <= 0)
                {
                    return BadRequest(new { Error = "Invalid project ID" });
                }

                _logger.LogInformation("Fetching supplies for project ID {ProjectId} by user {UserId}", projectId, User.Identity?.Name);

                // Verify project exists
                var projectExists = await _context.OngoingProjects.AnyAsync(p => p.Id == projectId);
                if (!projectExists)
                {
                    return NotFound(new { Error = "Project not found" });
                }

                var supplies = await _context.Supplies
                    .Where(s => s.OngoingProjectId == projectId)
                    .Include(s => s.Items)
                        .ThenInclude(i => i.SuppliesSubCategory)
                            .ThenInclude(sc => sc.SuppliesCategory)
                    .Include(s => s.OngoingProject)
                    .AsNoTracking()
                    .Select(s => new SuppliesDto
                    {
                        Id = s.Id,
                        Reference = s.Reference,
                        Source = s.Source,
                        Usage = s.Usage,
                        DateOfEntry = s.DateOfEntry,
                        DateOfExit = s.DateOfExit,
                        Status = s.Status,
                        Description = s.Description,
                        LegalFilePath = s.LegalFilePath,
                        SuppliesType = s.SuppliesType,
                        SuppliesScope = s.SuppliesScope,
                        SuppliesNature = s.SuppliesNature,
                        MonetaryValue = s.MonetaryValue,
                        OngoingProjectId = s.OngoingProjectId,
                        CreatedBy = s.CreatedBy,
                        CreatedAt = s.CreatedAt,
                        UpdatedBy = s.UpdatedBy,
                        UpdatedAt = s.UpdatedAt,
                        OngoingProject = s.OngoingProject != null ? new OngoingProjectDto
                        {
                            Id = s.OngoingProject.Id,
                            Project = s.OngoingProject.Project,
                            ProjectCode = s.OngoingProject.ProjectCode,
                            ImplementationStatus = s.OngoingProject.ImplementationStatus,
                            Committee = s.OngoingProject.Committee,
                            Year = s.OngoingProject.Year
                        } : null,
                        Items = s.Items.Select(i => new SuppliesItemDto
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

                return Ok(supplies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies for project ID {ProjectId} by user {UserId}", projectId, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving supplies" });
            }
        }

        private bool SuppliesExists(int id)
        {
            return _context.Supplies.Any(e => e.Id == id);
        }

        // Helper method to detect duplicate key errors
        private bool IsDuplicateKeyError(DbUpdateException ex)
        {
            return ex.InnerException is SqlException sqlEx && 
                (sqlEx.Number == 2601 || sqlEx.Number == 2627); // 2601 = Duplicate key, 2627 = Unique constraint
        }

        private async Task<(bool Success, string FilePath, string ErrorMessage)> SaveFile(IFormFile file)
        {
            try
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "supplies");
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

                return (true, $"/uploads/supplies/{uniqueFileName}", null);
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