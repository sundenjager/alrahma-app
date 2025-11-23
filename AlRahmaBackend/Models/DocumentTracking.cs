using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class DocumentTracking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        [ForeignKey("SessionId")]
        public virtual Session Session { get; set; } // This should reference the Session

        [Required]
        [StringLength(50)]
        public string DocumentType { get; set; }

        [Required]
        [StringLength(20)]
        public string ActionType { get; set; }

        [Required]
        public string ProofFilePath { get; set; }

        [Required]
        public DateTime ActionDate { get; set; } = DateTime.UtcNow;
    }
}