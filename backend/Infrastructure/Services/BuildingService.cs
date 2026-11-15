using Application.Abstractions;
using Application.Models;
using Domain.Models;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public sealed class BuildingService : IBuildingService
{
    private readonly AppDbContext _db;

    public BuildingService(AppDbContext db)
    {
        _db = db;
    }

    public IReadOnlyList<BuildingDefinitionResult> GetDefinitions()
    {
        return BuildingCatalog.All
            .Select(building => new BuildingDefinitionResult(
                building.Code,
                building.Name,
                building.InputResources.Select(resource => new ResourceCostResult(resource.ResourceCode, resource.Quantity)).ToList(),
                building.OutputResources.Select(resource => new ResourceCostResult(resource.ResourceCode, resource.Quantity)).ToList()))
            .ToList();
    }

    public async Task<SettlementBuildingsResult?> GetBySettlementAsync(string userId, int settlementId)
    {
        var settlement = await _db.Settlements
            .FirstOrDefaultAsync(item => item.Id == settlementId && item.OwnerUserId == userId);

        if (settlement is null)
        {
            return null;
        }

        var buildings = await _db.SettlementBuildings
            .Where(item => item.SettlementId == settlementId)
            .OrderBy(item => item.BuiltAt)
            .ToListAsync();

        var buildingLookup = BuildingCatalog.All
            .ToDictionary(item => item.Code, item => item.Name, StringComparer.OrdinalIgnoreCase);

        var maxSlots = SettlementLevelCatalog.GetBuildingSlotsForLevel(settlement.Level);
        var occupiedSlots = buildings.Count;

        return new SettlementBuildingsResult(
            settlement.Id,
            settlement.Name,
            settlement.Level,
            maxSlots,
            occupiedSlots,
            maxSlots - occupiedSlots,
            buildings.Select(building => new BuildingSummaryResult(
                building.Id,
                building.BuildingType,
                buildingLookup.TryGetValue(building.BuildingType, out var buildingName)
                    ? buildingName
                    : building.BuildingType,
                building.BuiltAt)).ToList());
    }

    public async Task<BuildingDestroyResult?> DestroyAsync(string userId, int buildingId)
    {
        var building = await _db.SettlementBuildings
            .Include(item => item.Settlement)
            .FirstOrDefaultAsync(item => item.Id == buildingId && item.Settlement != null && item.Settlement.OwnerUserId == userId);

        if (building is null)
        {
            return null;
        }

        var buildingType = building.BuildingType;
        _db.SettlementBuildings.Remove(building);
        await _db.SaveChangesAsync();

        return new BuildingDestroyResult(building.Id, buildingType, "Budynek został zburzony.");
    }

    public async Task<BuildingBuildResult?> BuildAsync(string userId, int settlementId, string buildingType)
    {
        var settlement = await _db.Settlements
            .FirstOrDefaultAsync(item => item.Id == settlementId && item.OwnerUserId == userId);

        if (settlement is null)
        {
            return null;
        }

        var buildingDefinition = BuildingCatalog.All
            .FirstOrDefault(item => string.Equals(item.Code, buildingType, StringComparison.OrdinalIgnoreCase));

        if (buildingDefinition is null)
        {
            throw new ArgumentException("Wybrany typ budynku jest niepoprawny.");
        }

        var maxSlots = SettlementLevelCatalog.GetBuildingSlotsForLevel(settlement.Level);
        var occupiedSlots = await _db.SettlementBuildings.CountAsync(item => item.SettlementId == settlement.Id);

        if (maxSlots <= 0)
        {
            throw new InvalidOperationException("Ta osada nie ma skonfigurowanych slotów budynków.");
        }

        if (occupiedSlots >= maxSlots)
        {
            throw new InvalidOperationException($"Brak wolnych slotów w osadzie. Zajęte: {occupiedSlots}/{maxSlots}.");
        }

        var createdBuilding = new SettlementBuilding
        {
            SettlementId = settlement.Id,
            BuildingType = buildingDefinition.Code,
            BuiltAt = DateTime.UtcNow,
        };

        _db.SettlementBuildings.Add(createdBuilding);
        await _db.SaveChangesAsync();

        var nextOccupiedSlots = occupiedSlots + 1;

        return new BuildingBuildResult(
            createdBuilding.Id,
            settlement.Id,
            createdBuilding.BuildingType,
            buildingDefinition.Name,
            createdBuilding.BuiltAt,
            "Budynek został wybudowany.",
            maxSlots,
            nextOccupiedSlots,
            maxSlots - nextOccupiedSlots);
    }
}
