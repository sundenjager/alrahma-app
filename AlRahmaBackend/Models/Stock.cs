using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class Stock
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("SuppliesSubCategory")]
        public int SuppliesSubCategoryId { get; set; }
        public SuppliesSubCategory SuppliesSubCategory { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalValue { get; set; }

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<StockTransaction> Transactions { get; set; } = new List<StockTransaction>();
    }

    public class StockTransaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Stock")]
        public int StockId { get; set; }
        public Stock Stock { get; set; }

        [Required]
        public int QuantityChange { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ValueChange { get; set; }

        [Required]
        [StringLength(20)]
        public string TransactionType { get; set; }

        [StringLength(100)]
        public string Reference { get; set; }

        public string Description { get; set; }

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [ForeignKey("Supplies")]
        public int? SuppliesId { get; set; }
        public Supplies Supplies { get; set; }

        [ForeignKey("Aid")]
        public int? AidId { get; set; }
        public Aid Aid { get; set; }

        // Add missing properties
        public string? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}