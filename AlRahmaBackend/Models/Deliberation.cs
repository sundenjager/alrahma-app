// Models/Deliberation.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class Deliberation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Number { get; set; } 

        [Required]
        public DateTime DateTime { get; set; }

        public string DocumentPath { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties 
        public virtual ICollection<DeliberationAttendee> Attendees { get; set; } = new List<DeliberationAttendee>();

    }

    public class DeliberationAttendee
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        public int DeliberationId { get; set; }

        [ForeignKey("DeliberationId")]
        public virtual Deliberation Deliberation { get; set; }
    }

}