using Application.Abstractions;
using Application.Models;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Services;

public sealed class UserService : IUserService
{
    private readonly UserManager<IdentityUser> _userManager;

    public UserService(UserManager<IdentityUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<CurrentUserResult?> GetCurrentUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return null;
        }

        return new CurrentUserResult(user.Id, user.UserName ?? string.Empty);
    }
}
