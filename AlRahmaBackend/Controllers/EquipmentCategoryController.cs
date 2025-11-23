using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using Microsoft.Extensions.Logging;
using AlRahmaBackend.DTOs;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EquipmentCategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EquipmentCategoryController> _logger;

        public EquipmentCategoryController(ApplicationDbContext context, ILogger<EquipmentCategoryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<EquipmentCategory>>> GetEquipmentCategories()
        {
            try
            {
                var categories = await _context.EquipmentCategories
                    .OrderBy(c => c.Name)
                    .ToListAsync();
                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment categories");
                return StatusCode(500, new { Error = "An error occurred while retrieving equipment categories" });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<EquipmentCategory>> GetEquipmentCategory(int id)
        {
            try
            {
                var category = await _context.EquipmentCategories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new { Error = "Category not found" });
                }

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment category with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while retrieving the category" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<EquipmentCategory>> PostEquipmentCategory([FromBody] CreateEquipmentCategoryDto dto)
        {
            _logger.LogInformation("Received DTO: Name={Name}, Description={Description}", dto?.Name, dto?.Description);

            if (dto == null)
            {
                _logger.LogError("DTO is null");
                return BadRequest(new { Error = "Request body is empty or invalid" });
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                _logger.LogError("Category name is null or empty");
                return BadRequest(new { Error = "Category name is required" });
            }

            var normalizedName = dto.Name.Trim();

            // FIX: Use ToLower() for case-insensitive comparison instead of StringComparison.OrdinalIgnoreCase
            if (await _context.EquipmentCategories.AnyAsync(c =>
                c.Name.ToLower() == normalizedName.ToLower()))
            {
                return Conflict(new { Error = "Category already exists" });
            }

            var category = new EquipmentCategory
            {
                Name = normalizedName,
                Description = dto.Description?.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.EquipmentCategories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEquipmentCategory), new { id = category.Id }, category);
        }
        
        
                
        

        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> PutEquipmentCategory(int id, [FromBody] UpdateEquipmentCategoryDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { Error = "Request body is empty or invalid" });
                }

                if (string.IsNullOrEmpty(dto.Name?.Trim()))
                {
                    return BadRequest(new { Error = "Category name is required" });
                }

                var normalizedName = dto.Name.Trim();
                
                // Check for duplicate names (excluding current category)
                if (await _context.EquipmentCategories.AnyAsync(c => 
                    c.Name.ToLower() == normalizedName.ToLower() && c.Id != id))
                {
                    return Conflict(new { Error = "Category name already exists" });
                }

                var existingCategory = await _context.EquipmentCategories.FindAsync(id);
                if (existingCategory == null)
                {
                    return NotFound(new { Error = "Category not found" });
                }

                // Store old category name for updating equipment
                var oldCategoryName = existingCategory.Name;

                // Update category
                existingCategory.Name = normalizedName;
                existingCategory.Description = dto.Description?.Trim();
                existingCategory.UpdatedAt = DateTime.UtcNow;

                // ✅ UPDATE ALL RELATED EQUIPMENT: Cascade the category name change
                var relatedEquipment = await _context.MedicalEquipments
                    .Where(e => e.Category == oldCategoryName)
                    .ToListAsync();

                foreach (var equipment in relatedEquipment)
                {
                    equipment.Category = normalizedName;
                    equipment.UpdatedBy = User.Identity?.Name;
                    equipment.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Equipment category '{OldCategoryName}' updated to '{NewCategoryName}' by user {UserId}. Updated {EquipmentCount} equipment records.", 
                    oldCategoryName, existingCategory.Name, relatedEquipment.Count, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EquipmentCategoryExists(id))
                {
                    return NotFound(new { Error = "Category not found" });
                }
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating equipment category with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the category" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")]
        public async Task<IActionResult> DeleteEquipmentCategory(int id)
        {
            var executionStrategy = _context.Database.CreateExecutionStrategy();

            try
            {
                await executionStrategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        var category = await _context.EquipmentCategories.FindAsync(id);
                        if (category == null)
                            throw new KeyNotFoundException("Category not found");

                        var categoryName = category.Name;

                        var relatedEquipment = await _context.MedicalEquipments
                            .Include(e => e.Dispatches)
                            .Where(e => e.Category == categoryName)
                            .ToListAsync();

                        if (relatedEquipment.Any())
                        {
                            var allDispatches = relatedEquipment.SelectMany(e => e.Dispatches).ToList();
                            if (allDispatches.Any())
                            {
                                _context.EquipmentDispatches.RemoveRange(allDispatches);
                            }

                            _context.MedicalEquipments.RemoveRange(relatedEquipment);
                        }

                        _context.EquipmentCategories.Remove(category);
                        await _context.SaveChangesAsync();

                        await transaction.CommitAsync();
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });

                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Category not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting equipment category with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the category and related equipment" });
            }

        }

        private bool EquipmentCategoryExists(int id)
        {
            return _context.EquipmentCategories.Any(e => e.Id == id);
        }
    }
}