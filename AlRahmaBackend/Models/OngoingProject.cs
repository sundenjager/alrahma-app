    // Models/OngoingProject.cs
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;

    namespace AlRahmaBackend.Models
    {
    public class OngoingProject
    {
        public int Id { get; set; }

        // Original program ID for reference
        public int OriginalProgramId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Project { get; set; }

        [MaxLength(50)]
        public string ProjectCode { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? CompletionDate { get; set; }

        [MaxLength(100)]
        public string Period { get; set; }

        [MaxLength(200)]
        public string Place { get; set; }

        [MaxLength(200)]
        public string Beneficiaries { get; set; }
        public int? BeneficiariesCount { get; set; }

        [MaxLength(100)]
        public string TargetGroup { get; set; }

        public decimal Budget { get; set; }
        public decimal TotalCost { get; set; }

        [MaxLength(100)]
        public string BudgetSource { get; set; }

        [MaxLength(100)]
        public string FundingStatus { get; set; }

        [MaxLength(100)]
        public string ImplementationStatus { get; set; } = "in_progress";

        [MaxLength(100)]
        public string ProjectManager { get; set; }

        [MaxLength(20)]
        public string ContactPhone { get; set; }

        public string Details { get; set; }
        public string Notes { get; set; }

        [Required]
        [MaxLength(100)]
        public string Committee { get; set; }

        [Required]
        public string Year { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public string BudgetCommentary { get; set; }

        public decimal Spent { get; set; } = 0;
        public decimal Remaining { get; set; } = 0;

        // Navigation properties
        public ICollection<Phase> Phases { get; set; } = new List<Phase>();
        public ICollection<ProgramPartner> Partners { get; set; } = new List<ProgramPartner>();
        public virtual ICollection<Aid> Aids { get; set; } = new List<Aid>();
        public virtual ICollection<Supplies> Supplies { get; set; } = new List<Supplies>();

    }
    }