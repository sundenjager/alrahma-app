using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{

    public class AidItemDto
    {
        public int Id { get; set; }
        public int SuppliesSubCategoryId { get; set; }
        public int Quantity { get; set; }
        public string SubCategoryName { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalValue { get; set; }
    }

    public class AidItemCreateDto
    {
        [Required(ErrorMessage = "SuppliesSubCategoryId is required")]
        [Range(1, int.MaxValue, ErrorMessage = "SuppliesSubCategoryId must be greater than 0")]
        public int SuppliesSubCategoryId { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
        public int Quantity { get; set; }
    }

    // In your DTOs namespace
    public class AidCreateDto
    {
        public string Reference { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfAid { get; set; }
        public string Description { get; set; }
        public string AidType { get; set; } = "نقدي";
        public decimal MonetaryValue { get; set; } // ADD THIS
        public IFormFile LegalFile { get; set; }
        public int? OngoingProjectId { get; set; }
        public List<AidItemDto> Items { get; set; } = new List<AidItemDto>();
    }

    public class AidUpdateDto
    {
        public int Id { get; set; }
        public string Reference { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfAid { get; set; }
        public string Description { get; set; }
        public IFormFile LegalFile { get; set; }
        public string AidType { get; set; }
        public decimal MonetaryValue { get; set; }
        public int? OngoingProjectId { get; set; } // ← ADD THIS
        public List<AidItemDto> Items { get; set; }
    }

    public class AidDto
    {
        public int Id { get; set; }
        public string Reference { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfAid { get; set; }
        public string Description { get; set; }
        public string LegalFilePath { get; set; }
        public string AidType { get; set; }
        public decimal MonetaryValue { get; set; }
        public int? OngoingProjectId { get; set; } // ← ADD THIS
        public string OngoingProjectName { get; set; } // ← Optional: for display
        public List<AidItemDto> Items { get; set; }
    }
    
    public class AidItemsResponse
    {
        public bool Success { get; set; }
        public int ItemsAdded { get; set; }
        public string Message { get; set; }
    }

    // Request DTOs
    public class AidBasicCreateDto
    {
        public string Reference { get; set; }
        public string Usage { get; set; }
        public DateTime DateOfAid { get; set; }
        public string Description { get; set; }
        public string AidType { get; set; } = "نقدي";
        public IFormFile LegalFile { get; set; }
    }

    public class AidItemsCreateDto
    {
        public List<AidItemDto> Items { get; set; } = new List<AidItemDto>();
    }
}