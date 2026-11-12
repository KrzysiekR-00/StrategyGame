namespace api.Models;

public static class ResourceCatalog
{
    public static ResourceDefinition Wheat { get; } = new() { Code = "wheat", Name = "Zboże" };

    public static ResourceDefinition Flour { get; } = new() { Code = "flour", Name = "Mąka" };

    public static ResourceDefinition Bread { get; } = new() { Code = "bread", Name = "Chleb" };

    public static IReadOnlyList<ResourceDefinition> All { get; } =
    [
        Wheat,
        Flour,
        Bread,
    ];
}
