using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;



namespace AlRahmaBackend.Services
{
    public class EquipmentDispatchService : IEquipmentDispatchService
    {
        private readonly ApplicationDbContext _context;

        public EquipmentDispatchService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EquipmentDispatch>> GetAllAsync()
        {
            return await _context.EquipmentDispatches
                .Include(d => d.MedicalEquipment)
                .OrderByDescending(d => d.DispatchDate)
                .Select(d => new EquipmentDispatch
                {
                    Id = d.Id,
                    MedicalEquipmentId = d.MedicalEquipmentId,
                    MedicalEquipment = d.MedicalEquipment,
                    Beneficiary = d.Beneficiary,
                    PatientPhone = d.PatientPhone,
                    PatientCIN = d.PatientCIN,
                    Coordinator = d.Coordinator,
                    ResponsiblePerson = d.ResponsiblePerson,
                    ResponsiblePersonPhone = d.ResponsiblePersonPhone,
                    ResponsiblePersonCIN = d.ResponsiblePersonCIN,
                    Notes = d.Notes,
                    ReturnNotes = d.ReturnNotes,
                    DispatchDate = d.DispatchDate,
                    ReturnDate = d.ReturnDate,
                    PDFFilePath = d.PDFFilePath, // Explicitly include this
                    EquipmentReference = d.EquipmentReference
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<EquipmentDispatch>> GetOngoingDispatchesAsync()
        {
            return await _context.EquipmentDispatches
                .Include(d => d.MedicalEquipment)
                .Where(d => d.ReturnDate == null)
                .OrderByDescending(d => d.DispatchDate)
                .Select(d => new EquipmentDispatch
                {
                    Id = d.Id,
                    MedicalEquipmentId = d.MedicalEquipmentId,
                    MedicalEquipment = d.MedicalEquipment,
                    Beneficiary = d.Beneficiary,
                    PatientPhone = d.PatientPhone,
                    PatientCIN = d.PatientCIN,
                    Coordinator = d.Coordinator,
                    ResponsiblePerson = d.ResponsiblePerson,
                    ResponsiblePersonPhone = d.ResponsiblePersonPhone,
                    ResponsiblePersonCIN = d.ResponsiblePersonCIN,
                    Notes = d.Notes,
                    ReturnNotes = d.ReturnNotes,
                    DispatchDate = d.DispatchDate,
                    ReturnDate = d.ReturnDate,
                    PDFFilePath = d.PDFFilePath, // Explicitly include this
                    EquipmentReference = d.EquipmentReference
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<EquipmentDispatch>> GetDispatchHistoryAsync()
        {
            return await _context.EquipmentDispatches
                .Include(d => d.MedicalEquipment)
                .Where(d => d.ReturnDate != null)
                .OrderByDescending(d => d.DispatchDate)
                .Select(d => new EquipmentDispatch
                {
                    Id = d.Id,
                    MedicalEquipmentId = d.MedicalEquipmentId,
                    MedicalEquipment = d.MedicalEquipment,
                    Beneficiary = d.Beneficiary,
                    PatientPhone = d.PatientPhone,
                    PatientCIN = d.PatientCIN,
                    Coordinator = d.Coordinator,
                    ResponsiblePerson = d.ResponsiblePerson,
                    ResponsiblePersonPhone = d.ResponsiblePersonPhone,
                    ResponsiblePersonCIN = d.ResponsiblePersonCIN,
                    Notes = d.Notes,
                    ReturnNotes = d.ReturnNotes,
                    DispatchDate = d.DispatchDate,
                    ReturnDate = d.ReturnDate,
                    PDFFilePath = d.PDFFilePath, // Explicitly include this
                    EquipmentReference = d.EquipmentReference
                })
                .ToListAsync();
        }

        

        public async Task<EquipmentDispatch> GetByIdAsync(int id)
        {
            return await _context.EquipmentDispatches
                .Include(d => d.MedicalEquipment)
                .FirstOrDefaultAsync(d => d.Id == id);
        }

        public async Task<EquipmentDispatch> CreateAsync(EquipmentDispatch dispatch, IFormFile pdfFile = null)
        {
            // Validate equipment is available
            var isEquipmentAvailable = !await _context.EquipmentDispatches
                .AnyAsync(d => d.MedicalEquipmentId == dispatch.MedicalEquipmentId && d.ReturnDate == null);

            if (!isEquipmentAvailable)
            {
                throw new InvalidOperationException("The equipment is currently dispatched and not available");
            }

            // Handle file upload
            if (pdfFile != null && pdfFile.Length > 0)
            {
                var filePath = await SaveFileAsync(pdfFile);
                dispatch.PDFFilePath = filePath;
            }

            // Set default value for ReturnNotes
            dispatch.ReturnNotes = string.Empty;
            
            dispatch.DispatchDate = DateTime.UtcNow;
            _context.EquipmentDispatches.Add(dispatch);
            await _context.SaveChangesAsync();
            return dispatch;
        }

        private async Task<string> SaveFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return null;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "dispatches");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/dispatches/{uniqueFileName}";
        }

        public async Task<EquipmentDispatch> UpdateAsync(EquipmentDispatch dispatch, IFormFile pdfFile = null)
        {
            var existingDispatch = await _context.EquipmentDispatches.FindAsync(dispatch.Id);
            if (existingDispatch == null)
            {
                throw new ArgumentException("Dispatch record not found");
            }

            // Update properties
            existingDispatch.MedicalEquipmentId = dispatch.MedicalEquipmentId;
            existingDispatch.Beneficiary = dispatch.Beneficiary;
            existingDispatch.PatientPhone = dispatch.PatientPhone;
            existingDispatch.PatientCIN = dispatch.PatientCIN;
            existingDispatch.Coordinator = dispatch.Coordinator;
            existingDispatch.ResponsiblePerson = dispatch.ResponsiblePerson;
            existingDispatch.ResponsiblePersonPhone = dispatch.ResponsiblePersonPhone;
            existingDispatch.ResponsiblePersonCIN = dispatch.ResponsiblePersonCIN;
            existingDispatch.Notes = dispatch.Notes;
            existingDispatch.EquipmentReference = dispatch.EquipmentReference;
            existingDispatch.DispatchDate = dispatch.DispatchDate;
            existingDispatch.UpdatedBy = dispatch.UpdatedBy;
            existingDispatch.UpdatedAt = DateTime.UtcNow;

            // Handle file upload if provided
            if (pdfFile != null && pdfFile.Length > 0)
            {
                var filePath = await SaveFileAsync(pdfFile);
                existingDispatch.PDFFilePath = filePath;
            }

            _context.Entry(existingDispatch).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return existingDispatch;
        }

        public async Task<EquipmentDispatch> MarkAsReturnedAsync(int id, DateTime returnDate, string returnNotes, string updatedBy = null)
        {
            var dispatch = await _context.EquipmentDispatches.FindAsync(id);
            if (dispatch == null)
            {
                return null;
            }

            // Update the return information
            dispatch.ReturnDate = returnDate;
            dispatch.ReturnNotes = returnNotes;
            dispatch.UpdatedBy = updatedBy;
            dispatch.UpdatedAt = DateTime.UtcNow;

            // Update the associated equipment status if needed
            var equipment = await _context.MedicalEquipments.FindAsync(dispatch.MedicalEquipmentId);
            if (equipment != null)
            {
                equipment.Status = "Available";
                equipment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return dispatch;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var dispatch = await _context.EquipmentDispatches.FindAsync(id);
            if (dispatch == null)
            {
                return false;
            }

            _context.EquipmentDispatches.Remove(dispatch);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<EquipmentDispatch>> GetByEquipmentIdAsync(int equipmentId)
        {
            return await _context.EquipmentDispatches
                .Include(d => d.MedicalEquipment)
                .Where(d => d.MedicalEquipmentId == equipmentId)
                .OrderByDescending(d => d.DispatchDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<EquipmentDispatch>> SearchAsync(string searchTerm)
        {
            return await _context.EquipmentDispatches
                .Include(d => d.MedicalEquipment)
                .Where(d =>
                    d.Beneficiary.Contains(searchTerm) ||
                    d.Coordinator.Contains(searchTerm) ||
                    d.Notes.Contains(searchTerm) ||
                    d.MedicalEquipment.Reference.Contains(searchTerm))
                .OrderByDescending(d => d.DispatchDate)
                .ToListAsync();
        }
        
        public async Task<IEnumerable<MedicalEquipment>> GetAvailableEquipmentAsync(string usageType = "للاعارة")
        {
            var dispatchedEquipmentIds = await _context.EquipmentDispatches
                .Where(d => d.ReturnDate == null)
                .Select(d => d.MedicalEquipmentId)
                .Distinct()
                .ToListAsync();

            var query = _context.MedicalEquipments
                .Where(e => !dispatchedEquipmentIds.Contains(e.Id));

            // Filter by usage type if provided
            if (!string.IsNullOrEmpty(usageType))
            {
                query = query.Where(e => e.Usage == usageType);
            }

            return await query
                .OrderBy(e => e.Category)
                .ThenBy(e => e.Reference)
                .ToListAsync();
        }
    }
}