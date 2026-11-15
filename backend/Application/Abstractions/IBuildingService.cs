using Application.Models;

namespace Application.Abstractions;

public interface IBuildingService
{
    IReadOnlyList<BuildingDefinitionResult> GetDefinitions();
    Task<SettlementBuildingsResult?> GetBySettlementAsync(string userId, int settlementId);
    Task<BuildingDestroyResult?> DestroyAsync(string userId, int buildingId);
    Task<BuildingBuildResult?> BuildAsync(string userId, int settlementId, string buildingType);
}
