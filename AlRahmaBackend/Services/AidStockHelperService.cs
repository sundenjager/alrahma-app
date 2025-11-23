using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public class AidStockHelperService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AidStockHelperService> _logger;

        public AidStockHelperService(ApplicationDbContext context, ILogger<AidStockHelperService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task UpdateStockFromAidAsync(int aidId)
        {
            try
            {
                // Check if stock has already been updated for this aid
                var existingTransactions = await _context.StockTransactions
                    .Where(st => st.AidId == aidId && st.TransactionType == "OUT")
                    .AnyAsync();

                if (existingTransactions)
                {
                    _logger.LogWarning($"Stock already updated for aid ID {aidId}. Skipping duplicate update.");
                    return;
                }

                var aid = await _context.Aids
                    .Include(a => a.Items)
                    .ThenInclude(i => i.SuppliesSubCategory)
                    .FirstOrDefaultAsync(a => a.Id == aidId);

                if (aid == null)
                {
                    _logger.LogWarning($"Aid with ID {aidId} not found for stock update");
                    return;
                }

                foreach (var item in aid.Items)
                {
                    var stock = await _context.Stocks
                        .FirstOrDefaultAsync(s => s.SuppliesSubCategoryId == item.SuppliesSubCategoryId);

                    if (stock == null)
                    {
                        _logger.LogWarning($"No stock found for subcategory ID {item.SuppliesSubCategoryId}");
                        continue;
                    }

                    if (stock.Quantity < item.Quantity)
                    {
                        throw new InvalidOperationException(
                            $"Not enough stock available for {item.SuppliesSubCategory.Name}. " +
                            $"Available: {stock.Quantity}, Requested: {item.Quantity}");
                    }

                    stock.Quantity -= item.Quantity;
                    stock.TotalValue -= item.Quantity * item.SuppliesSubCategory.UnitPrice;
                    stock.LastUpdated = DateTime.UtcNow;

                    var stockTransaction = new StockTransaction
                    {
                        StockId = stock.Id,
                        QuantityChange = -item.Quantity,
                        ValueChange = -item.Quantity * item.SuppliesSubCategory.UnitPrice,
                        TransactionType = "OUT",
                        Reference = aid.Reference,
                        Description = $"Aid distribution: {aid.Reference}",
                        TransactionDate = DateTime.UtcNow,
                        SuppliesId = null,
                        AidId = aid.Id
                    };
                    _context.StockTransactions.Add(stockTransaction);
                }

                // REMOVED: await _context.SaveChangesAsync(); - Let caller handle saving
                _logger.LogInformation($"Stock changes prepared for aid ID {aidId} (not saved yet)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error preparing stock update for aid ID {aidId}");
                throw;
            }
        }

        public async Task<bool> CheckStockAvailability(int suppliesSubCategoryId, int quantity)
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.SuppliesSubCategoryId == suppliesSubCategoryId);

            return stock != null && stock.Quantity >= quantity;
        }

        public async Task RevertStockFromAidAsync(int aidId)
        {
            try
            {
                var aid = await _context.Aids
                    .Include(a => a.Items)
                    .ThenInclude(i => i.SuppliesSubCategory)
                    .FirstOrDefaultAsync(a => a.Id == aidId);

                if (aid == null) return;

                foreach (var item in aid.Items)
                {
                    var stock = await _context.Stocks
                        .FirstOrDefaultAsync(s => s.SuppliesSubCategoryId == item.SuppliesSubCategoryId);

                    if (stock != null)
                    {
                        stock.Quantity += item.Quantity;
                        stock.TotalValue += item.Quantity * item.SuppliesSubCategory.UnitPrice;
                        stock.LastUpdated = DateTime.UtcNow;
                    }
                }

                _logger.LogInformation($"Stock revert prepared for aid ID {aidId} (not saved yet)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error preparing stock revert for aid ID {aidId}");
                throw;
            }
        }

        // NEW: Method to save changes (optional - can use context directly too)
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}