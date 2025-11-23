// Models/WaitingListEntry.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.Models
{
    public class WaitingListEntry
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; }
        
        [Required]
        public DateTime Date { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Address { get; set; }
        
        [Required]
        [MaxLength(500)]
        public string Reason { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // pending, done, refused
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}