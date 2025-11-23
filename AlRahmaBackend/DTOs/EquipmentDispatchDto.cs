using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.DTOs
{
    public class EquipmentDispatchCreateDto
    {
        [Required]
        public int MedicalEquipmentId { get; set; }

        [Required]
        public string Beneficiary { get; set; }

        [Required]
        public string PatientPhone { get; set; }

        [Required]
        public string PatientCIN { get; set; }

        [Required]
        public string Coordinator { get; set; }

        [Required]
        public string ResponsiblePerson { get; set; }

        [Required]
        public string ResponsiblePersonPhone { get; set; }

        [Required]
        public string ResponsiblePersonCIN { get; set; }

        public string Notes { get; set; }

        [Required]
        public string EquipmentReference { get; set; }

        [Required]
        public DateTime DispatchDate { get; set; }

        public IFormFile PDFFile { get; set; }
        public string PDFFilePath { get; set; }
    }

    public class ReturnDispatchDto
    {
        public DateTime ReturnDate { get; set; } // Matches exactly
        public string ReturnNotes { get; set; }  // Matches exactly
    }
}