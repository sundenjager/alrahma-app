using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class Dons
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Reference { get; set; }

        [Required]
        [StringLength(100)]
        public string Category { get; set; }

        [Required]
        [StringLength(100)]
        public string Brand { get; set; }

        [Required]
        [StringLength(100)]
        public string Source { get; set; }

        [Required]
        [StringLength(100)]
        public string Usage { get; set; } // المستفيد

        [Required]
        [DataType(DataType.Date)]
        public DateTime DateOfEntry { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DateOfExit { get; set; }

        [Required]
        [StringLength(50)]
        public string? Status { get; set; } = "صالح";

        public string? Description { get; set; }

        [StringLength(255)]
        public string? LegalFilePath { get; set; }

        [StringLength(100)]
        public string? Nature { get; set; } 

        [Required]
        [StringLength(50)]
        public string DonsType { get; set; } = "نقدي"; // نقدي or عيني

        [Required]
        [StringLength(50)]
        public string DonsScope { get; set; } = "عمومي"; // عمومي or خاص

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MonetaryValue { get; set; }

        // Testament-specific properties
        [StringLength(100)]
        public string? TestatorNationality { get; set; } // جنسية الواهب
        
        [StringLength(100)]
        public string? TestamentNature { get; set; } // منقول، عقار، وصية مالية، وسائل نقل
        
        [StringLength(100)]
        public string? TestamentStatus { get; set; } // في الانتظار، نفذت
        
        [DataType(DataType.Date)]
        public DateTime? RegistrationDate { get; set; } // تاريخ التسجيل
        
        [DataType(DataType.Date)]
        public DateTime? ExecutionDate { get; set; } // تاريخ التنفيذ

        [NotMapped]
        public IFormFile LegalFile { get; set; }
    }
}