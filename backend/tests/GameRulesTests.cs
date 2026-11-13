using api.Models;
using api.Services;
using Xunit;

namespace tests;

public class GameRulesTests
{
    [Fact]
    public void ProcessCycle_WhenStartingInventoryHasNoInput_ThenBuildingDoesNotRunEvenIfAnotherBuildingProducesItLaterInCycle()
    {
        var processor = new ResourceProductionProcessor(
        [
            CreateBuildingDefinition("farm", outputs: new[] { (ResourceCatalog.Wheat.Code, 2) }),
            CreateBuildingDefinition(
                "mill",
                inputs: new[] { (ResourceCatalog.Wheat.Code, 3) },
                outputs: new[] { (ResourceCatalog.Flour.Code, 3) }),
        ]);

        var startingInventory = new Dictionary<string, double>
        {
            [ResourceCatalog.Wheat.Code] = 0,
        };

        var buildings = new[]
        {
            CreateBuilding("farm", 1, new DateTime(2024, 01, 01, 00, 00, 00, DateTimeKind.Utc)),
            CreateBuilding("mill", 2, new DateTime(2024, 01, 01, 00, 00, 01, DateTimeKind.Utc)),
        };

        var result = processor.ProcessCycle(startingInventory, buildings);

        Assert.Equal(2, result[ResourceCatalog.Wheat.Code]);
        Assert.False(result.ContainsKey(ResourceCatalog.Flour.Code));
    }

    [Fact]
    public void ProcessCycle_WhenDifferentBuildingDefinitionsShareTheSameInput_ThenTheyCompeteForTheSharedInventory()
    {
        var processor = new ResourceProductionProcessor(
        [
            CreateBuildingDefinition(
                "grinder",
                inputs: new[] { (ResourceCatalog.Wheat.Code, 3) },
                outputs: new[] { (ResourceCatalog.Flour.Code, 3) }),
            CreateBuildingDefinition(
                "press",
                inputs: new[] { (ResourceCatalog.Wheat.Code, 3) },
                outputs: new[] { (ResourceCatalog.Bread.Code, 3) }),
        ]);

        var startingInventory = new Dictionary<string, double>
        {
            [ResourceCatalog.Wheat.Code] = 5,
        };

        var buildings = new[]
        {
            CreateBuilding("grinder", 1, new DateTime(2024, 01, 01, 00, 00, 00, DateTimeKind.Utc)),
            CreateBuilding("press", 2, new DateTime(2024, 01, 01, 00, 00, 01, DateTimeKind.Utc)),
        };

        var result = processor.ProcessCycle(startingInventory, buildings);

        Assert.Equal(-3, result[ResourceCatalog.Wheat.Code]);
        Assert.Equal(3, result[ResourceCatalog.Flour.Code]);
        Assert.False(result.ContainsKey(ResourceCatalog.Bread.Code));
    }

    [Fact]
    public void ProcessCycle_WhenBuildingsConsumeTheSameInput_ThenTheyRunInOrderAndOnlyFullCoverageBuildingsRun()
    {
        var processor = new ResourceProductionProcessor(
        [
            CreateBuildingDefinition(
                "mill",
                inputs: new[] { (ResourceCatalog.Wheat.Code, 3) },
                outputs: new[] { (ResourceCatalog.Flour.Code, 3) }),
        ]);

        var startingInventory = new Dictionary<string, double>
        {
            [ResourceCatalog.Wheat.Code] = 5,
        };

        var buildings = new[]
        {
            CreateBuilding("mill", 1, new DateTime(2024, 01, 01, 00, 00, 00, DateTimeKind.Utc)),
            CreateBuilding("mill", 2, new DateTime(2024, 01, 01, 00, 00, 01, DateTimeKind.Utc)),
        };

        var result = processor.ProcessCycle(startingInventory, buildings);

        Assert.Equal(2, result.Count);
        Assert.Equal(-3, result[ResourceCatalog.Wheat.Code]);
        Assert.Equal(3, result[ResourceCatalog.Flour.Code]);
    }

    [Fact]
    public void ProcessCycle_WhenBuildingHasNoInput_ThenItStillProducesOutput()
    {
        var processor = new ResourceProductionProcessor(
        [
            CreateBuildingDefinition("farm", outputs: new[] { (ResourceCatalog.Wheat.Code, 2) }),
        ]);

        var result = processor.ProcessCycle(new Dictionary<string, double>(),
        [
            CreateBuilding("farm", 1, new DateTime(2024, 01, 01, 00, 00, 00, DateTimeKind.Utc)),
        ]);

        Assert.Equal(2, result[ResourceCatalog.Wheat.Code]);
    }

    private static BuildingDefinition CreateBuildingDefinition(
        string code,
        IEnumerable<(string ResourceCode, int Quantity)>? inputs = null,
        IEnumerable<(string ResourceCode, int Quantity)>? outputs = null)
    {
        return new BuildingDefinition
        {
            Code = code,
            Name = code,
            InputResources = (inputs ?? Array.Empty<(string ResourceCode, int Quantity)>())
                .Select(item => new ResourceCost { ResourceCode = item.ResourceCode, Quantity = item.Quantity })
                .ToArray(),
            OutputResources = (outputs ?? Array.Empty<(string ResourceCode, int Quantity)>())
                .Select(item => new ResourceCost { ResourceCode = item.ResourceCode, Quantity = item.Quantity })
                .ToArray(),
        };
    }

    private static SettlementBuilding CreateBuilding(string buildingType, int id, DateTime builtAtUtc)
    {
        return new SettlementBuilding
        {
            Id = id,
            SettlementId = 1,
            BuildingType = buildingType,
            BuiltAt = builtAtUtc,
        };
    }
}
