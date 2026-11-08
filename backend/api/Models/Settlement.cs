using System.ComponentModel.DataAnnotations;

namespace api.Models;

public sealed class Settlement
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string OwnerUserId { get; set; } = string.Empty;

    public DateTime FoundedAt { get; set; } = DateTime.UtcNow;

    public int Level { get; set; } = 1;
}
