using Api.Models;
using Application.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var (success, token, errorMessage) = await _authService.RegisterAsync(request.Username, request.Password);
        if (!success)
        {
            ModelState.AddModelError("Register", errorMessage ?? "Nie udało się utworzyć konta.");
            return ValidationProblem(ModelState);
        }

        return StatusCode(StatusCodes.Status201Created, new
        {
            message = "Rejestracja zakończona pomyślnie.",
            token
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var (success, token, errorMessage) = await _authService.LoginAsync(request.Username, request.Password);
        if (!success)
        {
            return Unauthorized(new { message = errorMessage ?? "Nieprawidłowy login lub hasło." });
        }

        return Ok(new
        {
            message = "Zalogowano pomyślnie.",
            token
        });
    }
}
