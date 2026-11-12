namespace api.Models;

public sealed class SettlementLevelConfig
{
    public int Level { get; init; }

    public int BuildingSlots { get; init; }
}

public static class SettlementLevelCatalog
{
    public static IReadOnlyList<SettlementLevelConfig> All { get; } =
    [
        new SettlementLevelConfig { Level = 1, BuildingSlots = 3 },
        new SettlementLevelConfig { Level = 2, BuildingSlots = 5 },
        new SettlementLevelConfig { Level = 3, BuildingSlots = 6 },
    ];

    public static int GetBuildingSlotsForLevel(int level)
    {
        var config = All.FirstOrDefault(item => item.Level == level);
        return config?.BuildingSlots ?? 0;
    }
}
