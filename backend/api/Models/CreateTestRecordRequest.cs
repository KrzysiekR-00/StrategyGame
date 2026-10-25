using System.ComponentModel.DataAnnotations;

namespace api.Models;

public sealed class CreateTestRecordRequest
{
    [Required]
    [StringLength(500, MinimumLength = 1)]
    public string Text { get; set; } = string.Empty;
}
