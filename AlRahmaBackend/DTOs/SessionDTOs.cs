using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using AlRahmaBackend.Models;


namespace AlRahmaBackend.DTOs
{
    public class CreateSessionDTO
    {
        [Required(ErrorMessage = "Session type is required")]
        [StringLength(50, ErrorMessage = "Session type cannot exceed 50 characters")]
        public string SessionType { get; set; } // "Ordinary", "Electoral", "Extraordinary"

        [Required(ErrorMessage = "Session date is required")]
        public DateTime SessionDate { get; set; }

        [Required(ErrorMessage = "Location is required")]
        [StringLength(100, ErrorMessage = "Location cannot exceed 100 characters")]
        public string Location { get; set; }

        [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
        public string Notes { get; set; }

        public bool IsElectoral { get; set; } = false;

        // Document properties
        [RequiredIf(nameof(IsElectoral), false, ErrorMessage = "Programs document is required")]
        public IFormFile Programs { get; set; }

        [RequiredIf(nameof(IsElectoral), false, ErrorMessage = "Budget document is required")]
        public IFormFile Budget { get; set; }

        public IFormFile FinancialReport { get; set; }
        public IFormFile LiteraryReport { get; set; }
        public IFormFile AuditorReport { get; set; }
        public IFormFile NewspaperAnnouncement { get; set; }
        public IFormFile? GeneralSessionPV { get; set; }
        public IFormFile? NewspaperReport { get; set; }
        public IFormFile? AttendeeList { get; set; }
        public IFormFile? MembersAttendee { get; set; }

        // Collections
        public List<SessionGuestDTO> Guests { get; set; } = new List<SessionGuestDTO>();
       //public List<int> InformedMemberIds { get; set; } = new List<int>();
        //public List<int> AttendingMemberIds { get; set; } = new List<int>();
        public List<SessionCandidateDTO> Candidates { get; set; } = new List<SessionCandidateDTO>();
        public List<SessionDocumentDTO> AdditionalDocuments { get; set; } = new List<SessionDocumentDTO>();
    }

    public class SessionGuestDTO
    {
        [Required(ErrorMessage = "Guest name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Guest position is required")]
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters")]
        public string Position { get; set; }

        [StringLength(100, ErrorMessage = "Organization cannot exceed 100 characters")]
        public string Organization { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string Phone { get; set; }
    }

    public class SessionCandidateDTO
    {
        [Required(ErrorMessage = "Candidate name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Candidate position is required")]
        [StringLength(100, ErrorMessage = "Position cannot exceed 100 characters")]
        public string Position { get; set; }

        [Required(ErrorMessage = "Candidate file is required")]
        public IFormFile CandidateFile { get; set; }
    }

    public class SessionDocumentDTO
    {
        [Required(ErrorMessage = "Document type is required")]
        public string DocumentType { get; set; }

        [Required(ErrorMessage = "File is required")]
        public IFormFile File { get; set; }
    }

    public class SessionResponseDTO
    {
        public int Id { get; set; }
        public string SessionType { get; set; }
        public DateTime SessionDate { get; set; }
        public string Location { get; set; }
        public string Notes { get; set; }
        public string Status { get; set; } // "Pending", "Approved", "Rejected"
        public bool IsElectoral { get; set; }
        
        // File paths
        public string ProgramsFilePath { get; set; }
        public string BudgetFilePath { get; set; }
        public string FinancialReportFilePath { get; set; }
        public string LiteraryReportFilePath { get; set; }
        public string AuditorReportFilePath { get; set; }
        public string NewspaperAnnouncementFilePath { get; set; }
        public string? GeneralSessionPVFilePath { get; set; }
        public string? NewspaperReportFilePath { get; set; }
        public string? AttendeeListFilePath { get; set; }
        public string? MembersAttendeeFilePath { get; set; }

        // Collections
        public List<SessionGuestResponseDTO> Guests { get; set; } = new List<SessionGuestResponseDTO>();
        //public List<SessionMemberResponseDTO> Members { get; set; } = new List<SessionMemberResponseDTO>();
        public List<SessionCandidateResponseDTO> Candidates { get; set; } = new List<SessionCandidateResponseDTO>();
        public List<SessionDocumentResponseDTO> AdditionalDocuments { get; set; } = new List<SessionDocumentResponseDTO>();

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    // Response DTOs
    public class SessionGuestResponseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Position { get; set; }
        public string Organization { get; set; }
        public string Phone { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /*public class SessionMemberResponseDTO
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public string Name { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public bool IsInformed { get; set; }
        public bool IsPresent { get; set; }
        public DateTime CreatedAt { get; set; } // Add this property
    }*/

    public class SessionCandidateResponseDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Position { get; set; }
        public string CandidateFilePath { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SessionDocumentResponseDTO
    {
        public int Id { get; set; }
        public string DocumentType { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    // Custom validation attribute
    public class RequiredIfAttribute : ValidationAttribute
    {
        private string PropertyName { get; set; }
        private object DesiredValue { get; set; }

        public RequiredIfAttribute(string propertyName, object desiredValue, string errorMessage = "")
        {
            PropertyName = propertyName;
            DesiredValue = desiredValue;
            ErrorMessage = errorMessage;
        }

        protected override ValidationResult IsValid(object value, ValidationContext context)
        {
            var instance = context.ObjectInstance;
            var type = instance.GetType();
            var propertyValue = type.GetProperty(PropertyName)?.GetValue(instance, null);

            if (propertyValue?.ToString() == DesiredValue.ToString() && value == null)
            {
                return new ValidationResult(ErrorMessage);
            }
            return ValidationResult.Success;
        }

        private SessionResponseDTO MapToResponseDTO(Session session)
        {
            return new SessionResponseDTO
            {
                Id = session.Id,
                SessionType = session.SessionType,
                SessionDate = session.SessionDate,
                Location = session.Location,
                Notes = session.Notes,
                Status = session.Status,
                IsElectoral = session.IsElectoral,
                ProgramsFilePath = session.ProgramsFilePath,
                BudgetFilePath = session.BudgetFilePath,
                FinancialReportFilePath = session.FinancialReportFilePath,
                LiteraryReportFilePath = session.LiteraryReportFilePath,
                AuditorReportFilePath = session.AuditorReportFilePath,
                NewspaperAnnouncementFilePath = session.NewspaperAnnouncementFilePath,
                GeneralSessionPVFilePath = session.GeneralSessionPVFilePath,
                NewspaperReportFilePath = session.NewspaperReportFilePath,
                AttendeeListFilePath = session.AttendeeListFilePath,
                MembersAttendeeFilePath = session.MembersAttendeeFilePath,
                CreatedAt = session.CreatedAt,
                UpdatedAt = session.UpdatedAt,
                Guests = session.Guests?.Select(g => new SessionGuestResponseDTO
                {
                    Id = g.Id,
                    Name = g.Name,
                    Position = g.Position,
                    Organization = g.Organization,
                    Phone = g.Phone,
                    CreatedAt = g.CreatedAt
                }).ToList(),
                /*Members = session.Members?.Select(m => new SessionMemberResponseDTO
                {
                    MemberId = m.MemberId,
                    Name = m.Member?.Name,
                    LastName = m.Member?.Lastname,
                    Phone = m.Member?.Tel,
                    IsInformed = m.IsInformed,
                    IsPresent = m.IsPresent,
                    CreatedAt = m.CreatedAt
                }).ToList(),*/
                Candidates = session.Candidates?.Select(c => new SessionCandidateResponseDTO
                {
                    Id = c.Id,
                    Name = c.Name,
                    Position = c.Position,
                    CandidateFilePath = c.CandidateFilePath,
                    CreatedAt = c.CreatedAt
                }).ToList(),
                AdditionalDocuments = session.Documents?.Select(d => new SessionDocumentResponseDTO
                {
                    Id = d.Id,
                    DocumentType = d.DocumentType,
                    FilePath = d.FilePath,
                    UploadedAt = d.UploadedAt
                }).ToList()
            };
}
    }

    public class CompleteSessionDTO
        {
            public IFormFile GeneralSessionPV { get; set; }
            public IFormFile NewspaperReport { get; set; }
            public IFormFile AttendeeList { get; set; }
            public IFormFile MembersAttendee { get; set; }
        }
}