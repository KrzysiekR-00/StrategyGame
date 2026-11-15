using Api.Models;
using Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : AuthorizedApiController
{
    private readonly UserManager<IdentityUser> _userManager;

    public UserController(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponse>> GetCurrentUser()
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return NotFound(new { message = "Użytkownik nie został znaleziony." });
        }

        return Ok(new CurrentUserResponse
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
        });
    }
}
