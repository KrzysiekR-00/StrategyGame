using Api.Models;
using Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettlementController : AuthorizedApiController
{
    private readonly ISettlementService _settlementService;

    public SettlementController(ISettlementService settlementService)
    {
        _settlementService = settlementService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<object>> GetMySettlements()
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var settlements = await _settlementService.GetMySettlementsAsync(userId);
        return Ok(new { items = settlements });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> GetById(int id)
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var settlement = await _settlementService.GetByIdAsync(userId, id);
        if (settlement is null)
        {
            return NotFound(new { message = "Osada nie została znaleziona." });
        }

        return Ok(new
        {
            id = settlement.Id,
            name = settlement.Name,
            foundedAt = settlement.FoundedAt,
            level = settlement.Level,
            maxSlots = settlement.MaxSlots,
            occupiedSlots = settlement.OccupiedSlots,
            availableSlots = settlement.AvailableSlots,
            buildings = settlement.Buildings,
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> Create([FromBody] CreateSettlementRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        try
        {
            var settlement = await _settlementService.CreateAsync(userId, request.Name, request.Level);
            return Ok(new
            {
                id = settlement.Id,
                name = settlement.Name,
                foundedAt = settlement.FoundedAt,
                level = settlement.Level,
                message = settlement.Message,
            });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
