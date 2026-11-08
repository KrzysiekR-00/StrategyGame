using System.Security.Claims;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    public UserController(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponse>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
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
