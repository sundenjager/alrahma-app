using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;

namespace AlRahmaBackend.Services
{
    public class StockHelperService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StockHelperService> _logger;

        public StockHelperService(ApplicationDbContext context, ILogger<StockHelperService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task UpdateStockFromSupplyAsync(int suppliesId)
        {
            try
            {
                // COMPLETELY REMOVE TRANSACTION HANDLING
                var supply = await _context.Supplies
                    .Include(s => s.Items)
                    .ThenInclude(i => i.SuppliesSubCategory)
                    .FirstOrDefaultAsync(s => s.Id == suppliesId);

                if (supply == null) 
                {
                    _logger.LogWarning($"Supply with ID {suppliesId} not found for stock update");
                    return;
                }

                foreach (var item in supply.Items)
                {
                    var stock = await _context.Stocks
                        .FirstOrDefaultAsync(s => s.SuppliesSubCategoryId == item.SuppliesSubCategoryId);

                    if (stock == null)
                    {
                        stock = new Stock
                        {
                            SuppliesSubCategoryId = item.SuppliesSubCategoryId,
                            Quantity = 0,
                            TotalValue = 0,
                            LastUpdated = DateTime.UtcNow
                        };
                        _context.Stocks.Add(stock);
                        await _context.SaveChangesAsync(); // Save to get the ID
                    }

                    // Update stock
                    stock.Quantity += item.Quantity;
                    stock.TotalValue += item.Quantity * item.SuppliesSubCategory.UnitPrice;
                    stock.LastUpdated = DateTime.UtcNow;

                    // Create transaction record
                    var stockTransaction = new StockTransaction
                    {
                        StockId = stock.Id,
                        QuantityChange = item.Quantity,
                        ValueChange = item.Quantity * item.SuppliesSubCategory.UnitPrice,
                        TransactionType = "IN",
                        Reference = supply.Reference,
                        Description = $"Supply entry: {supply.Reference}",
                        TransactionDate = DateTime.UtcNow,
                        SuppliesId = supply.Id
                    };
                    _context.StockTransactions.Add(stockTransaction);
                }

                // JUST SaveChanges - NO transaction commit
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Stock updated successfully for supply ID {suppliesId}");
            }
            catch (Exception ex)
            {
                // NO rollback - let the caller handle it
                _logger.LogError(ex, $"Error updating stock from supply ID {suppliesId}");
                throw;
            }
        }

        public async Task RevertStockFromSupplyAsync(int suppliesId)
{
    try
    {
        // COMPLETELY REMOVE TRANSACTION HANDLING
        var supply = await _context.Supplies
            .Include(s => s.Items)
            .ThenInclude(i => i.SuppliesSubCategory)
            .FirstOrDefaultAsync(s => s.Id == suppliesId);

        if (supply == null) return;

        foreach (var item in supply.Items)
        {
            var stock = await _context.Stocks
                .FirstOrDefaultAsync(s => s.SuppliesSubCategoryId == item.SuppliesSubCategoryId);

            if (stock != null)
            {
                // Revert stock
                stock.Quantity -= item.Quantity;
                stock.TotalValue -= item.Quantity * item.SuppliesSubCategory.UnitPrice;
                stock.LastUpdated = DateTime.UtcNow;

                // Create reversal transaction
                var stockTransaction = new StockTransaction
                {
                    StockId = stock.Id,
                    QuantityChange = -item.Quantity,
                    ValueChange = -item.Quantity * item.SuppliesSubCategory.UnitPrice,
                    TransactionType = "OUT",
                    Reference = supply.Reference,
                    Description = $"Supply reversal: {supply.Reference}",
                    TransactionDate = DateTime.UtcNow,
                    SuppliesId = supply.Id
                };
                _context.StockTransactions.Add(stockTransaction);
            }
        }

        // JUST SaveChanges - NO transaction commit
        await _context.SaveChangesAsync();
    }
    catch (Exception ex)
    {
        // NO rollback - let the caller handle it
        _logger.LogError(ex, $"Error reverting stock from supply ID {suppliesId}");
        throw;
    }
}
    }
}