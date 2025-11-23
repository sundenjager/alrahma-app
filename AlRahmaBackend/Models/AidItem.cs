using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlRahmaBackend.Models
{
    public class AidItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AidId { get; set; }
    public Aid Aid { get; set; } // Navigation property

    [Required]
    public int SuppliesSubCategoryId { get; set; }
    public SuppliesSubCategory SuppliesSubCategory { get; set; } // Navigation property

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [NotMapped]
    public decimal TotalValue => Quantity * (SuppliesSubCategory?.UnitPrice ?? 0);
}
}