using System.Security.Claims;
using api.Data;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMyRecords()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak praw do wykonania tej operacji." });
        }

        var records = await _db.TestRecords
            .Where(record => record.CreatedByUserId == userId)
            .Join(
                _db.Users,
                record => record.CreatedByUserId,
                user => user.Id,
                (record, user) => new
                {
                    id = record.Id,
                    text = record.Text,
                    createdByUserId = record.CreatedByUserId,
                    createdByUsername = user.UserName ?? string.Empty,
                    createdAt = record.CreatedAt
                })
            .OrderByDescending(record => record.createdAt)
            .ToListAsync();

        return Ok(new { items = records });
    }

    [HttpPost]
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

        var user = await _db.Users.FindAsync(userId);

        return Ok(new
        {
            id = rec.Id,
            message = "Rekord dodany pomyślnie.",
            text = rec.Text,
            createdByUserId = rec.CreatedByUserId,
            createdByUsername = user?.UserName ?? string.Empty,
            createdAt = rec.CreatedAt
        });
    }
}
