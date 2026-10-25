using System.Security.Claims;
using api.Data;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestDbController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestDbController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("create")]
    public async Task<ActionResult<object>> Create([FromBody] CreateTestRecordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak praw do wykonania tej operacji." });
        }

        var text = request.Text.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return BadRequest(new { message = "Tekst nie może być pusty." });
        }

        var rec = new TestRecord
        {
            Text = text,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _db.TestRecords.Add(rec);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = rec.Id,
            message = "Rekord dodany pomyślnie.",
            text = rec.Text,
            createdByUserId = rec.CreatedByUserId
        });
    }
}
