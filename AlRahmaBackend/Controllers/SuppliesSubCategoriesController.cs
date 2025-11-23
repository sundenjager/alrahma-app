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
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for all endpoints
    public class SuppliesSubCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SuppliesSubCategoriesController> _logger;

        public SuppliesSubCategoriesController(ApplicationDbContext context, ILogger<SuppliesSubCategoriesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<SuppliesSubCategoryDto>>> GetSuppliesSubCategories()
        {
            try
            {
                _logger.LogInformation("Fetching all supplies subcategories by user {UserId}", User.Identity?.Name);

                var subCategories = await _context.SuppliesSubCategories
                    .Include(sc => sc.SuppliesCategory)
                    .AsNoTracking() // Read-only for security
                    .Select(sc => new SuppliesSubCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        UnitPrice = sc.UnitPrice,
                        SuppliesCategoryId = sc.SuppliesCategoryId,
                        SuppliesCategoryName = sc.SuppliesCategory.Name,
                        CreatedAt = sc.CreatedAt,
                        UpdatedAt = sc.UpdatedAt
                    })
                    .OrderBy(sc => sc.Name)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} supplies subcategories for user {UserId}", 
                    subCategories.Count, User.Identity?.Name);

                return Ok(subCategories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies subcategories by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving subcategories" });
            }
        }

        [HttpGet("by-category/{categoryId}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<SuppliesSubCategoryDto>>> GetSubCategoriesByCategory(int categoryId)
        {
            try
            {
                if (categoryId <= 0)
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }

                _logger.LogInformation("Fetching subcategories for category ID {CategoryId} by user {UserId}", 
                    categoryId, User.Identity?.Name);

                // Verify category exists
                var categoryExists = await _context.SuppliesCategories.AnyAsync(c => c.Id == categoryId);
                if (!categoryExists)
                {
                    _logger.LogWarning("Category with ID {CategoryId} not found, requested by user {UserId}", 
                        categoryId, User.Identity?.Name);
                    return NotFound(new { Error = "Category not found" });
                }

                var subCategories = await _context.SuppliesSubCategories
                    .Where(sc => sc.SuppliesCategoryId == categoryId)
                    .AsNoTracking()
                    .Select(sc => new SuppliesSubCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        UnitPrice = sc.UnitPrice,
                        SuppliesCategoryId = sc.SuppliesCategoryId,
                        CreatedAt = sc.CreatedAt,
                        UpdatedAt = sc.UpdatedAt
                    })
                    .OrderBy(sc => sc.Name)
                    .ToListAsync();

                return Ok(subCategories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching subcategories for category ID {CategoryId} by user {UserId}", 
                    categoryId, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving subcategories" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<SuppliesSubCategoryDto>> GetSuppliesSubCategory(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid subcategory ID" });
                }

                _logger.LogInformation("Fetching supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                var subCategory = await _context.SuppliesSubCategories
                    .Include(sc => sc.SuppliesCategory)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(sc => sc.Id == id);

                if (subCategory == null)
                {
                    _logger.LogWarning("Supplies subcategory with ID {SubCategoryId} not found, requested by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Subcategory not found" });
                }

                var subCategoryDto = new SuppliesSubCategoryDto
                {
                    Id = subCategory.Id,
                    Name = subCategory.Name,
                    UnitPrice = subCategory.UnitPrice,
                    SuppliesCategoryId = subCategory.SuppliesCategoryId,
                    SuppliesCategoryName = subCategory.SuppliesCategory?.Name,
                    CreatedAt = subCategory.CreatedAt,
                    UpdatedAt = subCategory.UpdatedAt
                };

                return Ok(subCategoryDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving the subcategory" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create
        public async Task<ActionResult<SuppliesSubCategoryDto>> CreateSuppliesSubCategory([FromBody] SuppliesSubCategoryCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for subcategory creation by user {UserId}", User.Identity?.Name);
                    return BadRequest(new {
                        Error = "Validation failed",
                        Errors = ModelState.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        )
                    });
                }

                // Additional validation
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { Error = "Subcategory name is required" });
                }

                if (dto.UnitPrice < 0)
                {
                    return BadRequest(new { Error = "Unit price must be positive" });
                }

                // Verify category exists
                var categoryExists = await _context.SuppliesCategories.AnyAsync(c => c.Id == dto.SuppliesCategoryId);
                if (!categoryExists)
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }

                // Check for duplicate subcategory name within the same category
                var duplicateExists = await _context.SuppliesSubCategories
                    .AnyAsync(sc => sc.Name.Trim().ToLower() == dto.Name.Trim().ToLower() && 
                                   sc.SuppliesCategoryId == dto.SuppliesCategoryId);
                
                if (duplicateExists)
                {
                    return Conflict(new { Error = "A subcategory with this name already exists in the selected category" });
                }

                _logger.LogInformation("Creating new supplies subcategory '{SubCategoryName}' by user {UserId}", 
                    dto.Name, User.Identity?.Name);

                var subCategory = new SuppliesSubCategory
                {
                    Name = dto.Name.Trim(),
                    UnitPrice = dto.UnitPrice,
                    SuppliesCategoryId = dto.SuppliesCategoryId,
                    CreatedBy = User.Identity?.Name,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedBy = User.Identity?.Name,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SuppliesSubCategories.Add(subCategory);
                await _context.SaveChangesAsync();

                // Reload with category information
                var createdSubCategory = await _context.SuppliesSubCategories
                    .Include(sc => sc.SuppliesCategory)
                    .FirstOrDefaultAsync(sc => sc.Id == subCategory.Id);

                _logger.LogInformation("Supplies subcategory created with ID {SubCategoryId} by user {UserId}", 
                    subCategory.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(GetSuppliesSubCategory), new { id = subCategory.Id }, new SuppliesSubCategoryDto
                {
                    Id = subCategory.Id,
                    Name = subCategory.Name,
                    UnitPrice = subCategory.UnitPrice,
                    SuppliesCategoryId = subCategory.SuppliesCategoryId,
                    SuppliesCategoryName = createdSubCategory?.SuppliesCategory?.Name,
                    CreatedAt = subCategory.CreatedAt,
                    UpdatedAt = subCategory.UpdatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating supplies subcategory by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "A database error occurred while creating the subcategory" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating supplies subcategory by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while creating the subcategory" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update
        public async Task<IActionResult> UpdateSuppliesSubCategory(int id, [FromBody] SuppliesSubCategoryDto dto)
        {
            try
            {
                if (id <= 0 || id != dto.Id)
                {
                    return BadRequest(new { Error = "Invalid subcategory ID" });
                }
                
                // Add validation
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { Error = "Subcategory name is required" });
                }
                
                if (dto.UnitPrice < 0)
                {
                    return BadRequest(new { Error = "Unit price must be positive" });
                }
                
                if (!await _context.SuppliesCategories.AnyAsync(c => c.Id == dto.SuppliesCategoryId))
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }

                _logger.LogInformation("Updating supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                var subCategory = await _context.SuppliesSubCategories.FindAsync(id);
                if (subCategory == null)
                {
                    _logger.LogWarning("Supplies subcategory with ID {SubCategoryId} not found for update by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Subcategory not found" });
                }

                // Check for duplicate subcategory name within the same category (excluding current)
                var duplicateExists = await _context.SuppliesSubCategories
                    .AnyAsync(sc => sc.Name.Trim().ToLower() == dto.Name.Trim().ToLower() && 
                                   sc.SuppliesCategoryId == dto.SuppliesCategoryId &&
                                   sc.Id != id);
                
                if (duplicateExists)
                {
                    return Conflict(new { Error = "A subcategory with this name already exists in the selected category" });
                }

                subCategory.Name = dto.Name.Trim();
                subCategory.UnitPrice = dto.UnitPrice;
                subCategory.SuppliesCategoryId = dto.SuppliesCategoryId;
                subCategory.UpdatedBy = User.Identity?.Name;
                subCategory.UpdatedAt = DateTime.UtcNow;

                try
                {
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Supplies subcategory updated with ID {SubCategoryId} by user {UserId}", 
                        id, User.Identity?.Name);

                    return NoContent();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!SuppliesSubCategoryExists(id))
                    {
                        return NotFound(new { Error = "Subcategory not found" });
                    }
                    throw;
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the subcategory" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while updating the subcategory" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> DeleteSuppliesSubCategory(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid subcategory ID" });
                }

                _logger.LogInformation("Deleting supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                var subCategory = await _context.SuppliesSubCategories
                    .Include(sc => sc.SuppliesItems)
                    .Include(sc => sc.Stocks) // Check if subcategory has stock entries
                    .FirstOrDefaultAsync(sc => sc.Id == id);
                    
                if (subCategory == null)
                {
                    _logger.LogWarning("Supplies subcategory with ID {SubCategoryId} not found for deletion by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Subcategory not found" });
                }

                // Check if subcategory has items
                if (subCategory.SuppliesItems.Any())
                {
                    _logger.LogWarning("Attempt to delete subcategory with items by user {UserId}", User.Identity?.Name);
                    return BadRequest(new { Error = "Cannot delete subcategory that has items. Please delete the items first." });
                }

                // Check if subcategory has stock entries
                if (subCategory.Stocks.Any())
                {
                    _logger.LogWarning("Attempt to delete subcategory with stock entries by user {UserId}", User.Identity?.Name);
                    return BadRequest(new { Error = "Cannot delete subcategory that has stock entries. Please update the stock first." });
                }

                _context.SuppliesSubCategories.Remove(subCategory);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Supplies subcategory deleted with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A database error occurred while deleting the subcategory" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting supplies subcategory with ID {SubCategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deleting the subcategory" });
            }
        }

        [HttpGet("stats")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<SubCategoryStatsDto>> GetSubCategoryStats()
        {
            try
            {
                _logger.LogInformation("Fetching subcategory statistics by user {UserId}", User.Identity?.Name);

                var stats = new SubCategoryStatsDto
                {
                    TotalSubCategories = await _context.SuppliesSubCategories.CountAsync(),
                    SubCategoriesWithItems = await _context.SuppliesSubCategories
                        .CountAsync(sc => sc.SuppliesItems.Any()),
                    SubCategoriesWithStock = await _context.SuppliesSubCategories
                        .CountAsync(sc => sc.Stocks.Any()),
                    AverageUnitPrice = await _context.SuppliesSubCategories
                        .AverageAsync(sc => sc.UnitPrice)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching subcategory statistics by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving subcategory statistics" });
            }
        }

        private bool SuppliesSubCategoryExists(int id) => 
            _context.SuppliesSubCategories.Any(e => e.Id == id);
    }

    // DTO for subcategory statistics
    public class SubCategoryStatsDto
    {
        public int TotalSubCategories { get; set; }
        public int SubCategoriesWithItems { get; set; }
        public int SubCategoriesWithStock { get; set; }
        public decimal AverageUnitPrice { get; set; }
    }
}