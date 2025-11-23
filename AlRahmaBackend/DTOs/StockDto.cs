using System;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{
    public class StockDto
    {
        public int Id { get; set; }
        public int SuppliesSubCategoryId { get; set; }
        public string SubCategoryName { get; set; }
        public string CategoryName { get; set; }
        public int Quantity { get; set; }
        public decimal TotalValue { get; set; }
        public DateTime LastUpdated { get; set; }
        public string Status { get; set; } // "Available", "Low", "OutOfStock"
    }

    public class StockTransactionDto
    {
        public int Id { get; set; }
        public int StockId { get; set; }
        public int QuantityChange { get; set; }
        public decimal ValueChange { get; set; }
        public string TransactionType { get; set; }
        public string Reference { get; set; }
        public string Description { get; set; }
        public DateTime TransactionDate { get; set; }
        public int? SuppliesId { get; set; }
        public string SuppliesReference { get; set; }
        
        // Add missing property
        public string CreatedBy { get; set; }
    }

    public class StockSummaryDto
    {
        public int TotalItems { get; set; }
        public decimal TotalValue { get; set; }
        public int TotalCategories { get; set; }
        public int TotalSubCategories { get; set; }
        public int LowStockItems { get; set; }
        public int OutOfStockItems { get; set; }
        
        // Add missing property
        public int AvailableItems { get; set; }
    }

    public class StockUpdateDto
    {
        [Required]
        public int SuppliesSubCategoryId { get; set; }
        
        [Required]
        public int QuantityChange { get; set; }
        
        [StringLength(100)]
        public string Reference { get; set; }
        
        public string Description { get; set; }
        
        [Required]
        [StringLength(20)]
        public string TransactionType { get; set; }
        
        public int? SuppliesId { get; set; }
    }

    public class StockFilterDto
    {
        public int? CategoryId { get; set; } = null;
        public int? SubCategoryId { get; set; } = null;
        public string Status { get; set; } = "all";
        public string SearchTerm { get; set; } = "";
    }

    // DTO for stock adjustments
    public class StockAdjustmentDto
    {
        public int QuantityChange { get; set; }
        public decimal? UnitPrice { get; set; }
        public string Reference { get; set; }
        public string Description { get; set; }
    }
}