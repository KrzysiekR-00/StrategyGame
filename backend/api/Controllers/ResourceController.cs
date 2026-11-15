using Domain.Models;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResourceController : AuthorizedApiController
{
    private readonly AppDbContext _db;

    public ResourceController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMyResources()
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
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
}
