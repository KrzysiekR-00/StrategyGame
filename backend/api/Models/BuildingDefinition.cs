namespace api.Models;

public sealed class BuildingDefinition
{
    public string Code { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public IReadOnlyList<ResourceCost> InputResources { get; init; } = [];

    public IReadOnlyList<ResourceCost> OutputResources { get; init; } = [];
}

public sealed class ResourceCost
{
    public string ResourceCode { get; init; } = string.Empty;

    public int Quantity { get; init; }
}
