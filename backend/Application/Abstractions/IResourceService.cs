using Application.Models;

namespace Application.Abstractions;

public interface IResourceService
{
    Task<IReadOnlyList<ResourceSummaryResult>> GetMyResourcesAsync(string userId);
}
