using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{
    public class SuppliesCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<SuppliesSubCategoryDto> SubCategories { get; set; } = new List<SuppliesSubCategoryDto>();
    }

    public class SuppliesSubCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal UnitPrice { get; set; }
        public int SuppliesCategoryId { get; set; }
        public string SuppliesCategoryName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class SuppliesItemDto
    {
        public int Id { get; set; }
        public int SuppliesSubCategoryId { get; set; }
        public int Quantity { get; set; }
        public string SubCategoryName { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalValue { get; set; }
    }

    public class SuppliesCreateDto
    {
        public string Reference { get; set; }
        public string Source { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfEntry { get; set; }
        public DateTime? DateOfExit { get; set; }
        public string Status { get; set; } = "صالح"; // Default value
        public string Description { get; set; }
        public string SuppliesType { get; set; } = "نقدي"; // Default value
        public string SuppliesScope { get; set; } = "عمومي"; // Default value
        public string SuppliesNature { get; set; } = "Donation"; // Default value (Purchase or Donation)
        public IFormFile LegalFile { get; set; }
        public int? OngoingProjectId { get; set; } // Added: Foreign key to OngoingProject
        public List<SuppliesItemDto> Items { get; set; } = new List<SuppliesItemDto>();
    }

    public class SuppliesDto
    {
        public int Id { get; set; }
        public string Reference { get; set; }
        public string Source { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfEntry { get; set; }
        public DateTime? DateOfExit { get; set; }
        public string Status { get; set; }
        public string Description { get; set; }
        public string LegalFilePath { get; set; }
        public string SuppliesType { get; set; }
        public string SuppliesScope { get; set; }
        public string SuppliesNature { get; set; }
        public decimal MonetaryValue { get; set; }
        public int? OngoingProjectId { get; set; }
        public OngoingProjectDto OngoingProject { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<SuppliesItemDto> Items { get; set; }
    }

    public class SuppliesUpdateDto
    {
        public int Id { get; set; }
        public string Reference { get; set; }
        public string Source { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfEntry { get; set; }
        public DateTime? DateOfExit { get; set; }
        public string Status { get; set; }
        public string Description { get; set; }
        public IFormFile LegalFile { get; set; }
        public string SuppliesType { get; set; }
        public string SuppliesScope { get; set; }
        public string SuppliesNature { get; set; } // Added: Purchase or Donation
        public decimal MonetaryValue { get; set; }
        public int? OngoingProjectId { get; set; } // Added: Foreign key to OngoingProject
        public List<SuppliesItemDto> Items { get; set; }
    }

    // Additional DTOs for specific operations
    public class SuppliesCategoryCreateDto
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class SuppliesSubCategoryCreateDto
    {
        [Required(ErrorMessage = "Subcategory name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Unit price is required")]
        [Range(0, double.MaxValue, ErrorMessage = "Unit price must be positive")]
        public decimal UnitPrice { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public int SuppliesCategoryId { get; set; }
    }

    public class SuppliesCreateResponse
    {
        public bool Success { get; set; }
        public int SuppliesId { get; set; }
        public string Message { get; set; }
    }

    public class SuppliesItemsResponse
    {
        public bool Success { get; set; }
        public int ItemsAdded { get; set; }
        public string Message { get; set; }
    }

    // Request DTOs
    public class SuppliesBasicCreateDto
    {
        public string Reference { get; set; }
        public string Source { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfEntry { get; set; }
        public DateTime? DateOfExit { get; set; }
        public string Status { get; set; } = "صالح";
        public string Description { get; set; }
        public string SuppliesType { get; set; } = "نقدي";
        public string SuppliesScope { get; set; } = "عمومي";
        public string SuppliesNature { get; set; } = "Donation"; // Added: Purchase or Donation
        public IFormFile LegalFile { get; set; }
        public int? OngoingProjectId { get; set; } // Added: Foreign key to OngoingProject
    }

    public class SuppliesItemsCreateDto
    {
        public List<SuppliesItemDto> Items { get; set; } = new List<SuppliesItemDto>();
    }

}