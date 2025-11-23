using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.Models
{
    public class Supplies
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Reference { get; set; }

        [Required]
        [StringLength(100)]
        public string Source { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Usage { get; set; } = string.Empty;

        [Required]
        [DataType(DataType.Date)]
        public DateTime DateOfEntry { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DateOfExit { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "صالح";

        public string Description { get; set; }

        [StringLength(255)]
        public string LegalFilePath { get; set; }

        [Required]
        [StringLength(50)]
        public string SuppliesType { get; set; } = "نقدي";

        [Required]
        [StringLength(50)]
        public string SuppliesScope { get; set; } = "عمومي";

        [Required]
        [StringLength(50)]
        public string SuppliesNature { get; set; } = "Donation";

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MonetaryValue { get; set; }

        public int? OngoingProjectId { get; set; }

        [ForeignKey("OngoingProjectId")]
        public virtual OngoingProject OngoingProject { get; set; }

        // Add audit properties
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<SuppliesItem> Items { get; set; } = new List<SuppliesItem>();

        [NotMapped]
        public IFormFile LegalFile { get; set; }
    }
}