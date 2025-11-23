using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;

namespace AlRahmaBackend.Models
{
    public class Aid
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Reference { get; set; }

        [Required]
        [StringLength(100)]
        public string Usage { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Date)]
        public DateTime DateOfAid { get; set; }

        public string Description { get; set; }

        [StringLength(255)]
        public string LegalFilePath { get; set; }

        [Required]
        [StringLength(50)]
        public string AidType { get; set; } = "نقدي";

        // Foreign key to OngoingProject (nullable)
        public int? OngoingProjectId { get; set; } // ← ADD THIS

        // Navigation property to OngoingProject
        [ForeignKey("OngoingProjectId")]
        public virtual OngoingProject OngoingProject { get; set; } // ← ADD THIS

        // Store MonetaryValue in the database
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MonetaryValue { get; set; }

        public ICollection<AidItem> Items { get; set; } = new List<AidItem>();

        [NotMapped]
        public IFormFile LegalFile { get; set; }
    }
}