using System.ComponentModel.DataAnnotations;

namespace api.Models;

public sealed class PlayerResource
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string ResourceId { get; set; } = string.Empty;

    public double Quantity { get; set; }
}
