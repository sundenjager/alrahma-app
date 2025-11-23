using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.Models
{
    public class ActImm
    {
        [Key]
        public int Id { get; set; }

        // Foreign Key for Category
        [ForeignKey("Category")]
        public int CategoryId { get; set; }

        // Navigation Property
        public ActImmCategory Category { get; set; }

        [Required]
        [StringLength(100)]
        public string Brand { get; set; }

        [Required]
        [StringLength(50)]
        public string Number { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal MonetaryValue { get; set; } = 0;

        [Required]
        [StringLength(200)]
        public string UsageLocation { get; set; }

        [Required]
        [StringLength(100)]
        public string Source { get; set; }

        [Required]
        [StringLength(20)]
        public string SourceNature { get; set; } // "شراء" or "تبرع"

        
        public DateTime? DateOfDeployment { get; set; }

        public DateTime? DateOfEnd { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "صالح"; // "صالح", "معطب", "تم إتلافه"

        [StringLength(255)]
        public string? LegalFilePath { get; set; }

        [NotMapped]
        public IFormFile? LegalFile { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class ActImmCategory
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
