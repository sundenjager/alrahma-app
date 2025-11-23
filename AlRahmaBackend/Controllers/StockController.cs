using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AlRahmaBackend.Data;
using AlRahmaBackend.Models;
using AlRahmaBackend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace AlRahmaBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class StocksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<StocksController> _logger;

        public StocksController(ApplicationDbContext context, ILogger<StocksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/stocks
        [HttpGet]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<StockDto>>> GetStocks([FromQuery] StockFilterDto filter)
        {
            try
            {
                _logger.LogInformation("Fetching stocks with filters by user {UserId}", User.Identity?.Name);

                // Handle null filter
                filter = filter ?? new StockFilterDto();
                
                var query = _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .ThenInclude(sc => sc.SuppliesCategory)
                    .AsNoTracking() // Read-only for security
                    .AsQueryable();

                // Apply filters - handle null values properly
                if (filter.CategoryId.HasValue && filter.CategoryId.Value > 0)
                {
                    query = query.Where(s => s.SuppliesSubCategory.SuppliesCategoryId == filter.CategoryId.Value);
                }

                if (filter.SubCategoryId.HasValue && filter.SubCategoryId.Value > 0)
                {
                    query = query.Where(s => s.SuppliesSubCategoryId == filter.SubCategoryId.Value);
                }

                // Handle null or empty search term
                if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
                {
                    var searchTerm = filter.SearchTerm.Trim();
                    query = query.Where(s => 
                        s.SuppliesSubCategory.Name.Contains(searchTerm) ||
                        s.SuppliesSubCategory.SuppliesCategory.Name.Contains(searchTerm));
                }

                // Apply status filter with default
                var status = string.IsNullOrEmpty(filter.Status) ? "all" : filter.Status.ToLower();
                if (status != "all")
                {
                    switch (status)
                    {
                        case "low":
                            query = query.Where(s => s.Quantity > 0 && s.Quantity < 10);
                            break;
                        case "outofstock":
                            query = query.Where(s => s.Quantity == 0);
                            break;
                        case "available":
                            query = query.Where(s => s.Quantity >= 10);
                            break;
                        default:
                            _logger.LogWarning("Invalid status filter value: {Status} used by user {UserId}", 
                                filter.Status, User.Identity?.Name);
                            break;
                    }
                }

                var stocks = await query
                    .Select(s => new StockDto
                    {
                        Id = s.Id,
                        SuppliesSubCategoryId = s.SuppliesSubCategoryId,
                        SubCategoryName = s.SuppliesSubCategory.Name,
                        CategoryName = s.SuppliesSubCategory.SuppliesCategory.Name,
                        Quantity = s.Quantity,
                        TotalValue = s.TotalValue,
                        LastUpdated = s.LastUpdated,
                        Status = s.Quantity == 0 ? "OutOfStock" : 
                                s.Quantity < 10 ? "Low" : "Available"
                    })
                    .OrderBy(s => s.SubCategoryName)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} stocks for user {UserId}", stocks.Count, User.Identity?.Name);
                return Ok(stocks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stocks by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving stocks" });
            }
        }

        // GET: api/stocks/summary
        [HttpGet("summary")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<StockSummaryDto>> GetStockSummary()
        {
            try
            {
                _logger.LogInformation("Fetching stock summary by user {UserId}", User.Identity?.Name);

                var stocks = await _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .AsNoTracking()
                    .ToListAsync();

                var summary = new StockSummaryDto
                {
                    TotalItems = stocks.Sum(s => s.Quantity),
                    TotalValue = stocks.Sum(s => s.TotalValue),
                    TotalCategories = await _context.SuppliesCategories.CountAsync(),
                    TotalSubCategories = await _context.SuppliesSubCategories.CountAsync(),
                    LowStockItems = stocks.Count(s => s.Quantity > 0 && s.Quantity < 10),
                    OutOfStockItems = stocks.Count(s => s.Quantity == 0),
                    AvailableItems = stocks.Count(s => s.Quantity >= 10)
                };

                _logger.LogInformation("Stock summary retrieved by user {UserId}", User.Identity?.Name);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stock summary by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving stock summary" });
            }
        }

                // GET: api/stocks/5/transactions
        [HttpGet("{id}/transactions")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<StockTransactionDto>>> GetStockTransactions(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid stock ID" });
                }

                _logger.LogInformation("Fetching transactions for stock ID {StockId} by user {UserId}", 
                    id, User.Identity?.Name);

                // Verify stock exists
                var stockExists = await _context.Stocks.AnyAsync(s => s.Id == id);
                if (!stockExists)
                {
                    _logger.LogWarning("Stock with ID {StockId} not found, requested by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Stock not found" });
                }

                var transactions = await _context.StockTransactions
                    .Include(t => t.Stock)
                    .Include(t => t.Supplies)
                    .Where(t => t.StockId == id)
                    .OrderByDescending(t => t.TransactionDate)
                    .AsNoTracking()
                    .Select(t => new StockTransactionDto
                    {
                        Id = t.Id,
                        StockId = t.StockId,
                        QuantityChange = t.QuantityChange,
                        ValueChange = t.ValueChange,
                        TransactionType = t.TransactionType,
                        Reference = t.Reference,
                        Description = t.Description,
                        TransactionDate = t.TransactionDate,
                        SuppliesId = t.SuppliesId,
                        SuppliesReference = t.Supplies != null ? t.Supplies.Reference : null,
                        CreatedBy = t.CreatedBy
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} transactions for stock ID {StockId} by user {UserId}", 
                    transactions.Count, id, User.Identity?.Name);

                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching transactions for stock ID {StockId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving stock transactions" });
            }
        }

        // GET: api/stocks/5
        [HttpGet("{id}")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<StockDto>> GetStock(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid stock ID" });
                }

                _logger.LogInformation("Fetching stock with ID {StockId} by user {UserId}", id, User.Identity?.Name);

                var stock = await _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .ThenInclude(sc => sc.SuppliesCategory)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (stock == null)
                {
                    _logger.LogWarning("Stock with ID {StockId} not found, requested by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Stock not found" });
                }

                var stockDto = new StockDto
                {
                    Id = stock.Id,
                    SuppliesSubCategoryId = stock.SuppliesSubCategoryId,
                    SubCategoryName = stock.SuppliesSubCategory.Name,
                    CategoryName = stock.SuppliesSubCategory.SuppliesCategory.Name,
                    Quantity = stock.Quantity,
                    TotalValue = stock.TotalValue,
                    LastUpdated = stock.LastUpdated,
                    Status = stock.Quantity == 0 ? "OutOfStock" : 
                            stock.Quantity < 10 ? "Low" : "Available"
                };

                return Ok(stockDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching stock with ID {StockId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving the stock" });
            }
        }

        // PUT: api/stocks/5/adjust
        [HttpPut("{id}/adjust")]
        [Authorize(Policy = "RequireAdminRole")] // Only SuperAdmin and Admin can adjust stock
        public async Task<IActionResult> AdjustStock(int id, [FromBody] StockAdjustmentDto adjustment)
        {
            try
            {
                if (id <= 0)
                {
                    return BadRequest(new { Error = "Invalid stock ID" });
                }

                if (adjustment == null)
                {
                    return BadRequest(new { Error = "Adjustment data is required" });
                }

                // Validate adjustment
                if (adjustment.QuantityChange == 0)
                {
                    return BadRequest(new { Error = "Quantity change cannot be zero" });
                }

                _logger.LogInformation("Adjusting stock ID {StockId} by {QuantityChange} by user {UserId}", 
                    id, adjustment.QuantityChange, User.Identity?.Name);

                var stock = await _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (stock == null)
                {
                    _logger.LogWarning("Stock with ID {StockId} not found for adjustment by user {UserId}", 
                        id, User.Identity?.Name);
                    return NotFound(new { Error = "Stock not found" });
                }

                // Check if adjustment would result in negative quantity
                if (stock.Quantity + adjustment.QuantityChange < 0)
                {
                    return BadRequest(new { Error = "Adjustment would result in negative stock quantity" });
                }

                // Update stock
                stock.Quantity += adjustment.QuantityChange;
                stock.LastUpdated = DateTime.UtcNow;
                
                // Recalculate total value if unit price is provided
                if (adjustment.UnitPrice.HasValue && adjustment.UnitPrice.Value > 0)
                {
                    stock.TotalValue = stock.Quantity * adjustment.UnitPrice.Value;
                }

                // Create transaction record
                var transaction = new StockTransaction
                {
                    StockId = id,
                    QuantityChange = adjustment.QuantityChange,
                    ValueChange = adjustment.UnitPrice.HasValue ? 
                        adjustment.QuantityChange * adjustment.UnitPrice.Value : 0,
                    TransactionType = adjustment.QuantityChange > 0 ? "IN" : "OUT",
                    Reference = adjustment.Reference,
                    Description = adjustment.Description,
                    TransactionDate = DateTime.UtcNow,
                    CreatedBy = User.Identity?.Name
                };

                _context.StockTransactions.Add(transaction);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Stock ID {StockId} adjusted by {QuantityChange} by user {UserId}", 
                    id, adjustment.QuantityChange, User.Identity?.Name);

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error adjusting stock ID {StockId} by user {UserId}", 
                    id, User.Identity?.Name);
                return StatusCode(500, new { Error = "A concurrency error occurred while adjusting the stock" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adjusting stock ID {StockId} by user {UserId}", id, User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while adjusting the stock" });
            }
        }

        // GET: api/stocks/low-stock
        [HttpGet("low-stock")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<StockDto>>> GetLowStockItems()
        {
            try
            {
                _logger.LogInformation("Fetching low stock items by user {UserId}", User.Identity?.Name);

                var lowStockItems = await _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .ThenInclude(sc => sc.SuppliesCategory)
                    .Where(s => s.Quantity > 0 && s.Quantity < 10)
                    .AsNoTracking()
                    .Select(s => new StockDto
                    {
                        Id = s.Id,
                        SuppliesSubCategoryId = s.SuppliesSubCategoryId,
                        SubCategoryName = s.SuppliesSubCategory.Name,
                        CategoryName = s.SuppliesSubCategory.SuppliesCategory.Name,
                        Quantity = s.Quantity,
                        TotalValue = s.TotalValue,
                        LastUpdated = s.LastUpdated,
                        Status = "Low"
                    })
                    .OrderBy(s => s.Quantity)
                    .ThenBy(s => s.SubCategoryName)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} low stock items for user {UserId}", 
                    lowStockItems.Count, User.Identity?.Name);

                return Ok(lowStockItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching low stock items by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving low stock items" });
            }
        }

        // GET: api/stocks/out-of-stock
        [HttpGet("out-of-stock")]
        [Authorize(Policy = "RequireUserRole")] // SuperAdmin, Admin, User can read
        public async Task<ActionResult<IEnumerable<StockDto>>> GetOutOfStockItems()
        {
            try
            {
                _logger.LogInformation("Fetching out-of-stock items by user {UserId}", User.Identity?.Name);

                var outOfStockItems = await _context.Stocks
                    .Include(s => s.SuppliesSubCategory)
                    .ThenInclude(sc => sc.SuppliesCategory)
                    .Where(s => s.Quantity == 0)
                    .AsNoTracking()
                    .Select(s => new StockDto
                    {
                        Id = s.Id,
                        SuppliesSubCategoryId = s.SuppliesSubCategoryId,
                        SubCategoryName = s.SuppliesSubCategory.Name,
                        CategoryName = s.SuppliesSubCategory.SuppliesCategory.Name,
                        Quantity = s.Quantity,
                        TotalValue = s.TotalValue,
                        LastUpdated = s.LastUpdated,
                        Status = "OutOfStock"
                    })
                    .OrderBy(s => s.SubCategoryName)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} out-of-stock items for user {UserId}", 
                    outOfStockItems.Count, User.Identity?.Name);

                return Ok(outOfStockItems);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching out-of-stock items by user {UserId}", User.Identity?.Name);
                return StatusCode(500, new { Error = "An error occurred while retrieving out-of-stock items" });
            }
        }
    }


}