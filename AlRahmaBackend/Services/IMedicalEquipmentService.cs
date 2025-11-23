// Interfaces/IFileStorageService.cs
using Microsoft.AspNetCore.Http;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public interface IMedicalEquipmentService
    {
        Task<IEnumerable<MedicalEquipment>> GetAllAsync(string category = "all", string search = "", int page = 1, int pageSize = 5);
        Task<MedicalEquipment> GetByIdAsync(int id);
        Task<MedicalEquipment> CreateAsync(MedicalEquipment equipment);
        Task UpdateAsync(int id, MedicalEquipment equipment);
        Task DeleteAsync(int id);
    }
}