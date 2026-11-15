using Application.Models;

namespace Application.Abstractions;

public interface ISettlementService
{
    Task<IReadOnlyList<SettlementSummaryResult>> GetMySettlementsAsync(string userId);
    Task<SettlementDetailResult?> GetByIdAsync(string userId, int settlementId);
    Task<SettlementCreateResult> CreateAsync(string userId, string? requestedName, int requestedLevel);
}
