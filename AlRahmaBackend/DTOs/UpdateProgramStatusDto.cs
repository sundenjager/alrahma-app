using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{
    public class UpdateProgramStatusDto
    {
        [Required]
        public string ImplementationStatus { get; set; }
        
        public string StatusComment { get; set; }
        public DateTime? DecisionDate { get; set; }
    }
}