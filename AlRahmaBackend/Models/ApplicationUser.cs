using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace AlRahmaBackend.Models
{
    public class ApplicationUser : IdentityUser
    {
        [StringLength(100)]
        public string FirstName { get; set; }

        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(20)]
        public override string PhoneNumber { get; set; }

        public string Role { get; set; } = "User";

        public bool IsActive { get; set; } = true;

        public bool IsApproved { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Refresh Token properties
        public string RefreshToken { get; set; }
        
        public DateTime? RefreshTokenExpiryTime { get; set; }

        [NotMapped]
        public string Token { get; set; }
    }
}