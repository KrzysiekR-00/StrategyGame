namespace api.Models;

public static class BuildingCatalog
{
    public static BuildingDefinition Farm { get; } = new()
    {
        Code = "farm",
        Name = "Farma",
        InputResources = [],
        OutputResources =
        [
            new ResourceCost { ResourceCode = ResourceCatalog.Wheat.Code, Quantity = 2 },
        ],
    };

    public static BuildingDefinition Mill { get; } = new()
    {
        Code = "mill",
        Name = "Młyn",
        InputResources =
        [
            new ResourceCost { ResourceCode = ResourceCatalog.Wheat.Code, Quantity = 3 },
        ],
        OutputResources =
        [
            new ResourceCost { ResourceCode = ResourceCatalog.Flour.Code, Quantity = 3 },
        ],
    };

    public static BuildingDefinition Bakery { get; } = new()
    {
        Code = "bakery",
        Name = "Piekarnia",
        InputResources =
        [
            new ResourceCost { ResourceCode = ResourceCatalog.Flour.Code, Quantity = 5 },
        ],
        OutputResources =
        [
            new ResourceCost { ResourceCode = ResourceCatalog.Bread.Code, Quantity = 3 },
        ],
    };

    public static IReadOnlyList<BuildingDefinition> All { get; } =
    [
        Farm,
        Mill,
        Bakery,
    ];
}
