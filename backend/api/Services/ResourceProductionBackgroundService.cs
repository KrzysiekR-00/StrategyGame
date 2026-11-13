using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace api.Services;

public sealed class ResourceProductionBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ResourceProductionBackgroundService> _logger;
    private readonly TimeSpan _tickInterval;

    public ResourceProductionBackgroundService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<ResourceProductionBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        var tickSeconds = configuration.GetValue<int?>("Game:ProductionTickSeconds") ?? 30;
        _tickInterval = TimeSpan.FromSeconds(Math.Max(1, tickSeconds));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_tickInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessCycleAsync(stoppingToken);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Wystąpił błąd podczas przetwarzania produkcji zasobów.");
            }

            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task ProcessCycleAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var processor = scope.ServiceProvider.GetRequiredService<ResourceProductionProcessor>();

        var playerIds = await db.Settlements
            .Where(settlement => !string.IsNullOrWhiteSpace(settlement.OwnerUserId))
            .Select(settlement => settlement.OwnerUserId)
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var userId in playerIds)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                continue;
            }

            var startingInventory = await db.PlayerResources
                .Where(resource => resource.UserId == userId)
                .ToDictionaryAsync(resource => resource.ResourceId, resource => resource.Quantity, StringComparer.OrdinalIgnoreCase, cancellationToken);

            var buildings = await db.SettlementBuildings
                .Include(item => item.Settlement)
                .Where(item => item.Settlement != null && item.Settlement.OwnerUserId == userId)
                .ToListAsync(cancellationToken);

            var productionDelta = processor.ProcessCycle(startingInventory, buildings);
            if (productionDelta.Count == 0)
            {
                continue;
            }

            var playerResources = await db.PlayerResources
                .Where(resource => resource.UserId == userId)
                .ToListAsync(cancellationToken);

            foreach (var resourceDefinition in ResourceCatalog.All)
            {
                var resourceRow = playerResources.FirstOrDefault(item =>
                    string.Equals(item.ResourceId, resourceDefinition.Code, StringComparison.OrdinalIgnoreCase));

                if (resourceRow is null)
                {
                    resourceRow = new PlayerResource
                    {
                        UserId = userId,
                        ResourceId = resourceDefinition.Code,
                        Quantity = 0,
                    };

                    db.PlayerResources.Add(resourceRow);
                    playerResources.Add(resourceRow);
                }

                var delta = productionDelta.TryGetValue(resourceDefinition.Code, out var nextDelta)
                    ? nextDelta
                    : 0;

                resourceRow.Quantity = Math.Max(0, resourceRow.Quantity + delta);
            }

            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
