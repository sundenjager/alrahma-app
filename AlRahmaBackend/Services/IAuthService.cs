using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public interface IAuthService
    {
        Task<AuthResult> LoginAsync(LoginDto model);
        Task<AuthResult> RegisterAsync(RegisterDto model);
        Task<UserProfileDto> GetCurrentUserAsync();
        Task<bool> LogoutAsync();
    }

    public class AuthResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string Token { get; set; }
        public UserProfileDto User { get; set; }
    }
} 