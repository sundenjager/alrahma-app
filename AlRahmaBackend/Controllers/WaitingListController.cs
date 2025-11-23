using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class WaitingListController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<WaitingListController> _logger;

        public WaitingListController(ApplicationDbContext context, ILogger<WaitingListController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/WaitingList
        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<WaitingListEntryDto>>> GetWaitingListEntries(
            [FromQuery] string date = null,
            [FromQuery] string status = null)
        {
            try
            {
                _logger.LogInformation("Fetching waiting list entries by user {UserId}", User.Identity?.Name);

                var query = _context.WaitingListEntries.AsQueryable();

                if (!string.IsNullOrEmpty(date))
                {
                    if (DateTime.TryParse(date, out DateTime filterDate))
                    {
                        query = query.Where(e => e.Date.Date == filterDate.Date);
                    }
                    else
                    {
                        return BadRequest(new { Error = "تنسيق التاريخ غير صحيح. استخدم الصيغة YYYY-MM-DD" });
                    }
                }

                if (!string.IsNullOrEmpty(status))
                {
                    // Validate status
                    var validStatuses = new[] { "pending", "done", "refused" };
                    if (!validStatuses.Contains(status.ToLower()))
                    {
                        return BadRequest(new { Error = $"الحالة غير صالحة. يجب أن تكون واحدة من: {string.Join(", ", validStatuses)}" });
                    }
                    query = query.Where(e => e.Status == status);
                }

                var entries = await query
                    .OrderByDescending(e => e.CreatedAt)
                    .AsNoTracking() // Read-only for security
                    .Select(e => new WaitingListEntryDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        Date = e.Date,
                        PhoneNumber = e.PhoneNumber,
                        Address = e.Address,
                        Reason = e.Reason,
                        Status = e.Status,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt
                        // Removed CreatedBy as it doesn't exist in your model
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} waiting list entries for user {UserId}", entries.Count, User.Identity?.Name);

                return Ok(entries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching waiting list entries by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving waiting list entries" });
            }
        }

        // GET: api/WaitingList/5
        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<WaitingListEntryDto>> GetWaitingListEntry(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid entry ID" });
                }

                _logger.LogInformation("Fetching waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);

                var entry = await _context.WaitingListEntries
                    .Where(e => e.Id == id)
                    .AsNoTracking()
                    .Select(e => new WaitingListEntryDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        Date = e.Date,
                        PhoneNumber = e.PhoneNumber,
                        Address = e.Address,
                        Reason = e.Reason,
                        Status = e.Status,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt
                        // Removed CreatedBy and UpdatedBy as they don't exist in your model
                    })
                    .FirstOrDefaultAsync();

                if (entry == null)
                {
                    _logger.LogWarning("Waiting list entry with ID {EntryId} not found, requested by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Waiting list entry not found" });
                }

                return Ok(entry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving the waiting list entry" });
            }
        }

        // POST: api/WaitingList
        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create
        public async Task<ActionResult<WaitingListEntryDto>> CreateWaitingListEntry([FromBody] CreateWaitingListEntryDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for waiting list entry creation by user {UserId}", User.Identity?.Name);
                    return BadRequest(new
                    {
                        Error = "Validation failed",
                        Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                // Additional validation
                if (string.IsNullOrWhiteSpace(createDto.Name))
                {
                    return BadRequest(new { Error = "Name is required" });
                }

                if (createDto.Date < DateTime.UtcNow.Date)
                {
                    return BadRequest(new { Error = "Date cannot be in the past" });
                }

                _logger.LogInformation("Creating new waiting list entry for {Name} by user {UserId}", createDto.Name, User.Identity?.Name);

                var entry = new WaitingListEntry
                {
                    Name = createDto.Name.Trim(),
                    Date = createDto.Date.ToUniversalTime(),
                    PhoneNumber = createDto.PhoneNumber?.Trim(),
                    Address = createDto.Address?.Trim(),
                    Reason = createDto.Reason?.Trim(),
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                    // Removed CreatedBy and UpdatedBy as they don't exist in your model
                };

                _context.WaitingListEntries.Add(entry);
                await _context.SaveChangesAsync();

                var entryDto = new WaitingListEntryDto
                {
                    Id = entry.Id,
                    Name = entry.Name,
                    Date = entry.Date,
                    PhoneNumber = entry.PhoneNumber,
                    Address = entry.Address,
                    Reason = entry.Reason,
                    Status = entry.Status,
                    CreatedAt = entry.CreatedAt
                    // Removed CreatedBy as it doesn't exist in your model
                };

                _logger.LogInformation("Waiting list entry created with ID {EntryId} by user {UserId}", entry.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(GetWaitingListEntry), new { id = entry.Id }, entryDto);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating waiting list entry by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "A database error occurred while creating the waiting list entry" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating waiting list entry by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while creating the waiting list entry" });
            }
        }

        // PATCH: api/WaitingList/5/status
        [HttpPatch("{id}/status")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update status
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto statusDto)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid entry ID" });
                }

                if (string.IsNullOrWhiteSpace(statusDto.Status))
                {
                    return BadRequest(new { Error = "Status is required" });
                }

                _logger.LogInformation("Updating status for waiting list entry ID {EntryId} to {Status} by user {UserId}",
                    id, statusDto.Status, User.Identity?.Name);

                var entry = await _context.WaitingListEntries.FindAsync(id);
                if (entry == null)
                {
                    _logger.LogWarning("Waiting list entry with ID {EntryId} not found for status update by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Waiting list entry not found" });
                }

                // التحقق من أن الحالة صالحة
                var validStatuses = new[] { "pending", "done", "refused" };
                if (!validStatuses.Contains(statusDto.Status.ToLower()))
                {
                    return BadRequest(new { Error = $"الحالة غير صالحة. يجب أن تكون واحدة من: {string.Join(", ", validStatuses)}" });
                }

                entry.Status = statusDto.Status;
                entry.UpdatedAt = DateTime.UtcNow;
                // Removed UpdatedBy as it doesn't exist in your model

                await _context.SaveChangesAsync();

                _logger.LogInformation("Status updated for waiting list entry ID {EntryId} by user {UserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating status for waiting list entry ID {EntryId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while updating the status" });
            }
        }

        // PUT: api/WaitingList/5
        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update
        public async Task<IActionResult> UpdateWaitingListEntry(int id, [FromBody] UpdateWaitingListEntryDto updateDto)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid entry ID" });
                }

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for waiting list entry update by user {UserId}", User.Identity?.Name);
                    return BadRequest(new
                    {
                        Error = "Validation failed",
                        Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                    });
                }

                _logger.LogInformation("Updating waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);

                var entry = await _context.WaitingListEntries.FindAsync(id);
                if (entry == null)
                {
                    _logger.LogWarning("Waiting list entry with ID {EntryId} not found for update by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Waiting list entry not found" });
                }

                // Validate status
                var validStatuses = new[] { "pending", "done", "refused" };
                if (!validStatuses.Contains(updateDto.Status.ToLower()))
                {
                    return BadRequest(new { Error = $"الحالة غير صالحة. يجب أن تكون واحدة من: {string.Join(", ", validStatuses)}" });
                }

                entry.Name = updateDto.Name.Trim();
                entry.Date = updateDto.Date.ToUniversalTime();
                entry.PhoneNumber = updateDto.PhoneNumber?.Trim();
                entry.Address = updateDto.Address?.Trim();
                entry.Reason = updateDto.Reason?.Trim();
                entry.Status = updateDto.Status;
                entry.UpdatedAt = DateTime.UtcNow;
                // Removed UpdatedBy as it doesn't exist in your model

                await _context.SaveChangesAsync();

                _logger.LogInformation("Waiting list entry updated with ID {EntryId} by user {UserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!WaitingListEntryExists(id))
                {
                    return NotFound(new { Error = "Waiting list entry not found" });
                }
                _logger.LogError(ex, "Concurrency error updating waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the waiting list entry" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while updating the waiting list entry" });
            }
        }

        // DELETE: api/WaitingList/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> DeleteWaitingListEntry(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid entry ID" });
                }

                _logger.LogInformation("Deleting waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);

                var entry = await _context.WaitingListEntries.FindAsync(id);
                if (entry == null)
                {
                    _logger.LogWarning("Waiting list entry with ID {EntryId} not found for deletion by user {UserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "Waiting list entry not found" });
                }

                _context.WaitingListEntries.Remove(entry);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Waiting list entry deleted with ID {EntryId} by user {UserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A database error occurred while deleting the waiting list entry" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting waiting list entry with ID {EntryId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deleting the waiting list entry" });
            }
        }

        // GET: api/WaitingList/stats
        [HttpGet("stats")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read stats
        public async Task<ActionResult<WaitingListStatsDto>> GetWaitingListStats()
        {
            try
            {
                _logger.LogInformation("Fetching waiting list statistics by user {UserId}", User.Identity?.Name);

                var stats = new WaitingListStatsDto
                {
                    TotalEntries = await _context.WaitingListEntries.CountAsync(),
                    PendingEntries = await _context.WaitingListEntries.CountAsync(e => e.Status == "pending"),
                    CompletedEntries = await _context.WaitingListEntries.CountAsync(e => e.Status == "done"),
                    RefusedEntries = await _context.WaitingListEntries.CountAsync(e => e.Status == "refused"),
                    TodayEntries = await _context.WaitingListEntries.CountAsync(e => e.Date.Date == DateTime.UtcNow.Date)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching waiting list statistics by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving waiting list statistics" });
            }
        }

        // GET: api/WaitingList/today
        [HttpGet("today")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read today's entries
        public async Task<ActionResult<IEnumerable<WaitingListEntryDto>>> GetTodayEntries()
        {
            try
            {
                _logger.LogInformation("Fetching today's waiting list entries by user {UserId}", User.Identity?.Name);

                var entries = await _context.WaitingListEntries
                    .Where(e => e.Date.Date == DateTime.UtcNow.Date)
                    .OrderBy(e => e.Date)
                    .AsNoTracking()
                    .Select(e => new WaitingListEntryDto
                    {
                        Id = e.Id,
                        Name = e.Name,
                        Date = e.Date,
                        PhoneNumber = e.PhoneNumber,
                        Address = e.Address,
                        Reason = e.Reason,
                        Status = e.Status,
                        CreatedAt = e.CreatedAt,
                        UpdatedAt = e.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(entries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching today's waiting list entries by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving today's waiting list entries" });
            }
        }

        private bool WaitingListEntryExists(int id)
        {
            return _context.WaitingListEntries.Any(e => e.Id == id);
        }
    }

    // DTO for status update
    public class UpdateStatusDto
    {
        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = string.Empty;
    }

    // DTO for waiting list statistics
    public class WaitingListStatsDto
    {
        public int TotalEntries { get; set; }
        public int PendingEntries { get; set; }
        public int CompletedEntries { get; set; }
        public int RefusedEntries { get; set; }
        public int TodayEntries { get; set; }
    }
}

