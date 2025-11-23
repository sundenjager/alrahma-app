    using Microsoft.AspNetCore.Http;
    using System;
    using System.ComponentModel.DataAnnotations;

    namespace AlRahmaBackend.DTOs
    {
        public class ActImmDto
        {
            [Required(ErrorMessage = "Category is required")]
            public int CategoryId { get; set; }

            [Required(ErrorMessage = "Brand is required")]
            [StringLength(100, ErrorMessage = "Brand cannot exceed 100 characters")]
            public string Brand { get; set; }

            [Required(ErrorMessage = "Number is required")]
            [StringLength(50, ErrorMessage = "Number cannot exceed 50 characters")]
            public string Number { get; set; }

            [Range(0, double.MaxValue, ErrorMessage = "Monetary value must be positive")]
            public decimal MonetaryValue { get; set; } = 0;

            [Required(ErrorMessage = "Usage location is required")]
            [StringLength(200, ErrorMessage = "Usage location cannot exceed 200 characters")]
            public string UsageLocation { get; set; }

            [Required(ErrorMessage = "Source is required")]
            [StringLength(100, ErrorMessage = "Source cannot exceed 100 characters")]
            public string Source { get; set; }

            [Required(ErrorMessage = "Source nature is required")]
            [StringLength(20, ErrorMessage = "Source nature cannot exceed 20 characters")]
            public string SourceNature { get; set; } = "شراء";

            [Required(ErrorMessage = "Status is required")]
            [StringLength(20, ErrorMessage = "Status cannot exceed 20 characters")]
            public string Status { get; set; } = "صالح";

            public DateTime? DateOfDeployment { get; set; }

            public DateTime? DateOfEnd { get; set; }

            public bool IsActive { get; set; } = true;

            public IFormFile? LegalFile { get; set; } 
        }

        public class ActImmResponseDto
        {
            public int Id { get; set; }
            public CategoryLookupDto Category { get; set; }
            public string Brand { get; set; }
            public string Number { get; set; }
            public decimal MonetaryValue { get; set; }
            public string UsageLocation { get; set; }
            public string Source { get; set; }
            public string SourceNature { get; set; }
            public string Status { get; set; }
            public DateTime DateOfDeployment { get; set; }
            public DateTime? DateOfEnd { get; set; }
            public bool IsActive { get; set; }
            public string LegalFileUrl { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }

        public class ActImmCategoryDto
        {
            public int Id { get; set; }

            [Required(ErrorMessage = "Name is required")]
            [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
            public string Name { get; set; }

            [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
            public string Description { get; set; }

            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }

        public class CreateCategoryDto
        {
            [Required(ErrorMessage = "Name is required")]
            [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
            public string Name { get; set; }

            [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
            public string Description { get; set; }
        }

        public class UpdateCategoryDto
        {
            [Required(ErrorMessage = "Name is required")]
            [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
            public string Name { get; set; }

            [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
            public string Description { get; set; }
        }

        public class CategoryLookupDto
        {
            public int Id { get; set; }
            public string Name { get; set; }
        }

        public class UpdateStatusDto
        {
            public bool IsActive { get; set; }
        }

        public class FileUploadResultDto
        {
            public bool Success { get; set; }
            public string FilePath { get; set; }
            public string ErrorMessage { get; set; }
        }
    }