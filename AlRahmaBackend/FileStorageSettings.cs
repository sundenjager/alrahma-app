// Models/FileStorageSettings.cs
namespace AlRahmaBackend.Models
{
    public class FileStorageSettings
    {
        public string RootPath { get; set; } = "wwwroot";
        public string UploadsFolder { get; set; } = "Uploads";
        public string SessionDocumentsFolder { get; set; } = "SessionDocuments";
        public string CandidateDocumentsFolder { get; set; } = "CandidateDocuments";
    }
}