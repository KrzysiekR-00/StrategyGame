using System.ComponentModel.DataAnnotations;

namespace api.Models;

public sealed class SettlementBuilding
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SettlementId { get; set; }

    [Required]
    [StringLength(50)]
    public string BuildingType { get; set; } = string.Empty;

    public DateTime BuiltAt { get; set; } = DateTime.UtcNow;

    public Settlement? Settlement { get; set; }
}
