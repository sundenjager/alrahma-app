// DTOs/WaitingListEntryDto.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace AlRahmaBackend.DTOs
{
    public class WaitingListEntryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string Reason { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

public class CreateWaitingListEntryDto
    {
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
    }

    public class UpdateWaitingListEntryDto
    {
        public string Name { get; set; }
        public DateTime Date { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public string Reason { get; set; }
        public string Status { get; set; }
    }

    public class WaitingListFilterDto
    {
        public DateTime? Date { get; set; }
        public string Status { get; set; }
    }
}