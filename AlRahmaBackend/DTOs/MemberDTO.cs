namespace AlRahmaBackend.DTOs
{
    public class MemberDTO
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
        public bool IsActive { get; set; } = true;
    }

    public class MemberResponseDTO
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
        public bool IsActive { get; set; } = true;
        public List<DateTime> UpdateDates { get; set; } = new List<DateTime>();
        public string Status { get; set; }
        public int? EligibilityYear { get; set; }
        public DateTime? LastUpdateDate { get; set; }
    }

    public class MembershipHistoryDTO
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CardNumber { get; set; }
    }

    public class MembershipHistoryResponseDTO
    {
        public int Id { get; set; }
        public int MemberId { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CardNumber { get; set; }
        public string UpdatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}