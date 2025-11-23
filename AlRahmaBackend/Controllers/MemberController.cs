using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class MembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MembersController> _logger;

        public MembersController(ApplicationDbContext context, ILogger<MembersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Members
        [HttpGet]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<MemberResponseDTO>>> GetMembers()
        {
            try
            {
                var members = await _context.Members
                    .Include(m => m.MembershipHistories)
                    .AsNoTracking()
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
                        // ✅ FIXED: Ensure UpdateDates are properly sorted and included
                        UpdateDates = m.MembershipHistories
                            .OrderBy(mh => mh.UpdateDate)
                            .Select(mh => mh.UpdateDate)
                            .ToList()
                    })
                    .ToListAsync();

                // ✅ Add logging to verify data
                _logger.LogInformation("Retrieved {Count} members with membership histories", members.Count);
                
                // Log a sample member if available
                if (members.Any())
                {
                    var sample = members.First();
                    _logger.LogInformation("Sample member: {Name} has {UpdateCount} update dates", 
                        sample.Name, 
                        sample.UpdateDates?.Count ?? 0);
                }

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all members");
                return StatusCode(500, new { Error = "An error occurred while retrieving members" });
            }
        }

        // GET: api/Members/5
        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<MemberResponseDTO>> GetMember(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid member ID" });
                }

                var member = await _context.Members
                    .Include(m => m.MembershipHistories)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (member == null)
                {
                    return NotFound(new { Error = "Member not found" });
                }

                var response = new MemberResponseDTO
                {
                    Id = member.Id,
                    Name = member.Name,
                    Lastname = member.Lastname,
                    Cin = member.Cin,
                    Numcard = member.Numcard,
                    Address = member.Address,
                    Nationality = member.Nationality,
                    BirthDate = member.BirthDate,
                    Work = member.Work,
                    Tel = member.Tel,
                    DateOfMembership = member.DateOfMembership,
                    IsVolunteering = member.IsVolunteering,
                    VolunteerField = member.VolunteerField,
                    MemberType = member.MemberType,
                    IsActive = member.IsActive,
                    UpdateDates = member.MembershipHistories
                        .Select(mh => mh.UpdateDate)
                        .ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving member with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while retrieving the member" });
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can create
        public async Task<ActionResult<MemberResponseDTO>> PostMember(MemberDTO memberDTO)
        {
            try
            {
                // Validate input
                var errors = ValidateMemberDTO(memberDTO);
                if (errors.Any())
                {
                    return BadRequest(new { Errors = errors });
                }

                // Check if CIN is unique
                bool isCINUnique = !await _context.Members.AnyAsync(m => m.Cin == memberDTO.Cin);
                if (!isCINUnique)
                {
                    return BadRequest(new { Error = "رقم بطاقة التعريف مستخدم مسبقًا." });
                }

                var member = new Member
                {
                    Name = memberDTO.Name?.Trim(),
                    Lastname = memberDTO.Lastname?.Trim(),
                    Cin = memberDTO.Cin?.Trim(),
                    Numcard = memberDTO.Numcard?.Trim(),
                    Address = memberDTO.Address?.Trim(),
                    Nationality = memberDTO.Nationality?.Trim(),
                    BirthDate = memberDTO.BirthDate,
                    Work = memberDTO.Work?.Trim(),
                    Tel = memberDTO.Tel?.Trim(),
                    DateOfMembership = memberDTO.DateOfMembership,
                    IsVolunteering = memberDTO.IsVolunteering,
                    VolunteerField = memberDTO.VolunteerField?.Trim(),
                    MemberType = memberDTO.MemberType?.Trim(),
                    IsActive = memberDTO.IsActive,
                    CreatedBy = User.Identity?.Name,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Members.Add(member);
                await _context.SaveChangesAsync();

                var membershipHistory = new MembershipHistory
                {
                    MemberId = member.Id,
                    UpdateDate = member.DateOfMembership,
                    CardNumber = member.Numcard,
                    UpdatedBy = User.Identity?.Name
                };

                _context.MembershipHistories.Add(membershipHistory);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member created with ID: {MemberId} by user: {UserId}", 
                    member.Id, User.Identity?.Name);

                return CreatedAtAction("GetMember", new { id = member.Id }, new MemberResponseDTO
                {
                    Id = member.Id,
                    Name = member.Name,
                    Lastname = member.Lastname,
                    Cin = member.Cin,
                    Numcard = member.Numcard,
                    Address = member.Address,
                    Nationality = member.Nationality,
                    BirthDate = member.BirthDate,
                    Work = member.Work,
                    Tel = member.Tel,
                    DateOfMembership = member.DateOfMembership,
                    IsVolunteering = member.IsVolunteering,
                    VolunteerField = member.VolunteerField,
                    MemberType = member.MemberType,
                    IsActive = member.IsActive
                });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating member");
                return StatusCode(500, new { Error = "A database error occurred while creating the member" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating member");
                return StatusCode(500, new { Error = "An unexpected error occurred" });
            }
        }
            
        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can update
        public async Task<ActionResult<MemberResponseDTO>> PutMember(int id, MemberDTO memberDTO)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid member ID" });
                }

                // Validate input
                var errors = ValidateMemberDTO(memberDTO);
                if (errors.Any())
                {
                    return BadRequest(new { Errors = errors });
                }

                var member = await _context.Members.FindAsync(id);
                if (member == null)
                {
                    return NotFound(new { Error = "Member not found" });
                }

                // Check if the new CIN is unique (excluding the current member)
                bool isCINUnique = !await _context.Members.AnyAsync(m => m.Cin == memberDTO.Cin && m.Id != id);
                if (!isCINUnique)
                {
                    return BadRequest(new { Error = "رقم بطاقة التعريف مستخدم مسبقًا." });
                }

                // Update the member properties
                member.Name = memberDTO.Name?.Trim();
                member.Lastname = memberDTO.Lastname?.Trim();
                member.Cin = memberDTO.Cin?.Trim();
                member.Numcard = memberDTO.Numcard?.Trim();
                member.Address = memberDTO.Address?.Trim();
                member.Nationality = memberDTO.Nationality?.Trim();
                member.BirthDate = memberDTO.BirthDate;
                member.Work = memberDTO.Work?.Trim();
                member.Tel = memberDTO.Tel?.Trim();
                member.DateOfMembership = memberDTO.DateOfMembership;
                member.IsVolunteering = memberDTO.IsVolunteering;
                member.VolunteerField = memberDTO.VolunteerField?.Trim();
                member.MemberType = memberDTO.MemberType?.Trim();
                member.IsActive = memberDTO.IsActive;
                member.UpdatedBy = User.Identity?.Name;
                member.UpdatedAt = DateTime.UtcNow;

                _context.Entry(member).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member updated with ID: {MemberId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return Ok(new MemberResponseDTO
                {
                    Id = member.Id,
                    Name = member.Name,
                    Lastname = member.Lastname,
                    Cin = member.Cin,
                    Numcard = member.Numcard,
                    Address = member.Address,
                    Nationality = member.Nationality,
                    BirthDate = member.BirthDate,
                    Work = member.Work,
                    Tel = member.Tel,
                    DateOfMembership = member.DateOfMembership,
                    IsVolunteering = member.IsVolunteering,
                    VolunteerField = member.VolunteerField,
                    MemberType = member.MemberType,
                    IsActive = member.IsActive
                });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!MemberExists(id))
                {
                    return NotFound();
                }
                _logger.LogError(ex, "Concurrency error updating member with ID: {Id}", id);
                return StatusCode(500, new { Error = "A concurrency error occurred while updating the member" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating member with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while updating the member" });
            }
        }

        // DELETE: api/Members/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete
        public async Task<IActionResult> DeleteMember(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid member ID" });
                }

                var member = await _context.Members.FindAsync(id);
                if (member == null)
                {
                    return NotFound(new { Error = "Member not found" });
                }

                var histories = await _context.MembershipHistories
                    .Where(mh => mh.MemberId == id)
                    .ToListAsync();
                
                _context.MembershipHistories.RemoveRange(histories);
                _context.Members.Remove(member);
                
                await _context.SaveChangesAsync();

                _logger.LogInformation("Member deleted with ID: {MemberId} by user: {UserId}", 
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting member with ID: {Id}", id);
                return StatusCode(500, new { Error = "A database error occurred while deleting the member" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting member with ID: {Id}", id);
                return StatusCode(500, new { Error = "An error occurred while deleting the member" });
            }
        }

        [HttpGet("check-cin-unique")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can check CIN
        public async Task<ActionResult<bool>> IsCINUnique([FromQuery] string cin)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(cin))
                {
                    return BadRequest(new { Error = "CIN is required" });
                }

                bool isUnique = !await _context.Members.AnyAsync(m => m.Cin == cin.Trim());
                return Ok(isUnique);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking CIN uniqueness");
                return StatusCode(500, new { Error = "An error occurred while checking CIN uniqueness" });
            }
        }

        [HttpGet("by-membership-year")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can filter by year
        public async Task<ActionResult<IEnumerable<MemberResponseDTO>>> GetMembersByMembershipYear([FromQuery] int year)
        {
            try 
            {
                if (year < 1900 || year > DateTime.UtcNow.Year + 1)
                {
                    return BadRequest(new { Error = "Invalid year" });
                }

                var memberIdsWithUpdates = await _context.MembershipHistories
                    .Where(mh => mh.UpdateDate.Year == year)
                    .Select(mh => mh.MemberId)
                    .Distinct()
                    .ToListAsync();

                var members = await _context.Members
                    .Include(m => m.MembershipHistories)
                    .Where(m => m.DateOfMembership.Year == year || 
                            memberIdsWithUpdates.Contains(m.Id))
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
                        UpdateDates = m.MembershipHistories
                            .Where(mh => mh.UpdateDate.Year == year)
                            .Select(mh => mh.UpdateDate)
                            .ToList()
                    })
                    .AsNoTracking()
                    .ToListAsync();

                if (!members.Any())
                {
                    return NotFound(new { Error = $"No members found for year {year}" });
                }

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving members by membership year: {Year}", year);
                return StatusCode(500, new { Error = "An error occurred while retrieving members" });
            }
        }

        [HttpGet("available-years")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can get available years
        public async Task<ActionResult<IEnumerable<int>>> GetAvailableYears()
        {
            try
            {
                var years = await _context.MembershipHistories
                    .Select(mh => mh.UpdateDate.Year)
                    .Distinct()
                    .OrderByDescending(year => year)
                    .ToListAsync();

                return Ok(years);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving available years");
                return StatusCode(500, new { Error = "An error occurred while retrieving available years" });
            }
        }

        [HttpGet("active-previous-year")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can get previous year members
        public async Task<ActionResult<IEnumerable<MemberResponseDTO>>> GetActivePreviousYearMembers()
        {
            try
            {
                int previousYear = DateTime.Now.Year - 1;
                
                var members = await _context.Members
                    .Include(m => m.MembershipHistories)
                    .Where(m => 
                        m.DateOfMembership.Year == previousYear || 
                        m.MembershipHistories.Any(mh => mh.UpdateDate.Year == previousYear)
                    )
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
                        Status = m.DateOfMembership.Year == previousYear ? "New" : "Renewed",
                        EligibilityYear = previousYear,
                        LastUpdateDate = m.MembershipHistories
                            .OrderByDescending(mh => mh.UpdateDate)
                            .Select(mh => (DateTime?)mh.UpdateDate)
                            .FirstOrDefault(),
                        UpdateDates = m.MembershipHistories
                            .OrderByDescending(mh => mh.UpdateDate)
                            .Select(mh => mh.UpdateDate)
                            .ToList()
                    })
                    .OrderBy(m => m.Name)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active previous year members");
                return StatusCode(500, new { Error = "An error occurred while retrieving members" });
            }
        }

        [HttpGet("by-membership-type")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<IEnumerable<MemberResponseDTO>>> GetMembersByMembershipType(
            [FromQuery] int year,
            [FromQuery] string type = "all") // "all", "joined", "renewed"
        {
            try 
            {
                if (year < 1900 || year > DateTime.UtcNow.Year + 1)
                {
                    return BadRequest(new { Error = "Invalid year" });
                }

                IQueryable<Member> query = _context.Members.Include(m => m.MembershipHistories);

                // Filter based on membership type
                switch (type.ToLower())
                {
                    case "joined":
                        query = query.Where(m => m.DateOfMembership.Year == year);
                        break;
                    case "renewed":
                        var renewedMemberIds = await _context.MembershipHistories
                            .Where(mh => mh.UpdateDate.Year == year)
                            .Select(mh => mh.MemberId)
                            .Distinct()
                            .ToListAsync();
                        query = query.Where(m => renewedMemberIds.Contains(m.Id));
                        break;
                    case "all":
                    default:
                        var activeMemberIds = await _context.MembershipHistories
                            .Where(mh => mh.UpdateDate.Year == year)
                            .Select(mh => mh.MemberId)
                            .Distinct()
                            .ToListAsync();
                        query = query.Where(m => 
                            m.DateOfMembership.Year == year || 
                            activeMemberIds.Contains(m.Id));
                        break;
                }

                var members = await query
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
                        UpdateDates = m.MembershipHistories
                            .Where(mh => mh.UpdateDate.Year == year)
                            .Select(mh => mh.UpdateDate)
                            .ToList()
                    })
                    .AsNoTracking()
                    .ToListAsync();

                if (!members.Any())
                {
                    return NotFound(new { Error = $"No members found for {type} in year {year}" });
                }

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving members by membership type: {Type} for year: {Year}", type, year);
                return StatusCode(500, new { Error = "An error occurred while retrieving members" });
            }
        }
        
        [HttpGet("by-committee-and-year")]
        [Authorize(Policy = "RequireUserRole")] // Authenticated users can filter by committee and year
        public async Task<ActionResult<IEnumerable<MemberResponseDTO>>> GetMembersByCommitteeAndYear(
            [FromQuery] string volunteerField, 
            [FromQuery] int? year = null)
        {
            try 
            {
                if (string.IsNullOrWhiteSpace(volunteerField))
                {
                    return BadRequest(new { Error = "Volunteer field is required" });
                }

                int previousYear = DateTime.Now.Year - 1;
                year ??= previousYear;

                if (year < 1900 || year > DateTime.UtcNow.Year + 1)
                {
                    return BadRequest(new { Error = "Invalid year" });
                }

                var members = await _context.Members
                    .Include(m => m.MembershipHistories)
                    .Where(m => 
                        m.VolunteerField != null &&
                        m.VolunteerField.Trim().ToLower() == volunteerField.Trim().ToLower() &&
                        m.IsVolunteering == true &&
                        (m.DateOfMembership.Year == year || 
                         m.MembershipHistories.Any(mh => mh.UpdateDate.Year == year)))
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
                        UpdateDates = m.MembershipHistories
                            .Select(mh => mh.UpdateDate)
                            .ToList()
                    })
                    .OrderBy(m => m.Name)
                    .ThenBy(m => m.Lastname)
                    .AsNoTracking()
                    .ToListAsync();

                if (!members.Any())
                {
                    return NotFound(new { Error = $"No volunteering members found for '{volunteerField}' in {year}" });
                }

                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving members by committee and year");
                return StatusCode(500, new { Error = "An error occurred while retrieving members" });
            }
        }

        private bool MemberExists(int id)
        {
            return _context.Members.Any(e => e.Id == id);
        }

        private Dictionary<string, string> ValidateMemberDTO(MemberDTO memberDTO)
        {
            var errors = new Dictionary<string, string>();

            if (string.IsNullOrWhiteSpace(memberDTO.Name))
                errors.Add("Name", "Name is required");

            if (string.IsNullOrWhiteSpace(memberDTO.Lastname))
                errors.Add("Lastname", "Lastname is required");

            if (string.IsNullOrWhiteSpace(memberDTO.Cin))
                errors.Add("Cin", "CIN is required");

            if (memberDTO.BirthDate > DateTime.UtcNow)
                errors.Add("BirthDate", "Birth date cannot be in the future");

            if (memberDTO.DateOfMembership > DateTime.UtcNow)
                errors.Add("DateOfMembership", "Membership date cannot be in the future");

            return errors;
        }
    }
}