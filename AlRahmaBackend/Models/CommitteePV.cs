using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class CommitteePV
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Number { get; set; }

        [Required]
        public DateTime DateTime { get; set; }

        [Required]
        [StringLength(100)]
        public string Committee { get; set; }

        public string DocumentPath { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public virtual ICollection<Attendee> Attendees { get; set; } = new List<Attendee>();
        
        // Remove PVPoints collection
        // public virtual ICollection<PVPoint> Points { get; set; } = new List<PVPoint>();
    }

    public class Attendee
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        public int CommitteePVId { get; set; }

        [ForeignKey("CommitteePVId")]
        public virtual CommitteePV CommitteePV { get; set; }
    }

    // Remove PVPoint class entirely
    // public class PVPoint { ... }
}