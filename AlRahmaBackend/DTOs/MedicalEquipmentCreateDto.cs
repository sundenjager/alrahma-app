using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.DTOs
{
    public class MedicalEquipmentCreateDto
    {
        public string? Reference { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; }

        public string Brand { get; set; }
        public string Source { get; set; }

        [Required(ErrorMessage = "Usage is required")]
        public string Usage { get; set; }

        [Required(ErrorMessage = "Date of entry is required")]
        public DateTime DateOfEntry { get; set; }

        public decimal? MonetaryValue { get; set; }
        public DateTime? DateOfExit { get; set; }
        public string AcquisitionType { get; set; }
        public string Status { get; set; }
        public string? Description { get; set; }
        public IFormFile? LegalFile { get; set; }
    }

    public class MedicalEquipmentMinimalUpdateDto
    {
        [Required]
        public int Id { get; set; }
        public DateTime? DateOfEntry { get; set; }
        public DateTime? DateOfExit { get; set; }
        public string? Status { get; set; }
        public IFormFile? LegalFile { get; set; }
    }
}