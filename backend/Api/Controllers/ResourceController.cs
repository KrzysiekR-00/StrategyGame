using Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResourceController : AuthorizedApiController
{
    private readonly IResourceService _resourceService;

    public ResourceController(IResourceService resourceService)
    {
        _resourceService = resourceService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMyResources()
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var resources = await _resourceService.GetMyResourcesAsync(userId);
        return Ok(resources);
    }
}
