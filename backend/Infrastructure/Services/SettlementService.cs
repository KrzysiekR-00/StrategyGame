using Application.Abstractions;
using Application.Models;
using Domain.Models;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public sealed class SettlementService : ISettlementService
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser> _userManager;

    public SettlementService(AppDbContext db, UserManager<IdentityUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<SettlementSummaryResult>> GetMySettlementsAsync(string userId)
    {
        return await _db.Settlements
            .Where(settlement => settlement.OwnerUserId == userId)
            .OrderBy(settlement => settlement.FoundedAt)
            .Select(settlement => new SettlementSummaryResult(
                settlement.Id,
                settlement.Name,
                settlement.FoundedAt,
                settlement.Level))
            .ToListAsync();
    }

    public async Task<SettlementDetailResult?> GetByIdAsync(string userId, int settlementId)
    {
        var settlement = await _db.Settlements
            .FirstOrDefaultAsync(item => item.Id == settlementId && item.OwnerUserId == userId);

        if (settlement is null)
        {
            return null;
        }

        var buildings = await _db.SettlementBuildings
            .Where(item => item.SettlementId == settlement.Id)
            .OrderBy(item => item.BuiltAt)
            .ToListAsync();

        var buildingLookup = BuildingCatalog.All
            .ToDictionary(item => item.Code, item => item.Name, StringComparer.OrdinalIgnoreCase);

        var maxSlots = SettlementLevelCatalog.GetBuildingSlotsForLevel(settlement.Level);
        var occupiedSlots = buildings.Count;

        return new SettlementDetailResult(
            settlement.Id,
            settlement.Name,
            settlement.FoundedAt,
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

    public async Task<SettlementCreateResult> CreateAsync(string userId, string? requestedName, int requestedLevel)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            throw new InvalidOperationException("Użytkownik nie został znaleziony.");
        }

        var name = requestedName?.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            var settlementCount = await _db.Settlements.CountAsync(s => s.OwnerUserId == userId);
            name = $"Osada {settlementCount + 1}";
        }

        var level = requestedLevel < 1 ? 1 : requestedLevel;

        var settlement = new Settlement
        {
            Name = name,
            OwnerUserId = userId,
            FoundedAt = DateTime.UtcNow,
            Level = level,
        };

        _db.Settlements.Add(settlement);
        await _db.SaveChangesAsync();

        return new SettlementCreateResult(
            settlement.Id,
            settlement.Name,
            settlement.FoundedAt,
            settlement.Level,
            "Osada została utworzona pomyślnie.");
    }
}
