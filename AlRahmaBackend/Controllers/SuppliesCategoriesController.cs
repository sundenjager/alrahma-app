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
    public class SuppliesCategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SuppliesCategoriesController> _logger;

        public SuppliesCategoriesController(ApplicationDbContext context, ILogger<SuppliesCategoriesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<SuppliesCategoryDto>>> GetSuppliesCategories()
        {
            try
            {
                _logger.LogInformation("Fetching supplies categories by user {UserId}", User.Identity?.Name);

                var categories = await _context.SuppliesCategories
                    .Include(c => c.SubCategories)
                    .AsNoTracking() // Read-only for security
                    .Select(c => new SuppliesCategoryDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        SubCategories = c.SubCategories.Select(sc => new SuppliesSubCategoryDto
                        {
                            Id = sc.Id,
                            Name = sc.Name,
                            UnitPrice = sc.UnitPrice,
                            SuppliesCategoryId = sc.SuppliesCategoryId,
                            CreatedAt = sc.CreatedAt,
                            UpdatedAt = sc.UpdatedAt
                        }).ToList()
                    })
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} supplies categories for user {UserId}", 
                    categories.Count, User.Identity?.Name);

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies categories by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving supplies categories" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<SuppliesCategoryDto>> GetSuppliesCategory(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }

                _logger.LogInformation("Fetching supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                var category = await _context.SuppliesCategories
                    .Include(c => c.SubCategories)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == id);
                    
                if (category == null)
                {
                    _logger.LogWarning("Supplies category with ID {CategoryId} not found, requested by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Category not found" });
                }

                var categoryDto = new SuppliesCategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    CreatedAt = category.CreatedAt,
                    UpdatedAt = category.UpdatedAt,
                    SubCategories = category.SubCategories.Select(sc => new SuppliesSubCategoryDto
                    {
                        Id = sc.Id,
                        Name = sc.Name,
                        UnitPrice = sc.UnitPrice,
                        SuppliesCategoryId = sc.SuppliesCategoryId,
                        CreatedAt = sc.CreatedAt,
                        UpdatedAt = sc.UpdatedAt
                    }).ToList()
                };

                return Ok(categoryDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving the category" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create
        public async Task<ActionResult<SuppliesCategoryDto>> CreateSuppliesCategory([FromBody] SuppliesCategoryCreateDto dto)
        {
            try
            {
                // Add explicit validation
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { Error = "Category name is required" });
                }

                // Check for duplicate category name
                var existingCategory = await _context.SuppliesCategories
                    .FirstOrDefaultAsync(c => c.Name.Trim().ToLower() == dto.Name.Trim().ToLower());
                
                if (existingCategory != null)
                {
                    return Conflict(new { Error = "A category with this name already exists" });
                }

                _logger.LogInformation("Creating new supplies category '{CategoryName}' by user {UserId}", 
                    dto.Name, User.Identity?.Name);

                var category = new SuppliesCategory
                {
                    Name = dto.Name.Trim(),
                    Description = dto.Description?.Trim(),
                    CreatedBy = User.Identity?.Name,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedBy = User.Identity?.Name,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SuppliesCategories.Add(category);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Supplies category created with ID {CategoryId} by user {UserId}", 
                    category.Id, User.Identity?.Name);

                // Return the created category with ID
                return CreatedAtAction(nameof(GetSuppliesCategory), new { id = category.Id }, new SuppliesCategoryDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    Description = category.Description,
                    CreatedAt = category.CreatedAt,
                    UpdatedAt = category.UpdatedAt,
                    SubCategories = new List<SuppliesSubCategoryDto>()
                });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating supplies category by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "A database error occurred while creating the category" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating supplies category by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while creating the category" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update
        public async Task<IActionResult> UpdateSuppliesCategory(int id, [FromBody] SuppliesCategoryDto dto)
        {
            try
            {
                if (id <= 0 || id != dto.Id)
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }
                
                if (string.IsNullOrWhiteSpace(dto.Name))
                {
                    return BadRequest(new { Error = "Category name is required" });
                }

                _logger.LogInformation("Updating supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                var category = await _context.SuppliesCategories.FindAsync(id);
                if (category == null)
                {
                    _logger.LogWarning("Supplies category with ID {CategoryId} not found for update by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Category not found" });
                }

                // Check for duplicate category name (excluding current category)
                var existingCategory = await _context.SuppliesCategories
                    .FirstOrDefaultAsync(c => c.Name.Trim().ToLower() == dto.Name.Trim().ToLower() && c.Id != id);
                
                if (existingCategory != null)
                {
                    return Conflict(new { Error = "A category with this name already exists" });
                }

                category.Name = dto.Name.Trim();
                category.Description = dto.Description?.Trim();
                category.UpdatedBy = User.Identity?.Name;
                category.UpdatedAt = DateTime.UtcNow;

                try
                {
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Supplies category updated with ID {CategoryId} by user {UserId}", 
                        id, User.Identity?.Name);

                    return NoContent();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!SuppliesCategoryExists(id))
                    {
                        return NotFound(new { Error = "Category not found" });
                    }
                    throw;
                }
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the category" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while updating the category" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> DeleteSuppliesCategory(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }

                _logger.LogInformation("Deleting supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                var category = await _context.SuppliesCategories
                    .Include(c => c.SubCategories)
                    .FirstOrDefaultAsync(c => c.Id == id);
                    
                if (category == null)
                {
                    _logger.LogWarning("Supplies category with ID {CategoryId} not found for deletion by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Category not found" });
                }

                // Check if category has subcategories
                if (category.SubCategories.Any())
                {
                    _logger.LogWarning("Attempt to delete category with subcategories by user {UserId}", User.Identity?.Name);
                    return BadRequest(new { Error = "Cannot delete category that has subcategories. Please delete the subcategories first." });
                }

                _context.SuppliesCategories.Remove(category);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Supplies category deleted with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A database error occurred while deleting the category" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting supplies category with ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deleting the category" });
            }
        }

        [HttpGet("{id}/subcategories")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<SuppliesSubCategoryDto>>> GetCategorySubCategories(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid category ID" });
                }

                _logger.LogInformation("Fetching subcategories for category ID {CategoryId} by user {UserId}", 
                    id, User.Identity?.Name);

                // Verify category exists
                var categoryExists = await _context.SuppliesCategories.AnyAsync(c => c.Id == id);
                if (!categoryExists)
                {
                    return NotFound(new { Error = "Category not found" });
                }

                var subCategories = await _context.SuppliesSubCategories
                    .Where(sc => sc.SuppliesCategoryId == id)
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
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving subcategories" });
            }
        }

        [HttpGet("stats")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<CategoryStatsDto>> GetCategoryStats()
        {
            try
            {
                _logger.LogInformation("Fetching category statistics by user {UserId}", User.Identity?.Name);

                var stats = new CategoryStatsDto
                {
                    TotalCategories = await _context.SuppliesCategories.CountAsync(),
                    TotalSubCategories = await _context.SuppliesSubCategories.CountAsync(),
                    CategoriesWithSubCategories = await _context.SuppliesCategories
                        .CountAsync(c => c.SubCategories.Any()),
                    CategoriesWithoutSubCategories = await _context.SuppliesCategories
                        .CountAsync(c => !c.SubCategories.Any())
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching category statistics by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving category statistics" });
            }
        }

        private bool SuppliesCategoryExists(int id) => 
            _context.SuppliesCategories.Any(e => e.Id == id);
    }

    // DTO for category statistics
    public class CategoryStatsDto
    {
        public int TotalCategories { get; set; }
        public int TotalSubCategories { get; set; }
        public int CategoriesWithSubCategories { get; set; }
        public int CategoriesWithoutSubCategories { get; set; }
    }
}