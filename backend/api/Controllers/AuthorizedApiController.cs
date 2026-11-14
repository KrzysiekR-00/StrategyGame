using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

public abstract class AuthorizedApiController : ControllerBase
{
    protected string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
    }

    protected bool TryGetUserId(out string userId)
    {
        var currentUserId = GetCurrentUserId();

        if (string.IsNullOrWhiteSpace(currentUserId))
        {
            userId = string.Empty;
            return false;
        }

        userId = currentUserId;
        return true;
    }

    protected ActionResult MissingUserId()
    {
        return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
    }

    protected string? GetCurrentUserIdOrUnauthorized()
    {
        return TryGetUserId(out var userId) ? userId : null;
    }

    protected ActionResult UnauthorizedCurrentUser()
    {
        return MissingUserId();
    }
}
