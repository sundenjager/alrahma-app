using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            try
            {
                var normalizedEmail = model.Email.ToUpperInvariant();
                var user = await _userManager.FindByEmailAsync(normalizedEmail);
                
                if (user == null)
                {
                    _logger.LogWarning("Login failed - User not found: {Email}", model.Email);
                    return Unauthorized(new { 
                        Success = false, 
                        Message = "Invalid credentials"
                    });
                }

                if (!user.IsActive)
                {
                    _logger.LogWarning("Login failed - Inactive user: {Email}", model.Email);
                    return Unauthorized(new { 
                        Success = false, 
                        Message = "Account disabled" 
                    });
                }

                var passwordValid = await _userManager.CheckPasswordAsync(user, model.Password);
                
                if (!passwordValid)
                {
                    _logger.LogWarning("Login failed - Invalid password for: {Email}", model.Email);
                    return Unauthorized(new { 
                        Success = false, 
                        Message = "Invalid credentials" 
                    });
                }

                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? user.Role;

                if (string.IsNullOrEmpty(role))
                {
                    _logger.LogError("No role assigned for user: {Email}", model.Email);
                    return StatusCode(500, new { 
                        Success = false, 
                        Message = "User role not configured" 
                    });
                }

                // Generate access token
                var token = GenerateToken(new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, role)
                });

                // Generate refresh token
                var refreshToken = GenerateRefreshToken();
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); // 7 days validity
                user.LastLoginAt = DateTime.UtcNow;
                
                await _userManager.UpdateAsync(user);

                _logger.LogInformation("Successful login for: {Email}", model.Email);
                
                var response = new
                {
                    Success = true,
                    Token = new JwtSecurityTokenHandler().WriteToken(token),
                    RefreshToken = refreshToken,
                    User = new {
                        Id = user.Id,
                        Email = user.Email,
                        Role = role,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        PhoneNumber = user.PhoneNumber,
                        IsActive = user.IsActive,
                        IsApproved = user.IsApproved
                    }
                };
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login error for {Email}", model.Email);
                return StatusCode(500, new { 
                    Success = false, 
                    Message = "Authentication error" 
                });
            }
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous] // CRITICAL: Allow anonymous for refresh
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.RefreshToken))
                {
                    return BadRequest(new { Success = false, Message = "Refresh token is required" });
                }

                // Validate the access token (expired is OK)
                var principal = GetPrincipalFromExpiredToken(model.Token);
                if (principal == null)
                {
                    return Unauthorized(new { Success = false, Message = "Invalid token" });
                }

                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Success = false, Message = "Invalid token claims" });
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { Success = false, Message = "User not found" });
                }

                // Validate refresh token
                if (user.RefreshToken != model.RefreshToken)
                {
                    _logger.LogWarning("Invalid refresh token for user: {Email}", user.Email);
                    return Unauthorized(new { Success = false, Message = "Invalid refresh token" });
                }

                if (user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                {
                    _logger.LogWarning("Expired refresh token for user: {Email}", user.Email);
                    return Unauthorized(new { Success = false, Message = "Refresh token expired" });
                }

                if (!user.IsActive)
                {
                    return Unauthorized(new { Success = false, Message = "Account disabled" });
                }

                // Get current role
                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? user.Role;

                // Generate new tokens
                var newAccessToken = GenerateToken(new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, role)
                });

                var newRefreshToken = GenerateRefreshToken();
                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                
                await _userManager.UpdateAsync(user);

                _logger.LogInformation("Token refreshed successfully for: {Email}", user.Email);

                return Ok(new
                {
                    Success = true,
                    Token = new JwtSecurityTokenHandler().WriteToken(newAccessToken),
                    RefreshToken = newRefreshToken
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token refresh error");
                return StatusCode(500, new { Success = false, Message = "Token refresh failed" });
            }
        }

        [HttpPost("revoke-token")]
        [Authorize]
        public async Task<IActionResult> RevokeToken()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _userManager.UpdateAsync(user);

            return Ok(new { Success = true, Message = "Token revoked successfully" });
        }

        [HttpGet("validate-token")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            return Ok(new { 
                Success = true,
                User = new {
                    Id = userId,
                    Email = userEmail,
                    Role = userRole
                }
            });
        }

        private JwtSecurityToken GenerateToken(IEnumerable<Claim> authClaims)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

            var standardClaims = new List<Claim>();
            foreach (var claim in authClaims)
            {
                if (claim.Type == ClaimTypes.Role)
                {
                    standardClaims.Add(new Claim(ClaimTypes.Role, claim.Value));
                    standardClaims.Add(new Claim("role", claim.Value));
                }
                else if (claim.Type == ClaimTypes.Email)
                {
                    standardClaims.Add(new Claim(ClaimTypes.Email, claim.Value));
                    standardClaims.Add(new Claim("email", claim.Value));
                }
                else if (claim.Type == ClaimTypes.NameIdentifier)
                {
                    standardClaims.Add(new Claim(ClaimTypes.NameIdentifier, claim.Value));
                    standardClaims.Add(new Claim("sub", claim.Value));
                }
                else
                {
                    standardClaims.Add(claim);
                }
            }

            return new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:ExpiryInMinutes"])),
                claims: standardClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            try
            {
                var jwtKey = _configuration["Jwt:Key"];
                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = false, // Don't validate lifetime for refresh
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidAudience = _configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ClockSkew = TimeSpan.Zero
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
                
                if (securityToken is not JwtSecurityToken jwtSecurityToken || 
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    throw new SecurityTokenException("Invalid token");
                }

                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating expired token");
                return null;
            }
        }
    }
}