using System.Security.Claims;
using api.Data;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettlementController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser> _userManager;

    public SettlementController(AppDbContext db, UserManager<IdentityUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMySettlements()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
        }

        var settlements = await _db.Settlements
            .Where(settlement => settlement.OwnerUserId == userId)
            .OrderBy(settlement => settlement.FoundedAt)
            .Select(settlement => new
            {
                id = settlement.Id,
                name = settlement.Name,
                foundedAt = settlement.FoundedAt,
                level = settlement.Level,
            })
            .ToListAsync();

        return Ok(new { items = settlements });
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] CreateSettlementRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak praw do wykonania tej operacji." });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "Użytkownik nie został znaleziony." });
        }

        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            name = $"Osada {await _db.Settlements.CountAsync(s => s.OwnerUserId == userId) + 1}";
        }

        var level = request.Level < 1 ? 1 : request.Level;

        var settlement = new Settlement
        {
            Name = name,
            OwnerUserId = userId,
            FoundedAt = DateTime.UtcNow,
            Level = level,
        };

        _db.Settlements.Add(settlement);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = settlement.Id,
            name = settlement.Name,
            foundedAt = settlement.FoundedAt,
            level = settlement.Level,
            message = "Osada została utworzona pomyślnie.",
        });
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
    }
}
