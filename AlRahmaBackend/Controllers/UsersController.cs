using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace AlRahmaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<UsersController> _logger;

        public UsersController(
            UserManager<ApplicationUser> userManager, 
            RoleManager<IdentityRole> roleManager,
            ILogger<UsersController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        // GET: api/users
        [HttpGet]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can view all users
        public async Task<ActionResult<IEnumerable<UserProfileDto>>> GetUsers()
        {
            try
            {
                _logger.LogInformation("Fetching all users by admin user {UserId}", User.Identity?.Name);

                var users = await _userManager.Users
                    .Select(u => new UserProfileDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        UserName = u.UserName,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        PhoneNumber = u.PhoneNumber,
                        Role = u.Role,
                        IsActive = u.IsActive,
                        IsApproved = u.IsApproved,
                        EmailConfirmed = u.EmailConfirmed,
                        CreatedAt = u.CreatedAt,
                        LastLoginAt = u.LastLoginAt
                    })
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users by admin user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving users" });
            }
        }
        // GET: api/users/{id}
        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // Users can view their own profile, admins can view any
        public async Task<ActionResult<UserProfileDto>> GetUser(string id)
        {
            try
            {
                // Users can only view their own profile unless they are SuperAdmins
                var currentUser = await _userManager.GetUserAsync(User);
                var isAdmin = await _userManager.IsInRoleAsync(currentUser, "Admin") || 
                             await _userManager.IsInRoleAsync(currentUser, "SuperAdmin");

                if (!isAdmin && currentUser.Id != id)
                {
                    _logger.LogWarning("User {CurrentUserId} attempted to access profile of user {TargetUserId} without permission", 
                        currentUser.Id, id);
                    return Forbid();
                }

                _logger.LogInformation("Fetching user profile for ID {UserId} by user {CurrentUserId}", id, User.Identity?.Name);

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found, requested by user {CurrentUserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "User not found" });
                }

                var userDto = new UserProfileDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    UserName = user.UserName,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    IsApproved = user.IsApproved,
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user profile for ID {UserId} by user {CurrentUserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving the user profile" });
            }
        }

        // GET: api/users/me
        [HttpGet("me")]
        [Authorize(Policy = "RequireUserRole")]
        public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return NotFound(new { Error = "User not found" });
                }

                var userDto = new UserProfileDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    UserName = user.UserName,
                    FirstName = user.FirstName,        
                    LastName = user.LastName,          
                    PhoneNumber = user.PhoneNumber,    
                    Role = user.Role,                  
                    IsActive = user.IsActive,          
                    IsApproved = user.IsApproved,      
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching current user profile for user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving your profile" });
            }
        }

        

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto updateDto)
        {
            try
            {
                _logger.LogInformation("Updating user with ID {UserId} by admin user {AdminUserId}", id, User.Identity?.Name);

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found for update by admin user {AdminUserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "User not found" });
                }

                // Prevent admins from modifying their own role/status through this endpoint
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser.Id == id)
                {
                    return BadRequest(new { Error = "Admins cannot modify their own account through this endpoint. Use profile update instead." });
                }

                // Update user properties
                user.FirstName = updateDto.FirstName.Trim();
                user.LastName = updateDto.LastName.Trim();
                user.PhoneNumber = updateDto.PhoneNumber?.Trim();
                user.IsActive = updateDto.IsActive;
                user.IsApproved = updateDto.IsApproved;
                user.UpdatedAt = DateTime.UtcNow;

                // Handle role change if needed
                if (!string.IsNullOrEmpty(updateDto.Role) && user.Role != updateDto.Role)
                {
                    // Validate role exists
                    if (!await _roleManager.RoleExistsAsync(updateDto.Role))
                    {
                        return BadRequest(new { Error = "Invalid role specified" });
                    }

                    // Remove from current role
                    if (!string.IsNullOrEmpty(user.Role))
                    {
                        await _userManager.RemoveFromRoleAsync(user, user.Role);
                    }

                    // Add to new role
                    user.Role = updateDto.Role;
                    await _userManager.AddToRoleAsync(user, user.Role);
                }

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    _logger.LogWarning("User update failed for {UserId}: {Errors}", id, string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }

                _logger.LogInformation("User with ID {UserId} updated successfully by admin user {AdminUserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user with ID {UserId} by admin user {AdminUserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while updating the user" });
            }
        }

        [HttpPost("register-with-email")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<ActionResult<UserProfileDto>> RegisterWithEmail([FromBody] RegisterUserWithEmailDto registerDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { Error = "User with this email already exists" });
                }

                // Generate password if not provided
                var password = registerDto.Password;
                if (string.IsNullOrEmpty(password))
                {
                    password = GenerateRandomPassword();
                }

                var user = new ApplicationUser
                {
                    UserName = registerDto.Email,
                    Email = registerDto.Email,
                    FirstName = registerDto.FirstName.Trim(),
                    LastName = registerDto.LastName.Trim(),
                    PhoneNumber = registerDto.PhoneNumber?.Trim(),
                    Role = registerDto.Role ?? "User",
                    IsActive = true,
                    IsApproved = registerDto.Role == "User", // Auto-approve regular users
                    CreatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, password);

                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    _logger.LogWarning("User registration failed for {Email}: {Errors}", registerDto.Email, string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }

                // Add user to role
                if (!string.IsNullOrEmpty(user.Role))
                {
                    if (!await _roleManager.RoleExistsAsync(user.Role))
                    {
                        await _roleManager.CreateAsync(new IdentityRole(user.Role));
                    }
                    await _userManager.AddToRoleAsync(user, user.Role);
                }

                // Send email if requested
                if (registerDto.SendEmail)
                {
                    await SendLoginCredentialsEmail(user, password);
                }

                var userDto = new UserProfileDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    UserName = user.UserName,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    IsApproved = user.IsApproved,
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedAt = user.CreatedAt
                };

                _logger.LogInformation("User registered successfully with ID {UserId} and role {Role}", user.Id, user.Role);

                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration for email {Email}", registerDto.Email);
                return StatusCode(500, new { Error = "An error occurred during registration" });
            }
        }

        private string GenerateRandomPassword()
        {
            const string lowercase = "abcdefghijklmnopqrstuvwxyz";
            const string uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string numbers = "0123456789";
            const string special = "!@#$%^&*";
            const string allChars = lowercase + uppercase + numbers + special;

            var random = new Random();
            var password = new char[12];

            // Ensure at least one of each type
            password[0] = lowercase[random.Next(lowercase.Length)];
            password[1] = uppercase[random.Next(uppercase.Length)];
            password[2] = numbers[random.Next(numbers.Length)];
            password[3] = special[random.Next(special.Length)];

            // Fill the rest
            for (int i = 4; i < 12; i++)
            {
                password[i] = allChars[random.Next(allChars.Length)];
            }

            // Shuffle
            return new string(password.OrderBy(x => random.Next()).ToArray());
        }

        private async Task SendLoginCredentialsEmail(ApplicationUser user, string password)
        {
            try
            {
                // TODO: Implement your email service here
                // This is a placeholder - implement with your preferred email service
                
                var subject = "Your Account Credentials";
                var body = $@"
                    <h3>Welcome to Our System</h3>
                    <p>Dear {user.FirstName} {user.LastName},</p>
                    <p>Your account has been created successfully.</p>
                    <p><strong>Login Details:</strong></p>
                    <ul>
                        <li><strong>Email:</strong> {user.Email}</li>
                        <li><strong>Password:</strong> {password}</li>
                    </ul>
                    <p>Please login and change your password after first login.</p>
                    <p>Best regards,<br/>System Administrator</p>";

                // Example with SMTP (you'll need to configure your email settings)
                // await _emailService.SendEmailAsync(user.Email, subject, body);
                
                _logger.LogInformation("Login credentials email prepared for {Email}", user.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", user.Email);
                // Don't throw - email failure shouldn't prevent user creation
            }
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        [Authorize(Policy = "RequireSuperAdminRole")] // Only SuperAdmin can delete users
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                _logger.LogInformation("Deleting user with ID {UserId} by super admin user {AdminUserId}", id, User.Identity?.Name);

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found for deletion by super admin user {AdminUserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "User not found" });
                }

                // Prevent self-deletion
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser.Id == id)
                {
                    return BadRequest(new { Error = "You cannot delete your own account" });
                }

                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    _logger.LogWarning("User deletion failed for {UserId}: {Errors}", id, string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }

                _logger.LogInformation("User with ID {UserId} deleted successfully by super admin user {AdminUserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user with ID {UserId} by super admin user {AdminUserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deleting the user" });
            }
        }

        // PATCH: api/users/{id}/approve
        [HttpPatch("{id}/approve")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can approve users
        public async Task<IActionResult> ApproveUser(string id)
        {
            try
            {
                _logger.LogInformation("Approving user with ID {UserId} by admin user {AdminUserId}", id, User.Identity?.Name);

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found for approval by admin user {AdminUserId}", id, User.Identity?.Name);
                    return NotFound(new { Error = "User not found" });
                }

                user.IsApproved = true;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    return BadRequest(new { Errors = errors });
                }

                _logger.LogInformation("User with ID {UserId} approved successfully by admin user {AdminUserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving user with ID {UserId} by admin user {AdminUserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while approving the user" });
            }
        }

        [HttpPatch("{id}/profile")]
        [Authorize(Policy = "RequireUserRole")] // Users can update their own profile
        public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateProfileDto updateDto)
        {
            try
            {
                // Users can only update their own profile
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser.Id != id)
                {
                    _logger.LogWarning("User {CurrentUserId} attempted to update profile of user {TargetUserId} without permission", 
                        currentUser.Id, id);
                    return Forbid();
                }

                _logger.LogInformation("Updating profile for user ID {UserId}", id);

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { Error = "User not found" });
                }

                // Store the current values before updating (CRITICAL)
                var currentIsActive = user.IsActive;
                var currentIsApproved = user.IsApproved;
                var currentRole = user.Role;

                // Update only allowed fields for profile updates
                user.FirstName = updateDto.FirstName.Trim();
                user.LastName = updateDto.LastName.Trim();
                user.PhoneNumber = updateDto.PhoneNumber?.Trim();
                user.UpdatedAt = DateTime.UtcNow;

                // RESTORE THE CRITICAL PROPERTIES THAT SHOULD NOT CHANGE
                user.IsActive = currentIsActive;
                user.IsApproved = currentIsApproved;
                user.Role = currentRole;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    _logger.LogWarning("Profile update failed for user {UserId}: {Errors}", id, string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }

                _logger.LogInformation("Profile updated successfully for user ID {UserId}", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating profile for user ID {UserId}", id);
                return StatusCode(500, new { Error = "An error occurred while updating your profile" });
            }
        }

        [HttpPut("{id}/password")]
        [Authorize(Policy = "RequireUserRole")] // Users can update their own password
        public async Task<IActionResult> UpdatePassword(string id, [FromBody] UpdatePasswordDto updateDto)
        {
            try
            {
                // Users can only update their own password
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser.Id != id)
                {
                    _logger.LogWarning("User {CurrentUserId} attempted to update password of user {TargetUserId} without permission", 
                        currentUser.Id, id);
                    return Forbid();
                }

                _logger.LogInformation("Password update requested for user: {UserId}", id);
                
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found for password update", id);
                    return NotFound(new { Error = "User not found" });
                }

                // Verify current password
                var passwordValid = await _userManager.CheckPasswordAsync(user, updateDto.CurrentPassword);
                
                if (!passwordValid)
                {
                    _logger.LogWarning("Invalid current password provided for user {UserId}", id);
                    return BadRequest(new { Error = "Current password is incorrect" });
                }

                // Change password
                var result = await _userManager.ChangePasswordAsync(user, updateDto.CurrentPassword, updateDto.NewPassword);
                
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    _logger.LogWarning("Password change failed for user {UserId}: {Errors}", id, string.Join(", ", errors));
                    return BadRequest(new { Errors = errors });
                }

                _logger.LogInformation("Password updated successfully for user ID {UserId}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating password for user ID {UserId}", id);
                return StatusCode(500, new { Error = "An error occurred while updating your password" });
            }
        }

        // PATCH: api/users/{id}/deactivate
        [HttpPatch("{id}/deactivate")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can deactivate users
        public async Task<IActionResult> DeactivateUser(string id)
        {
            try
            {
                _logger.LogInformation("Deactivating user with ID {UserId} by admin user {AdminUserId}", id, User.Identity?.Name);

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { Error = "User not found" });
                }

                // Prevent self-deactivation
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser.Id == id)
                {
                    return BadRequest(new { Error = "You cannot deactivate your own account" });
                }

                user.IsActive = false;
                user.UpdatedAt = DateTime.UtcNow;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.Select(e => e.Description);
                    return BadRequest(new { Errors = errors });
                }

                _logger.LogInformation("User with ID {UserId} deactivated successfully by admin user {AdminUserId}", id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating user with ID {UserId} by admin user {AdminUserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while deactivating the user" });
            }
        }
    }

    // DTO for password update
    public class UpdatePasswordDto
    {
        [Required(ErrorMessage = "Current password is required")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string NewPassword { get; set; } = string.Empty;
    }

    // DTOs for user operations
    public class RegisterUserDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        public string LastName { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Role { get; set; } = "User";

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserDto
    {
        [Required(ErrorMessage = "First name is required")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        public string LastName { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public bool IsApproved { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "First name is required")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        public string LastName { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;
    }
}