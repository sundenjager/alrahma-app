using System;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.Models
{
    public class SuggestedProgram
    {
        public int Id { get; set; }
        public string Project { get; set; }
        public string ProjectCode { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? CompletionDate { get; set; }
        public string Period { get; set; }
        public string Place { get; set; }
        public string Beneficiaries { get; set; }
        public int? BeneficiariesCount { get; set; }
        public string TargetGroup { get; set; }
        public decimal Budget { get; set; }
        public decimal TotalCost { get; set; }
        public string BudgetSource { get; set; }
        public string FundingStatus { get; set; }
        public string ImplementationStatus { get; set; }
        public string StatusComment { get; set; }
        public string BudgetCommentary { get; set; }
        public string ProjectManager { get; set; }
        public string ContactPhone { get; set; }
        public string Details { get; set; }
        public string Notes { get; set; }
        public string Committee { get; set; }
        public string Year { get; set; }
        public string RefusalCommentary { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DecisionDate { get; set; }
        
        // Add missing properties
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }

        public List<Phase> Phases { get; set; } = new List<Phase>();
        public List<ProgramPartner> Partners { get; set; } = new List<ProgramPartner>();
    }

    // Phase.cs
    public class Phase
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; }
        public decimal Budget { get; set; }

        // For SuggestedProgram relationship
        public int? SuggestedProgramId { get; set; }
        public virtual SuggestedProgram SuggestedProgram { get; set; }

        // For OngoingProject relationship
        public int? OngoingProjectId { get; set; }
        public virtual OngoingProject OngoingProject { get; set; }

        public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();

        // Helper property for backward compatibility (if needed)
        public int? ProgramId => SuggestedProgramId ?? OngoingProjectId;
    }

    // Task.cs
    public class ProjectTask
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } = "pending";

        public int PhaseId { get; set; }
        public Phase Phase { get; set; }

    }


    public class ProgramPartner
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string ContactPerson { get; set; }
        public string ContactPhone { get; set; }
        public string ContactEmail { get; set; }
        public decimal ContributionAmount { get; set; }
        public string ContributionType { get; set; }

        // For SuggestedProgram relationship
        public int? SuggestedProgramId { get; set; }
        public virtual SuggestedProgram SuggestedProgram { get; set; }

        // For OngoingProject relationship
        public int? OngoingProjectId { get; set; }
        public virtual OngoingProject OngoingProject { get; set; }

        // Helper property for backward compatibility (if needed)
        public int? ProgramId => SuggestedProgramId ?? OngoingProjectId;
    }
}