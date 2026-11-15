using Api.Models;
using Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BuildingController : AuthorizedApiController
{
    private readonly IBuildingService _buildingService;

    public BuildingController(IBuildingService buildingService)
    {
        _buildingService = buildingService;
    }

    [HttpGet("definitions")]
    public ActionResult<object> GetDefinitions()
    {
        return Ok(_buildingService.GetDefinitions());
    }

    [HttpGet("settlement/{settlementId:int}")]
    public async Task<ActionResult<object>> GetBySettlement(int settlementId)
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var settlement = await _buildingService.GetBySettlementAsync(userId, settlementId);
        if (settlement is null)
        {
            return NotFound(new { message = "Osada nie została znaleziona." });
        }

        return Ok(new
        {
            settlementId = settlement.SettlementId,
            settlementName = settlement.SettlementName,
            settlementLevel = settlement.SettlementLevel,
            maxSlots = settlement.MaxSlots,
            occupiedSlots = settlement.OccupiedSlots,
            availableSlots = settlement.AvailableSlots,
            buildings = settlement.Buildings,
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<object>> Destroy(int id)
    {
        if (!TryGetUserId(out var userId))
        {
            return MissingUserId();
        }

        var building = await _buildingService.DestroyAsync(userId, id);
        if (building is null)
        {
            return NotFound(new { message = "Nie znaleziono budynku w twojej osadzie." });
        }

        return Ok(new
        {
            id = building.Id,
            buildingType = building.BuildingType,
            message = building.Message,
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> Build([FromBody] BuildSettlementBuildingRequest request)
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
            var createdBuilding = await _buildingService.BuildAsync(userId, request.SettlementId, request.BuildingType);
            if (createdBuilding is null)
            {
                return NotFound(new { message = "Nie możesz wznosić budynków w tej osadzie." });
            }

            return Ok(new
            {
                id = createdBuilding.Id,
                settlementId = createdBuilding.SettlementId,
                buildingType = createdBuilding.BuildingType,
                name = createdBuilding.Name,
                builtAt = createdBuilding.BuiltAt,
                message = createdBuilding.Message,
                maxSlots = createdBuilding.MaxSlots,
                occupiedSlots = createdBuilding.OccupiedSlots,
                availableSlots = createdBuilding.AvailableSlots,
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
