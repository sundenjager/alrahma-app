using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MembershipHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MembershipHistoryController> _logger;

        public MembershipHistoryController(ApplicationDbContext context, ILogger<MembershipHistoryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/MembershipHistory/member/5
        [HttpGet("member/{memberId}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<MembershipHistoryResponseDTO>>> GetMembershipHistoryByMember(int memberId)
        {
            try
            {
                if (memberId <= 0)
                {
                    return BadRequest(new { Error = "Invalid member ID" });
                }

                _logger.LogInformation("Fetching membership history for member ID: {MemberId}", memberId);

                var history = await _context.MembershipHistories
                    .Where(mh => mh.MemberId == memberId)
                    .OrderByDescending(mh => mh.UpdateDate)
                    .AsNoTracking()
                    .Select(mh => new MembershipHistoryResponseDTO
                    {
                        Id = mh.Id,
                        MemberId = mh.MemberId ?? 0,
                        UpdateDate = mh.UpdateDate,
                        CardNumber = mh.CardNumber, // Ensure this is included
                        UpdatedBy = mh.UpdatedBy,
                        CreatedAt = mh.CreatedAt,
                        UpdatedAt = mh.UpdatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {Count} history records for member {MemberId}", history.Count, memberId);
                
                // Log each record for debugging
                foreach (var record in history)
                {
                    _logger.LogInformation("History Record - ID: {Id}, Date: {Date}, Card: {Card}", 
                        record.Id, record.UpdateDate, record.CardNumber);
                }

                if (!history.Any())
                {
                    _logger.LogInformation("No membership history found for member {MemberId}", memberId);
                    return Ok(new List<MembershipHistoryResponseDTO>()); // Return empty list instead of error
                }

                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving membership history for member ID: {MemberId}", memberId);
                return StatusCode(500, new { Error = "An error occurred while retrieving membership history" });
            }
        }

        // GET: api/MembershipHistory/5
        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<MembershipHistoryResponseDTO>> GetMembershipHistory(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid membership history ID" });
                }

                var history = await _context.MembershipHistories
                    .Where(mh => mh.Id == id)
                    .AsNoTracking()
                    .Select(mh => new MembershipHistoryResponseDTO
                    {
                        Id = mh.Id,
                        MemberId = mh.MemberId ?? 0,
                        UpdateDate = mh.UpdateDate,
                        CardNumber = mh.CardNumber,
                        UpdatedBy = mh.UpdatedBy,
                        CreatedAt = mh.CreatedAt,
                        UpdatedAt = mh.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (history == null)
                {
                    return NotFound(new { Error = "Membership history record not found" });
                }

                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving membership history with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while retrieving membership history" });
            }
        }

        // POST: api/MembershipHistory
        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<MembershipHistoryResponseDTO>> PostMembershipHistory(MembershipHistoryDTO membershipHistoryDTO)
        {
            try
            {
                // Validate input
                var errors = ValidateMembershipHistoryDTO(membershipHistoryDTO);
                if (errors.Any())
                {
                    return BadRequest(new { Errors = errors });
                }

                // Validate the member exists
                var member = await _context.Members.FindAsync(membershipHistoryDTO.MemberId);
                if (member == null)
                {
                    return NotFound(new { Error = "Member not found" });
                }

                // Validate the date is not in the future
                if (membershipHistoryDTO.UpdateDate > DateTime.UtcNow)
                {
                    return BadRequest(new { Error = "Cannot add a future date for membership update" });
                }

                // Check if there's already an update for this year
                var year = membershipHistoryDTO.UpdateDate.Year;
                var existingUpdate = await _context.MembershipHistories
                    .Where(mh => mh.MemberId == membershipHistoryDTO.MemberId)
                    .AnyAsync(mh => mh.UpdateDate.Year == year);

                if (existingUpdate)
                {
                    return Conflict(new { Error = $"Membership already renewed for year {year}" });
                }

                // Create and save the new membership history
                var membershipHistory = new MembershipHistory
                {
                    MemberId = membershipHistoryDTO.MemberId,
                    UpdateDate = membershipHistoryDTO.UpdateDate,
                    CardNumber = membershipHistoryDTO.CardNumber?.Trim(),
                    UpdatedBy = User.Identity?.Name,
                    CreatedAt = DateTime.UtcNow
                };

                _context.MembershipHistories.Add(membershipHistory);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Membership history created for member ID: {MemberId} by user: {UserId}", 
                    membershipHistoryDTO.MemberId, User.Identity?.Name);

                return CreatedAtAction(nameof(GetMembershipHistory), new { id = membershipHistory.Id }, new MembershipHistoryResponseDTO
                {
                    Id = membershipHistory.Id,
                    MemberId = membershipHistory.MemberId ?? 0,
                    UpdateDate = membershipHistory.UpdateDate,
                    CardNumber = membershipHistory.CardNumber,
                    UpdatedBy = membershipHistory.UpdatedBy,
                    CreatedAt = membershipHistory.CreatedAt
                });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating membership history");
                return StatusCode(500, new { Error = "A database error occurred while creating the membership history" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating membership history");
                return StatusCode(500, new { Error = "An unexpected error occurred" });
            }
        }

        // PUT: api/MembershipHistory/5
        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<MembershipHistoryResponseDTO>> PutMembershipHistory(int id, MembershipHistoryDTO membershipHistoryDTO)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid membership history ID" });
                }

                // Validate input
                var errors = ValidateMembershipHistoryDTO(membershipHistoryDTO);
                if (errors.Any())
                {
                    return BadRequest(new { Errors = errors });
                }

                var membershipHistory = await _context.MembershipHistories
                    .Include(mh => mh.Member)
                    .FirstOrDefaultAsync(mh => mh.Id == id);
                    
                if (membershipHistory == null)
                {
                    return NotFound(new { Error = "Membership history record not found" });
                }

                // Check if this is the oldest record (initial membership date)
                var oldestHistory = await _context.MembershipHistories
                    .Where(mh => mh.MemberId == membershipHistory.MemberId)
                    .OrderBy(mh => mh.UpdateDate)
                    .FirstOrDefaultAsync();

                if (oldestHistory?.Id == id)
                {
                    return BadRequest(new { Error = "Cannot modify the initial membership record. This represents the member's join date and must be preserved." });
                }

                // Validate the member exists
                var memberExists = await _context.Members.AnyAsync(m => m.Id == membershipHistoryDTO.MemberId);
                if (!memberExists)
                {
                    return NotFound(new { Error = "Member not found" });
                }

                // Validate the date is not in the future
                if (membershipHistoryDTO.UpdateDate > DateTime.UtcNow)
                {
                    return BadRequest(new { Error = "Cannot set a future date for membership update" });
                }

                // Check for duplicate year update (excluding current record)
                var year = membershipHistoryDTO.UpdateDate.Year;
                var existingUpdate = await _context.MembershipHistories
                    .Where(mh => mh.MemberId == membershipHistoryDTO.MemberId && mh.Id != id)
                    .AnyAsync(mh => mh.UpdateDate.Year == year);

                if (existingUpdate)
                {
                    return Conflict(new { Error = $"Another membership update already exists for year {year}" });
                }

                // Update properties
                membershipHistory.MemberId = membershipHistoryDTO.MemberId;
                membershipHistory.UpdateDate = membershipHistoryDTO.UpdateDate;
                membershipHistory.CardNumber = membershipHistoryDTO.CardNumber?.Trim();
                membershipHistory.UpdatedBy = User.Identity?.Name;
                membershipHistory.UpdatedAt = DateTime.UtcNow;

                _context.Entry(membershipHistory).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Membership history updated with ID: {HistoryId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return Ok(new MembershipHistoryResponseDTO
                {
                    Id = membershipHistory.Id,
                    MemberId = membershipHistory.MemberId ?? 0,
                    UpdateDate = membershipHistory.UpdateDate,
                    CardNumber = membershipHistory.CardNumber,
                    UpdatedBy = membershipHistory.UpdatedBy,
                    CreatedAt = membershipHistory.CreatedAt,
                    UpdatedAt = membershipHistory.UpdatedAt
                });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!MembershipHistoryExists(id))
                {
                    return NotFound();
                }
                _logger.LogError(ex, "Concurrency error updating membership history with ID: {Id}", id);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the membership history" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating membership history with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the membership history" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> DeleteMembershipHistory(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid membership history ID" });
                }

                var membershipHistory = await _context.MembershipHistories
                    .Include(mh => mh.Member)
                    .FirstOrDefaultAsync(mh => mh.Id == id);
                    
                if (membershipHistory == null)
                {
                    return NotFound(new { Error = "Membership history record not found" });
                }

                // Check if this is the oldest record (initial membership date)
                var oldestHistory = await _context.MembershipHistories
                    .Where(mh => mh.MemberId == membershipHistory.MemberId)
                    .OrderBy(mh => mh.UpdateDate)
                    .FirstOrDefaultAsync();

                if (oldestHistory?.Id == id)
                {
                    return BadRequest(new { Error = "Cannot delete the initial membership record. This represents the member's join date and must be preserved." });
                }

                _context.MembershipHistories.Remove(membershipHistory);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Membership history deleted with ID: {HistoryId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting membership history with ID: {Id}", id);
                return StatusCode(500, new { Error = "A database error occurred while deleting the membership history" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting membership history with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the membership history" });
            }
        }

        private bool MembershipHistoryExists(int id)
        {
            return _context.MembershipHistories.Any(e => e.Id == id);
        }

        private Dictionary<string, string> ValidateMembershipHistoryDTO(MembershipHistoryDTO dto)
        {
            var errors = new Dictionary<string, string>();

            if (dto.MemberId <= 0)
                errors.Add("MemberId", "Valid member ID is required");

            if (dto.UpdateDate == default)
                errors.Add("UpdateDate", "Update date is required");

            if (string.IsNullOrWhiteSpace(dto.CardNumber))
                errors.Add("CardNumber", "Card number is required");

            return errors;
        }


        [HttpGet("available-years")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<int>>> GetAvailableYears()
        {
            try
            {
                // Get years from membership histories
                var historyYears = await _context.MembershipHistories
                    .Select(mh => mh.UpdateDate.Year)
                    .Distinct()
                    .ToListAsync();

                // Get years from member join dates
                var membershipYears = await _context.Members
                    .Select(m => m.DateOfMembership.Year)
                    .Distinct()
                    .ToListAsync();

                // Combine and sort both lists
                var allYears = historyYears
                    .Union(membershipYears)
                    .Distinct()
                    .OrderByDescending(year => year)
                    .ToList();

                _logger.LogInformation("Available years retrieved: {Years}", string.Join(", ", allYears));

                return Ok(allYears);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available years");
                return StatusCode(500, new { Error = "An error occurred while retrieving available years" });
            }
        }
        
        [HttpGet("not-updated-this-year")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can get members not updated
        public async Task<ActionResult<IEnumerable<MemberResponseDTO>>> GetMembersNotUpdatedThisYear()
        {
            try
            {
                // Use explicit date range to avoid timezone issues
                var currentYearStart = new DateTime(DateTime.Now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                var currentYearEnd = new DateTime(DateTime.Now.Year, 12, 31, 23, 59, 59, DateTimeKind.Utc);

                var membersNotUpdated = await _context.Members
                    .Where(m => !_context.MembershipHistories
                        .Any(mh => mh.MemberId == m.Id && 
                            mh.UpdateDate >= currentYearStart && 
                            mh.UpdateDate <= currentYearEnd))
                    .Select(m => new MemberResponseDTO
                    {
                        Id = m.Id,
                        Name = m.Name,
                        Lastname = m.Lastname,
                        Cin = m.Cin,
                        Numcard = m.Numcard,
                        Address = m.Address,
                        Nationality = m.Nationality,
                        BirthDate = m.BirthDate,
                        Work = m.Work,
                        Tel = m.Tel,
                        DateOfMembership = m.DateOfMembership,
                        IsVolunteering = m.IsVolunteering,
                        VolunteerField = m.VolunteerField,
                        MemberType = m.MemberType,
                        IsActive = m.IsActive,
                        UpdateDates = _context.MembershipHistories
                            .Where(mh => mh.MemberId == m.Id)
                            .OrderByDescending(mh => mh.UpdateDate)
                            .Select(mh => mh.UpdateDate)
                            .ToList()
                    })
                    .AsNoTracking()
                    .ToListAsync();

                if (!membersNotUpdated.Any())
                {
                    return NotFound(new { Error = "No members found who did not update their membership this year" });
                }

                return Ok(membersNotUpdated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving members not updated this year");
                return StatusCode(500, new { Error = "An error occurred while retrieving members not updated this year" });
            }
        }

        [HttpGet("renewal-stats/{year}")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can get renewal statistics
        public async Task<ActionResult<RenewalStatsDTO>> GetRenewalStats(int year)
        {
            try
            {
                if (year < 1900 || year > DateTime.UtcNow.Year + 1)
                {
                    return BadRequest(new { Error = "Invalid year" });
                }

                var totalMembers = await _context.Members.CountAsync();
                var renewedMembers = await _context.MembershipHistories
                    .Where(mh => mh.UpdateDate.Year == year)
                    .Select(mh => mh.MemberId)
                    .Distinct()
                    .CountAsync();

                var stats = new RenewalStatsDTO
                {
                    Year = year,
                    TotalMembers = totalMembers,
                    RenewedMembers = renewedMembers,
                    NotRenewedMembers = totalMembers - renewedMembers,
                    RenewalRate = totalMembers > 0 ? (double)renewedMembers / totalMembers * 100 : 0
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving renewal stats for year: {Year}", year);
                return StatusCode(500, new { Error = "An error occurred while retrieving renewal statistics" });
            }
        }


    }

    // DTO for renewal statistics
    public class RenewalStatsDTO
    {
        public int Year { get; set; }
        public int TotalMembers { get; set; }
        public int RenewedMembers { get; set; }
        public int NotRenewedMembers { get; set; }
        public double RenewalRate { get; set; }
    }
}