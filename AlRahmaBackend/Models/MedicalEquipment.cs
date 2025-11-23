    // Models/MedicalEquipment.cs
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Linq;
    using System.Threading.Tasks;
    using System.Text.Json.Serialization;

    namespace AlRahmaBackend.Models
    {
        public class MedicalEquipment
        {
            [Key]
            public int Id { get; set; }

            public string? Reference { get; set; }

            [Required(ErrorMessage = "Category is required")]
            public string Category { get; set; }

            [Required(ErrorMessage = "Usage is required")]
            public string Usage { get; set; }

        
            [Required(ErrorMessage = "Date of entry is required")]
            public DateTime DateOfEntry { get; set; }

            [Display(Name = "Monetary Value")]
            [Column(TypeName = "decimal(18,2)")]
            public decimal? MonetaryValue { get; set; }

            // Optional fields
            public string Brand { get; set; }
            public string Source { get; set; }

            [DataType(DataType.Date)]
            [DisplayFormat(DataFormatString = "{0:yyyy-MM-dd}", ApplyFormatInEditMode = true)]
            public DateTime? DateOfExit { get; set; }

            public string AcquisitionType { get; set; }
            public string Status { get; set; }
            public string? Description { get; set; }
            public string? LegalFilePath { get; set; }

            // Add missing properties
            public string? CreatedBy { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public string? UpdatedBy { get; set; }
            public DateTime? UpdatedAt { get; set; }

            public ICollection<EquipmentDispatch> Dispatches { get; set; } = new List<EquipmentDispatch>();
        }

        public class EquipmentDispatch
        {
            public int Id { get; set; }

            [Required(ErrorMessage = "Dispatch date is required")]
            [DataType(DataType.Date)]
            public DateTime DispatchDate { get; set; }

            [DataType(DataType.Date)]
            public DateTime? ReturnDate { get; set; }

            [Required(ErrorMessage = "Beneficiary is required")]
            public string Beneficiary { get; set; }

            [Required(ErrorMessage = "Patient phone is required")]
            public string PatientPhone { get; set; }

            [Required(ErrorMessage = "Patient CIN is required")]
            public string PatientCIN { get; set; }

            [Required(ErrorMessage = "Coordinator is required")]
            public string Coordinator { get; set; }

            [Required(ErrorMessage = "Responsible person is required")]
            public string ResponsiblePerson { get; set; }

            [Required(ErrorMessage = "Responsible person phone is required")]
            public string ResponsiblePersonPhone { get; set; }

            [Required(ErrorMessage = "Responsible person CIN is required")]
            public string ResponsiblePersonCIN { get; set; }

            public string Notes { get; set; }
            public string? ReturnNotes { get; set; }

            public string PDFFilePath { get; set; }

            [Required(ErrorMessage = "Equipment is required")]
            public int MedicalEquipmentId { get; set; }
            public MedicalEquipment MedicalEquipment { get; set; }

            public string EquipmentReference { get; set; }

            public string? CreatedBy { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public string? UpdatedBy { get; set; }
            public DateTime? UpdatedAt { get; set; }
        }

        public class EquipmentCategory
        {
            public int Id { get; set; }

            [Required(ErrorMessage = "Category name is required")]
            public string Name { get; set; }

            public string Description { get; set; } // Add missing property

            public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Add missing property

            public DateTime? UpdatedAt { get; set; } // Add missing property
        }
    }