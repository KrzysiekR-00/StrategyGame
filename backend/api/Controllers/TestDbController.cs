using api.Data;
using api.Models;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestDbController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestDbController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("create")]
    public async Task<ActionResult<object>> Create()
    {
        //var test = _db.TestRecords.ToArray();

        var rec = new TestRecord { CreatedAt = DateTime.UtcNow };
        _db.TestRecords.Add(rec);
        await _db.SaveChangesAsync();
        return Ok(new { id = rec.Id });
    }
}
