using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AlRahmaBackend.Models
{
   public class Session
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string SessionType { get; set; }

        [Required]
        public DateTime SessionDate { get; set; }

        [Required]
        public string Location { get; set; }

        public string Notes { get; set; }
        public string Status { get; set; } = "Pending";
        public bool IsElectoral { get; set; }

        // Document paths
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

        // Navigation properties
        public virtual ICollection<SessionDocument> Documents { get; set; }
        public virtual ICollection<SessionGuest> Guests { get; set; }
        //public virtual ICollection<SessionMember> Members { get; set; }
        public virtual ICollection<SessionCandidate> Candidates { get; set; }
        
        // Add this missing navigation property
        public virtual ICollection<DocumentTracking> DocumentTrackings { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public class SessionDocument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        public string DocumentType { get; set; }

        [Required]
        public string FilePath { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("SessionId")]
        public virtual Session Session { get; set; }
    }

    public class SessionGuest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Position { get; set; }

        public string Organization { get; set; }

        [Required]
        public string Phone { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("SessionId")]
        public virtual Session Session { get; set; }
    }

    public class SessionCandidate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SessionId { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Position { get; set; }

        [Required]
        public string CandidateFilePath { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("SessionId")]
        public virtual Session Session { get; set; }
    }
}