using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Abstractions;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager,
        AppDbContext db,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _db = db;
        _configuration = configuration;
    }

    public async Task<(bool Success, string? Token, string? ErrorMessage)> RegisterAsync(string username, string password)
    {
        var normalizedUsername = username.Trim();
        var user = new IdentityUser
        {
            UserName = normalizedUsername,
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return (false, null, result.Errors.FirstOrDefault()?.Description ?? "Nie udało się utworzyć konta.");
        }

        var starterSettlement = new Domain.Models.Settlement
        {
            Name = "Osada 1",
            OwnerUserId = user.Id,
            FoundedAt = DateTime.UtcNow,
            Level = 1,
        };

        _db.Settlements.Add(starterSettlement);

        foreach (var resource in Domain.Models.ResourceCatalog.All)
        {
            _db.PlayerResources.Add(new Domain.Models.PlayerResource
            {
                UserId = user.Id,
                ResourceId = resource.Code,
                Quantity = 0,
            });
        }

        await _db.SaveChangesAsync();

        return (true, GenerateJwtToken(user), null);
    }

    public async Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(string username, string password)
    {
        var normalizedUsername = username.Trim();
        var user = await _userManager.FindByNameAsync(normalizedUsername);
        if (user is null)
        {
            return (false, null, "Nieprawidłowy login lub hasło.");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, password, false);
        if (!result.Succeeded)
        {
            return (false, null, "Nieprawidłowy login lub hasło.");
        }

        return (true, GenerateJwtToken(user), null);
    }

    private string GenerateJwtToken(IdentityUser user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "StrategyGameApi";
        var audience = _configuration["Jwt:Audience"] ?? "StrategyGameClient";

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
