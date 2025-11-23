// Services/FileStorageService.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using AlRahmaBackend.Models;
using System.IO;
using System.Threading.Tasks;

namespace AlRahmaBackend.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly FileStorageSettings _settings;

        public FileStorageService(IOptions<FileStorageSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderPath)
        {
            var uploadsFolder = Path.Combine(_settings.RootPath, folderPath);
            Directory.CreateDirectory(uploadsFolder);
            
            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return filePath;
        }

        public Task DeleteFileAsync(string filePath)
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }

        public async Task<string> SaveSessionDocumentAsync(IFormFile file)
        {
            return await SaveFileAsync(file, _settings.SessionDocumentsFolder);
        }

        public async Task<string> SaveCandidateDocumentAsync(IFormFile file)
        {
            return await SaveFileAsync(file, _settings.CandidateDocumentsFolder);
        }
    }
}