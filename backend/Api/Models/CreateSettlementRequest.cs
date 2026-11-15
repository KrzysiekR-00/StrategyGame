using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public sealed class CreateSettlementRequest
{
    [StringLength(100, MinimumLength = 1)]
    public string? Name { get; set; }

    [Range(1, int.MaxValue)]
    public int Level { get; set; } = 1;
}
