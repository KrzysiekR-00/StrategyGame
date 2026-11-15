using Application.Models;

namespace Application.Abstractions;

public interface IUserService
{
    Task<CurrentUserResult?> GetCurrentUserAsync(string userId);
}
