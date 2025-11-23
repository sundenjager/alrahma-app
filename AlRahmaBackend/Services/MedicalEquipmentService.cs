using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using Microsoft.EntityFrameworkCore;
 

namespace AlRahmaBackend.Services
{
    public class MedicalEquipmentService : IMedicalEquipmentService
    {
        private readonly ApplicationDbContext _context;
        

        public MedicalEquipmentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MedicalEquipment>> GetAllAsync(string category = "all", string search = "", int page = 1, int pageSize = 5)
        {
            IQueryable<MedicalEquipment> query = _context.MedicalEquipments
                .Include(e => e.Dispatches);

            if (category != "all")
                query = query.Where(e => e.Category == category);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(e => e.Reference.Contains(search) ||
                                        e.Category.Contains(search) ||
                                        e.Source.Contains(search) ||
                                        e.Usage.Contains(search));

            return await query
                .OrderBy(e => e.Reference)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<MedicalEquipment> GetByIdAsync(int id)
        {
            return await _context.MedicalEquipments
                .Include(e => e.Dispatches)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<MedicalEquipment> CreateAsync(MedicalEquipment equipment)
        {
            _context.MedicalEquipments.Add(equipment);
            await _context.SaveChangesAsync();
            return equipment;
        }

        public async Task UpdateAsync(int id, MedicalEquipment equipment)
        {
            _context.Entry(equipment).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var equipment = await _context.MedicalEquipments.FindAsync(id);
            _context.MedicalEquipments.Remove(equipment);
            await _context.SaveChangesAsync();
        }
    }
}