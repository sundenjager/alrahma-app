    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;

    namespace AlRahmaBackend.DTOs
    {
        // Common DTOs for both SuggestedPrograms and OngoingProjects
        public class PhaseDto
        {
            public int? Id { get; set; }
            public string Title { get; set; }
            
            [Required(ErrorMessage = "تاريخ بدء المرحلة مطلوب")]
            [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "يجب أن يكون تاريخ البدء بتنسيق YYYY-MM-DD")]
            public string StartDate { get; set; }
            
            [Required(ErrorMessage = "تاريخ انتهاء المرحلة مطلوب")]
            [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "يجب أن يكون تاريخ الانتهاء بتنسيق YYYY-MM-DD")]
            public string EndDate { get; set; }
            
            public string Description { get; set; }
            
            [Range(0, double.MaxValue, ErrorMessage = "يجب أن تكون الميزانية رقم موجب")]
            public decimal Budget { get; set; }
            
            public List<ProjectTaskDto> Tasks { get; set; } = new List<ProjectTaskDto>();
        }

        public class ProjectTaskDto
        {
            public int? Id { get; set; }
            public string Title { get; set; }
            public string Description { get; set; }
            public string Status { get; set; } = "pending";
            
        }

        public class ProgramPartnerDto
        {
            public int? Id { get; set; }
            public string Name { get; set; }
            public string Type { get; set; }
            public string ContactPerson { get; set; }
            public string ContactPhone { get; set; }
            public string ContactEmail { get; set; }
            public decimal? ContributionAmount { get; set; }
            public string ContributionType { get; set; }
        }

        // SuggestedProgram DTOs
        public class SuggestedProgramCreateDto
        {
            [Required(ErrorMessage = "اسم المشروع مطلوب")]
            public string Project { get; set; }
            public string ProjectCode { get; set; }
            [Required(ErrorMessage = "تاريخ البدء مطلوب")]
            [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "يجب أن يكون تاريخ البدء بتنسيق YYYY-MM-DD")]
            public string StartDate { get; set; }
            [Required(ErrorMessage = "تاريخ الانتهاء مطلوب")]
            [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "يجب أن يكون تاريخ الانتهاء بتنسيق YYYY-MM-DD")]
            public string CompletionDate { get; set; }
            public string Period { get; set; }
            public string Place { get; set; }
            public string Beneficiaries { get; set; }
            public int? BeneficiariesCount { get; set; }
            public string TargetGroup { get; set; }
            [Range(0, double.MaxValue, ErrorMessage = "يجب أن تكون الميزانية رقم موجب")]
            public decimal Budget { get; set; }
            [Range(0, double.MaxValue, ErrorMessage = "يجب أن تكون التكلفة الإجمالية رقم موجب")]
            public decimal TotalCost { get; set; }
            public string BudgetSource { get; set; }
            public string FundingStatus { get; set; }
            public string ImplementationStatus { get; set; } = "pending";
            public string StatusComment { get; set; } = string.Empty;
            public string BudgetCommentary { get; set; } = string.Empty;
            public string ProjectManager { get; set; }
            public string ContactPhone { get; set; }
            public string Details { get; set; }
            public string Notes { get; set; }
            [Required(ErrorMessage = "اللجنة مطلوبة")]
            public string Committee { get; set; }
            public string Year { get; set; }
            public string RefusalCommentary { get; set; } = string.Empty;
            public List<PhaseDto> Phases { get; set; } = new List<PhaseDto>();
            public List<ProgramPartnerDto> Partners { get; set; } = new List<ProgramPartnerDto>();
        }

        public class SuggestedProgramUpdateDto : SuggestedProgramCreateDto
        {
            [Required]
            public int Id { get; set; }
            public string RefusalCommentary { get; set; }
        }
        
        public class RefuseProgramDto
    {
        [Required(ErrorMessage = "Commentary is required when refusing a program")]
        public string Commentary { get; set; }
    }

        public class SuggestedProgramReadDto
        {
            public int Id { get; set; }
            public string Project { get; set; }
            public string ProjectCode { get; set; }
            public DateTime? StartDate { get; set; }
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
            public DateTime? DecisionDate { get; set; }
            public string ProjectManager { get; set; }
            public string ContactPhone { get; set; }
            public string Details { get; set; }
            public string Notes { get; set; }
            public string Committee { get; set; }
            public string Year { get; set; }
            public string RefusalCommentary { get; set; }
            public List<ProgramPartnerDto> Partners { get; set; } = new List<ProgramPartnerDto>();
            public List<PhaseDto> Phases { get; set; } = new List<PhaseDto>();
        }

        public class SuggestedProgramFilterDto
        {
            public string Committee { get; set; } = "الكل";
            public string Year { get; set; } = "الكل";
        }

        public class OngoingProjectDto
        {
            public int Id { get; set; }
            public string Project { get; set; }
            public string ProjectCode { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? CompletionDate { get; set; }
            public string Place { get; set; }
            public decimal Budget { get; set; }
            public decimal Spent { get; set; }
            public decimal Remaining { get; set; }
            public string ImplementationStatus { get; set; }
            public string ProjectManager { get; set; }
            public string Committee { get; set; }
            public string Year { get; set; }
            public int Progress { get; set; }
            
            // ADD THESE MISSING PROPERTIES:
            public string ContactPhone { get; set; }
            public string TargetGroup { get; set; }
            public string Beneficiaries { get; set; }
            public int? BeneficiariesCount { get; set; }
            public string BudgetSource { get; set; }
            public string FundingStatus { get; set; }
            public string Details { get; set; }
            public string Notes { get; set; }
            public string Period { get; set; }
            public decimal TotalCost { get; set; }
            
            public List<PhaseDto> Phases { get; set; } = new List<PhaseDto>();
            public List<ProgramPartnerDto> Partners { get; set; } = new List<ProgramPartnerDto>();
        }

        public class OngoingProjectCreateDto
        {
            public string Project { get; set; }
            public string ProjectCode { get; set; }
            public string StartDate { get; set; }
            public string CompletionDate { get; set; }
            public string Place { get; set; }
            public decimal Budget { get; set; }
            public string ProjectManager { get; set; }
            public string Committee { get; set; }
            public string Year { get; set; }
            
            public string ImplementationStatus { get; set; } = "in_progress";
            
            // Add missing properties
        public string ContactPhone { get; set; }
            public string TargetGroup { get; set; }
            public string Beneficiaries { get; set; }
            public int? BeneficiariesCount { get; set; }
            public string BudgetSource { get; set; }
            public string FundingStatus { get; set; }
            public string Details { get; set; }
            public string Notes { get; set; }
            public string Period { get; set; }
            public decimal TotalCost { get; set; }
            
            public List<PhaseDto> Phases { get; set; } = new List<PhaseDto>();
            public List<ProgramPartnerDto> Partners { get; set; } = new List<ProgramPartnerDto>();
        }

        public class OngoingProjectUpdateDto
        {
            public int Id { get; set; }
            public string Project { get; set; }
            public string ProjectCode { get; set; }
            public DateTime? StartDate { get; set; }
            public DateTime? CompletionDate { get; set; }
            public string Place { get; set; }
            public decimal Budget { get; set; }
            public string ProjectManager { get; set; }
            public string Committee { get; set; }
            public string Year { get; set; }
            public string ContactPhone { get; set; }
            public string TargetGroup { get; set; }
            public string Beneficiaries { get; set; }
            public int? BeneficiariesCount { get; set; }
            public string BudgetSource { get; set; }
            public string FundingStatus { get; set; }
            public string Details { get; set; }
            public string Notes { get; set; }
            public string Period { get; set; }
            public decimal TotalCost { get; set; }
        }

    public class BudgetUpdateDto
    {
        public decimal Spent { get; set; }
        public decimal Remaining { get; set; }
        public decimal? NewBudget { get; set; } 
        public decimal BudgetAmount { get; set; }
        }
        
        public class TaskStatusUpdateDto
        {
            public string Status { get; set; }
        }
    }