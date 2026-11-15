using Api.Models;
using Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : AuthorizedApiController
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponse>> GetCurrentUser()
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var user = await _userService.GetCurrentUserAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "Użytkownik nie został znaleziony." });
        }

        return Ok(new CurrentUserResponse
        {
            Id = user.Id,
            Username = user.Username,
        });
    }
}
