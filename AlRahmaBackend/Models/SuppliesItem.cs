using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class SuppliesItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [ForeignKey("SuppliesSubCategoryId")]
        public int SuppliesSubCategoryId { get; set; }
        public SuppliesSubCategory SuppliesSubCategory { get; set; }

        [ForeignKey("SuppliesId")]
        public int SuppliesId { get; set; }
        public Supplies Supplies { get; set; }

        // Add audit properties
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        [NotMapped]
        public decimal TotalValue => Quantity * (SuppliesSubCategory?.UnitPrice ?? 0);
    }
}