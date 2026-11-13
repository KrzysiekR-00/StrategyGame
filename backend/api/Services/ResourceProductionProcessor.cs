using api.Models;

namespace api.Services;

public sealed class ResourceProductionProcessor
{
    public IReadOnlyDictionary<string, double> ProcessCycle(
        IReadOnlyDictionary<string, double> startingInventory,
        IReadOnlyCollection<SettlementBuilding> buildings)
    {
        var availableInventory = startingInventory
            .ToDictionary(item => item.Key, item => item.Value, StringComparer.OrdinalIgnoreCase);

        var productionDelta = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);

        foreach (var building in buildings
                     .OrderBy(item => item.BuiltAt)
                     .ThenBy(item => item.Id))
        {
            var buildingDefinition = GetBuildingDefinition(building.BuildingType);
            if (buildingDefinition is null)
            {
                continue;
            }

            if (!CanBuildingRun(buildingDefinition, availableInventory))
            {
                continue;
            }

            ApplyBuildingConsumption(buildingDefinition, availableInventory, productionDelta);
            ApplyBuildingProduction(buildingDefinition, availableInventory, productionDelta);
        }

        return productionDelta;
    }

    private static BuildingDefinition? GetBuildingDefinition(string buildingType)
    {
        return BuildingCatalog.All.FirstOrDefault(item =>
            string.Equals(item.Code, buildingType, StringComparison.OrdinalIgnoreCase));
    }

    private static bool CanBuildingRun(
        BuildingDefinition buildingDefinition,
        IReadOnlyDictionary<string, double> availableInventory)
    {
        foreach (var input in buildingDefinition.InputResources)
        {
            if (!availableInventory.TryGetValue(input.ResourceCode, out var availableQuantity)
                || availableQuantity < input.Quantity)
            {
                return false;
            }
        }

        return true;
    }

    private static void ApplyBuildingConsumption(
        BuildingDefinition buildingDefinition,
        IDictionary<string, double> availableInventory,
        IDictionary<string, double> productionDelta)
    {
        foreach (var input in buildingDefinition.InputResources)
        {
            var currentQuantity = availableInventory.TryGetValue(input.ResourceCode, out var quantity)
                ? quantity
                : 0;

            availableInventory[input.ResourceCode] = currentQuantity - input.Quantity;
            productionDelta[input.ResourceCode] = productionDelta.TryGetValue(input.ResourceCode, out var currentDelta)
                ? currentDelta - input.Quantity
                : -input.Quantity;
        }
    }

    private static void ApplyBuildingProduction(
        BuildingDefinition buildingDefinition,
        IDictionary<string, double> availableInventory,
        IDictionary<string, double> productionDelta)
    {
        foreach (var output in buildingDefinition.OutputResources)
        {
            productionDelta[output.ResourceCode] = productionDelta.TryGetValue(output.ResourceCode, out var currentDelta)
                ? currentDelta + output.Quantity
                : output.Quantity;
        }
    }
}
