using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public DateTime Expiration { get; set; }
        public UserProfileDto User { get; set; }
    }
}
