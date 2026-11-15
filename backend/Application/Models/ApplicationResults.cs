namespace Application.Models;

public sealed record CurrentUserResult(string Id, string Username);

public sealed record SettlementSummaryResult(int Id, string Name, DateTime FoundedAt, int Level);

public sealed record BuildingSummaryResult(int Id, string BuildingType, string Name, DateTime BuiltAt);

public sealed record SettlementDetailResult(
    int Id,
    string Name,
    DateTime FoundedAt,
    int Level,
    int MaxSlots,
    int OccupiedSlots,
    int AvailableSlots,
    IReadOnlyList<BuildingSummaryResult> Buildings);

public sealed record ResourceCostResult(string ResourceCode, int Quantity);

public sealed record BuildingDefinitionResult(
    string Code,
    string Name,
    IReadOnlyList<ResourceCostResult> InputResources,
    IReadOnlyList<ResourceCostResult> OutputResources);

public sealed record ResourceSummaryResult(string ResourceCode, string ResourceName, double Quantity);

public sealed record SettlementCreateResult(int Id, string Name, DateTime FoundedAt, int Level, string Message);

public sealed record BuildingDestroyResult(int Id, string BuildingType, string Message);

public sealed record BuildingBuildResult(
    int Id,
    int SettlementId,
    string BuildingType,
    string Name,
    DateTime BuiltAt,
    string Message,
    int MaxSlots,
    int OccupiedSlots,
    int AvailableSlots);

public sealed record SettlementBuildingsResult(
    int SettlementId,
    string SettlementName,
    int SettlementLevel,
    int MaxSlots,
    int OccupiedSlots,
    int AvailableSlots,
    IReadOnlyList<BuildingSummaryResult> Buildings);
