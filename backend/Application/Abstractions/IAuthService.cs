namespace Application.Abstractions;

public interface IAuthService
{
    Task<(bool Success, string? Token, string? ErrorMessage)> RegisterAsync(string username, string password);
    Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(string username, string password);
}
