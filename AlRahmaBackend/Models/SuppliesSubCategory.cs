using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class SuppliesSubCategory 
    {
        [Key]
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Subcategory name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; }
        
        [Required(ErrorMessage = "Unit price is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Unit price must be positive")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
        
        [Required(ErrorMessage = "Category is required")]
        [ForeignKey("SuppliesCategoryId")]
        public int SuppliesCategoryId { get; set; }
        public SuppliesCategory SuppliesCategory { get; set; }
        
        // Add audit properties
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<SuppliesItem> SuppliesItems { get; set; } = new List<SuppliesItem>();
        public ICollection<Stock> Stocks { get; set; } = new List<Stock>();
    }
}