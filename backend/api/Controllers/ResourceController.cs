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
public class ResourceController : ControllerBase
{
    private readonly AppDbContext _db;

    public ResourceController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMyResources()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
        }

        var existingResources = await _db.PlayerResources
            .Where(resource => resource.UserId == userId)
            .ToDictionaryAsync(resource => resource.ResourceId, resource => resource.Quantity, StringComparer.OrdinalIgnoreCase);

        var resources = ResourceCatalog.All
            .Select(resource => new
            {
                resourceCode = resource.Code,
                resourceName = resource.Name,
                quantity = existingResources.TryGetValue(resource.Code, out var quantity) ? quantity : 0,
            })
            .OrderBy(resource => resource.resourceName)
            .ToList();

        return Ok(resources);
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
    }
}
