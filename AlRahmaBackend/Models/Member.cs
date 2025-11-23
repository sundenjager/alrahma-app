using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    // Models/Member.cs
    public class Member
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Lastname { get; set; }
        public string Cin { get; set; }
        public string Numcard { get; set; }
        public string Address { get; set; }
        public string Nationality { get; set; }
        public DateTime? BirthDate { get; set; }
        public string Work { get; set; }
        public string Tel { get; set; }
        public DateTime DateOfMembership { get; set; }
        public bool IsVolunteering { get; set; }
        public string VolunteerField { get; set; }
        public string MemberType { get; set; }
        public bool IsActive { get; set; }

        public string? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<MembershipHistory> MembershipHistories { get; set; }
    }
}