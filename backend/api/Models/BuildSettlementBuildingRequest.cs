using System.ComponentModel.DataAnnotations;

namespace api.Models;

public sealed class BuildSettlementBuildingRequest
{
    [Required]
    public int SettlementId { get; set; }

    [Required]
    [StringLength(50)]
    public string BuildingType { get; set; } = string.Empty;
}
