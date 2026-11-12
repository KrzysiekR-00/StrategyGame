namespace api.Models;

public static class BuildingCatalog
{
    public static BuildingDefinition Farm { get; } = new() { Name = "Farma" };

    public static BuildingDefinition Mill { get; } = new() { Name = "Młyn" };

    public static BuildingDefinition Bakery { get; } = new() { Name = "Piekarnia" };

    public static IReadOnlyList<BuildingDefinition> All { get; } =
    [
        Farm,
        Mill,
        Bakery,
    ];
}
