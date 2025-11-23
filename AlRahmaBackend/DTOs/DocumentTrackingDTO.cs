using System;

namespace AlRahmaBackend.DTOs
{
    public class DocumentTrackingDTO
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public string DocumentType { get; set; }
        public string ActionType { get; set; }
        public string ProofFilePath { get; set; }
        public DateTime ActionDate { get; set; }
    }

    public class DocumentTrackingCreateDTO
    {
        public int SessionId { get; set; }
        public string DocumentType { get; set; }
        public string ActionType { get; set; }
    }

    public class DocumentStatusDTO
    {
        public string DocumentType { get; set; }
        public bool IsSent { get; set; }
        public bool IsReceived { get; set; }
        public DateTime? SentDate { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public string SentProof { get; set; }
        public string ReceivedProof { get; set; }
    }
}