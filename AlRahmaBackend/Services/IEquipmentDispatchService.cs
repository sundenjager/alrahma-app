using AlRahmaBackend.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AlRahmaBackend.Services
{
    public interface IEquipmentDispatchService
    {
        Task<IEnumerable<EquipmentDispatch>> GetAllAsync();
        Task<IEnumerable<EquipmentDispatch>> GetOngoingDispatchesAsync();
        Task<IEnumerable<EquipmentDispatch>> GetDispatchHistoryAsync();
        Task<EquipmentDispatch> GetByIdAsync(int id);
        Task<EquipmentDispatch> CreateAsync(EquipmentDispatch dispatch, IFormFile pdfFile = null);
        Task<EquipmentDispatch> UpdateAsync(EquipmentDispatch dispatch, IFormFile pdfFile = null); // Add IFormFile parameter
        Task<EquipmentDispatch> MarkAsReturnedAsync(int id, DateTime returnDate, string returnNotes, string updatedBy = null); // Add updatedBy parameter
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<EquipmentDispatch>> GetByEquipmentIdAsync(int equipmentId);
        Task<IEnumerable<EquipmentDispatch>> SearchAsync(string searchTerm);
        Task<IEnumerable<MedicalEquipment>> GetAvailableEquipmentAsync(string usageType = "للاعارة");    }
}