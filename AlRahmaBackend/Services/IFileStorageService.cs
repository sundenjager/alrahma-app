// Interfaces/IFileStorageService.cs
using Microsoft.AspNetCore.Http;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public interface IFileStorageService
    {
        // Existing methods
        Task<string> SaveFileAsync(IFormFile file, string folderPath);
        Task DeleteFileAsync(string filePath);
        
        // Add these new methods
        Task<string> SaveSessionDocumentAsync(IFormFile file);
        Task<string> SaveCandidateDocumentAsync(IFormFile file);
    }
}