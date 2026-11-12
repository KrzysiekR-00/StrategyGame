using api.Data;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BuildingController : ControllerBase
{
    private readonly AppDbContext _db;

    public BuildingController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("definitions")]
    public ActionResult<object> GetDefinitions()
    {
        return Ok(BuildingCatalog.All
            .Select(building => new
            {
                code = building.Code,
                name = building.Name,
                inputResources = building.InputResources.Select(resource => new
                {
                    resourceCode = resource.ResourceCode,
                    quantity = resource.Quantity,
                }).ToList(),
                outputResources = building.OutputResources.Select(resource => new
                {
                    resourceCode = resource.ResourceCode,
                    quantity = resource.Quantity,
                }).ToList(),
            })
            .ToList());
    }

    [HttpGet("settlement/{settlementId:int}")]
    public async Task<ActionResult<object>> GetBySettlement(int settlementId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
        }

        var settlement = await _db.Settlements
            .FirstOrDefaultAsync(item => item.Id == settlementId && item.OwnerUserId == userId);

        if (settlement is null)
        {
            return NotFound(new { message = "Osada nie została znaleziona." });
        }

        var buildings = await _db.SettlementBuildings
            .Where(item => item.SettlementId == settlementId)
            .OrderBy(item => item.BuiltAt)
            .ToListAsync();

        var maxSlots = SettlementLevelCatalog.GetBuildingSlotsForLevel(settlement.Level);
        var buildingLookup = BuildingCatalog.All
            .ToDictionary(item => item.Code, item => item.Name, StringComparer.OrdinalIgnoreCase);

        return Ok(new
        {
            settlementId = settlement.Id,
            settlementName = settlement.Name,
            settlementLevel = settlement.Level,
            maxSlots,
            occupiedSlots = buildings.Count,
            availableSlots = maxSlots - buildings.Count,
            buildings = buildings.Select(building => new
            {
                id = building.Id,
                buildingType = building.BuildingType,
                name = buildingLookup.TryGetValue(building.BuildingType, out var buildingName)
                    ? buildingName
                    : building.BuildingType,
                builtAt = building.BuiltAt,
            }).ToList(),
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<object>> Destroy(int id)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
        }

        var building = await _db.SettlementBuildings
            .Include(item => item.Settlement)
            .FirstOrDefaultAsync(item => item.Id == id && item.Settlement != null && item.Settlement.OwnerUserId == userId);

        if (building is null)
        {
            return NotFound(new { message = "Nie znaleziono budynku w twojej osadzie." });
        }

        var buildingType = building.BuildingType;
        _db.SettlementBuildings.Remove(building);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id,
            buildingType,
            message = "Budynek został zburzony.",
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> Build([FromBody] BuildSettlementBuildingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Brak danych użytkownika w tokenie." });
        }

        var settlement = await _db.Settlements
            .FirstOrDefaultAsync(item => item.Id == request.SettlementId && item.OwnerUserId == userId);

        if (settlement is null)
        {
            return NotFound(new { message = "Nie możesz wznosić budynków w tej osadzie." });
        }

        var buildingDefinition = BuildingCatalog.All
            .FirstOrDefault(item => string.Equals(item.Code, request.BuildingType, StringComparison.OrdinalIgnoreCase));

        if (buildingDefinition is null)
        {
            return BadRequest(new { message = "Wybrany typ budynku jest niepoprawny." });
        }

        var maxSlots = SettlementLevelCatalog.GetBuildingSlotsForLevel(settlement.Level);
        var occupiedSlots = await _db.SettlementBuildings.CountAsync(item => item.SettlementId == settlement.Id);

        if (maxSlots <= 0)
        {
            return BadRequest(new { message = "Ta osada nie ma skonfigurowanych slotów budynków." });
        }

        if (occupiedSlots >= maxSlots)
        {
            return BadRequest(new
            {
                message = $"Brak wolnych slotów w osadzie. Zajęte: {occupiedSlots}/{maxSlots}.",
                maxSlots,
                occupiedSlots,
                availableSlots = maxSlots - occupiedSlots,
            });
        }

        var createdBuilding = new SettlementBuilding
        {
            SettlementId = settlement.Id,
            BuildingType = buildingDefinition.Code,
            BuiltAt = DateTime.UtcNow,
        };

        _db.SettlementBuildings.Add(createdBuilding);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = createdBuilding.Id,
            settlementId = settlement.Id,
            buildingType = createdBuilding.BuildingType,
            name = buildingDefinition.Name,
            builtAt = createdBuilding.BuiltAt,
            message = "Budynek został wybudowany.",
            maxSlots,
            occupiedSlots = occupiedSlots + 1,
            availableSlots = maxSlots - (occupiedSlots + 1),
        });
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
    }
}
