namespace AlRahmaBackend.Models
{
    public class MembershipHistory
    {
        public int Id { get; set; }
        public int? MemberId { get; set; }
        public DateTime UpdateDate { get; set; }
        public string CardNumber { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTime? CreatedAt { get; set; } // Add this
        public DateTime? UpdatedAt { get; set; } // Add this
        public Member Member { get; set; }
    }
}