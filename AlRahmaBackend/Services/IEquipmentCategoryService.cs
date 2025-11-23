using System.Collections.Generic;
using System.Threading.Tasks;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public interface IEquipmentCategoryService
    {
        Task<IEnumerable<EquipmentCategory>> GetAllAsync();
        Task<EquipmentCategory> CreateAsync(EquipmentCategory category);
        Task DeleteAsync(int id);
    }
}