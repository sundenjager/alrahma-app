using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Security.Claims;

namespace AlRahmaBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ActImmCategoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ActImmCategoryController> _logger;

        public ActImmCategoryController(ApplicationDbContext context, ILogger<ActImmCategoryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/ActImmCategory
        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view categories
        public async Task<ActionResult<IEnumerable<ActImmCategory>>> GetCategories()
        {
            try
            {
                _logger.LogInformation("User {UserId} accessed categories list", User.FindFirstValue(ClaimTypes.NameIdentifier));

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

        [HttpGet("all")]
        [Authorize(Roles = "SuperAdmin,Admin")]
        public async Task<ActionResult<IEnumerable<ActImmCategory>>> GetAllCategories(bool includeInactive = false)
        {
            try
            {
                var query = _context.ActImmCategories.AsQueryable();
                
                if (!includeInactive)
                    query = query.Where(c => c.IsActive);
                    
                return await query.OrderBy(c => c.Name).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all categories");
                return StatusCode(500, "An error occurred while retrieving categories");
            }
        }

        // GET: api/ActImmCategory/5
        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,User")] // ← All authenticated users can view specific categories
        public async Task<ActionResult<ActImmCategory>> GetCategory(int id)
        {
            try
            {
                var category = await _context.ActImmCategories.FindAsync(id);

                if (category == null)
                {
                    _logger.LogWarning("Category {CategoryId} not found by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                _logger.LogInformation("User {UserId} accessed category {CategoryId}", User.FindFirstValue(ClaimTypes.NameIdentifier), id);
                return category;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category {CategoryId} for user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while retrieving the category");
            }
        }

        // POST: api/ActImmCategory
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can create categories
        public async Task<ActionResult<ActImmCategory>> PostCategory(ActImmCategory category)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(category.Name))
                {
                    return BadRequest("Category name is required");
                }

                // Check for duplicate category name
                if (await _context.ActImmCategories.AnyAsync(c => c.Name == category.Name))
                {
                    _logger.LogWarning("Duplicate category name attempt: {CategoryName} by user {UserId}", category.Name, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return Conflict("Category name already exists");
                }

                category.CreatedAt = DateTime.UtcNow;
                category.IsActive = true;

                _context.ActImmCategories.Add(category);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Category {CategoryId} created by user {UserId}", category.Id, User.FindFirstValue(ClaimTypes.NameIdentifier));

                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category by user {UserId}", User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while creating the category");
            }
        }

        // PUT: api/ActImmCategory/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,Admin")] // ← Only admins can update categories
        public async Task<IActionResult> PutCategory(int id, ActImmCategory category)
        {
            try
            {
                if (id != category.Id)
                {
                    return BadRequest("ID mismatch");
                }

                // Validate input
                if (string.IsNullOrWhiteSpace(category.Name))
                {
                    return BadRequest("Category name is required");
                }

                // Check for duplicate category name (excluding current category)
                if (await _context.ActImmCategories.AnyAsync(c => c.Name == category.Name && c.Id != id))
                {
                    _logger.LogWarning("Duplicate category name attempt during update: {CategoryName} by user {UserId}", category.Name, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return Conflict("Category name already exists");
                }

                var existingCategory = await _context.ActImmCategories.FindAsync(id);
                if (existingCategory == null)
                {
                    _logger.LogWarning("Category {CategoryId} not found for update by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                // Update only allowed fields
                existingCategory.Name = category.Name;
                existingCategory.IsActive = category.IsActive;
                existingCategory.UpdatedAt = DateTime.UtcNow;

                _context.Entry(existingCategory).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Category {CategoryId} updated by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CategoryExists(id))
                    {
                        return NotFound();
                    }
                    throw;
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {CategoryId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while updating the category");
            }
        }

        // DELETE: api/ActImmCategory/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")] // ← Only SuperAdmin can delete categories (most restrictive)
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var category = await _context.ActImmCategories.FindAsync(id);
                if (category == null)
                {
                    _logger.LogWarning("Category {CategoryId} not found for deletion by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return NotFound();
                }

                // Check if category is in use
                if (await _context.ActImms.AnyAsync(a => a.CategoryId == id))
                {
                    _logger.LogWarning("Attempt to delete category {CategoryId} in use by assets by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                    return BadRequest("Category is in use by assets and cannot be deleted");
                }

                _context.ActImmCategories.Remove(category);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Category {CategoryId} deleted by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category {CategoryId} by user {UserId}", id, User.FindFirstValue(ClaimTypes.NameIdentifier));
                return StatusCode(500, "An error occurred while deleting the category");
            }
        }

        private bool CategoryExists(int id)
        {
            return _context.ActImmCategories.Any(e => e.Id == id);
        }
    }
}