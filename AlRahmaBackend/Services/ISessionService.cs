using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using AlRahmaBackend.DTOs;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public interface ISessionService
    {
        Task<SessionResponseDTO> CreateSessionAsync(CreateSessionDTO dto);
        Task<List<SessionResponseDTO>> GetAllSessionsAsync();
        Task<SessionResponseDTO> GetSessionByIdAsync(int id);
        Task<SessionResponseDTO> GetPendingSessionAsync();
        Task<SessionResponseDTO> CompleteSessionAsync(int sessionId, CompleteSessionDTO dto);
        Task<List<SessionResponseDTO>> GetCompletedSessionsAsync();
        Task<string> TrackDocumentAsync(int sessionId, string documentType, string actionType, IFormFile proofFile);
        Task<List<DocumentTrackingDTO>> GetDocumentHistoryAsync(int sessionId, string documentType);
        Task<List<DocumentStatusDTO>> GetDocumentStatusesAsync(int sessionId);
        string GetDocumentPath(int sessionId, string documentType);
        bool ValidateDocument(int sessionId, string documentType);
        Task<string> GetDocumentProofPath(int trackingId);
        bool ValidateDocumentProof(int trackingId);
        
        // Add the missing method
        Task DeleteSessionAsync(int id);
    }
}