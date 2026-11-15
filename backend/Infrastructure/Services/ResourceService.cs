using Application.Abstractions;
using Application.Models;
using Domain.Models;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public sealed class ResourceService : IResourceService
{
    private readonly AppDbContext _db;

    public ResourceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ResourceSummaryResult>> GetMyResourcesAsync(string userId)
    {
        var existingResources = await _db.PlayerResources
            .Where(resource => resource.UserId == userId)
            .ToDictionaryAsync(resource => resource.ResourceId, resource => resource.Quantity, StringComparer.OrdinalIgnoreCase);

        return ResourceCatalog.All
            .Select(resource => new ResourceSummaryResult(
                resource.Code,
                resource.Name,
                existingResources.TryGetValue(resource.Code, out var quantity) ? quantity : 0))
            .OrderBy(resource => resource.ResourceName)
            .ToList();
    }
}
