using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    public record GreetingDto(string Message, DateTimeOffset Timestamp, string Source);

    [HttpGet("greeting")]
    public ActionResult<GreetingDto> GetGreeting()
    {
        var dto = new GreetingDto(
            Message: "Hello from API!",
            Timestamp: DateTimeOffset.UtcNow,
            Source: "ASP.NET Core"
        );

        return Ok(dto);
    }
}
