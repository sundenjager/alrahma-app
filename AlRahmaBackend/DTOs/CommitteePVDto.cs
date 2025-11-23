using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AlRahmaBackend.DTOs
{
    public class CommitteePVDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "PV number is required")]
        [StringLength(50, ErrorMessage = "PV number cannot exceed 50 characters")]
        public string Number { get; set; }

        [Required(ErrorMessage = "Date and time are required")]
        public DateTime DateTime { get; set; }

        [Required(ErrorMessage = "Committee is required")]
        [StringLength(100, ErrorMessage = "Committee name cannot exceed 100 characters")]
        public string Committee { get; set; }

        public string DocumentPath { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    // Remove PVPointDto, PendingSuggestionDto, SuggestionDto classes

    public class CommitteePVDetailDto : CommitteePVDto
    {
        [Required(ErrorMessage = "At least one attendee is required")]
        [MinLength(1, ErrorMessage = "At least one attendee is required")]
        public List<string> Attendees { get; set; } = new List<string>();

        // Remove Points collection
        // public List<PVPointDto> Points { get; set; } = new List<PVPointDto>();
    }

    public class CreatePVDto
    {
        [Required(ErrorMessage = "PV number is required")]
        public string Number { get; set; }

        [Required(ErrorMessage = "Date and time are required")]
        public DateTime DateTime { get; set; }

        [Required(ErrorMessage = "Committee is required")]
        public string Committee { get; set; }

        public IFormFile Document { get; set; }

        [Required(ErrorMessage = "At least one attendee is required")]
        [MinLength(1, ErrorMessage = "At least one attendee is required")]
        public List<string> Attendees { get; set; } = new List<string>();

        // Remove Points collection
        // public List<PVPointDto> Points { get; set; } = new List<PVPointDto>();
    }


}