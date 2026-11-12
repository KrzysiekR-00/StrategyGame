namespace api.Models;

public static class BuildingCatalog
{
    public static BuildingDefinition Farm { get; } = new() { Code = "farm", Name = "Farma" };

    public static BuildingDefinition Mill { get; } = new() { Code = "mill", Name = "Młyn" };

    public static BuildingDefinition Bakery { get; } = new() { Code = "bakery", Name = "Piekarnia" };

    public static IReadOnlyList<BuildingDefinition> All { get; } =
    [
        Farm,
        Mill,
        Bakery,
    ];
}
