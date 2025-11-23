    using AlRahmaBackend.Data;
    using AlRahmaBackend.Models;
    using Microsoft.EntityFrameworkCore;

    namespace AlRahmaBackend.Services
    {
        public class EquipmentCategoryService : IEquipmentCategoryService
        {
            private readonly ApplicationDbContext _context;

            public EquipmentCategoryService(ApplicationDbContext context)
            {
                _context = context;
            }

            public async Task<IEnumerable<EquipmentCategory>> GetAllAsync()
            {
                return await _context.EquipmentCategories.ToListAsync();
            }

            public async Task<EquipmentCategory> CreateAsync(EquipmentCategory category)
            {
                if (await _context.EquipmentCategories.AnyAsync(c => c.Name == category.Name))
                    throw new Exception("Category already exists");

                _context.EquipmentCategories.Add(category);
                await _context.SaveChangesAsync();
                return category;
            }

            public async Task DeleteAsync(int id)
            {
                var category = await _context.EquipmentCategories.FindAsync(id);
                if (category == null)
                    throw new Exception("Category not found");

                if (await _context.MedicalEquipments.AnyAsync(e => e.Category == category.Name))
                    throw new Exception("Cannot delete category in use by equipment");

                _context.EquipmentCategories.Remove(category);
                await _context.SaveChangesAsync();
            }
        }
    }