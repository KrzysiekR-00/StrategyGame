using System;
using System.ComponentModel.DataAnnotations;

namespace api.Models;

public class TestRecord
{
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
