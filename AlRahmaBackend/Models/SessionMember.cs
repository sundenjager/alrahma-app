using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models   
{
    public class SessionMember
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        public string MemberName { get; set; }

        [Required]
        public string MemberRole { get; set; } // e.g., "Chair", "Secretary", "Member"

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("SessionId")]
        public virtual Session Session { get; set; }
    }
}