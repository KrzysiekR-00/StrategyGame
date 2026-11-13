using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using api.Models;

namespace api.Data;

public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<TestRecord> TestRecords => Set<TestRecord>();
    public DbSet<Settlement> Settlements => Set<Settlement>();
    public DbSet<SettlementBuilding> SettlementBuildings => Set<SettlementBuilding>();
    public DbSet<PlayerResource> PlayerResources => Set<PlayerResource>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Settlement>(entity =>
        {
            entity.HasKey(settlement => settlement.Id);
            entity.Property(settlement => settlement.Name).HasMaxLength(100).IsRequired();
            entity.Property(settlement => settlement.OwnerUserId).IsRequired();
            entity.Property(settlement => settlement.Level).HasDefaultValue(1);
            entity.HasOne<IdentityUser>()
                .WithMany()
                .HasForeignKey(settlement => settlement.OwnerUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<SettlementBuilding>(entity =>
        {
            entity.HasKey(item => item.Id);
            entity.Property(item => item.BuildingType).HasMaxLength(50).IsRequired();
            entity.HasOne(item => item.Settlement)
                .WithMany()
                .HasForeignKey(item => item.SettlementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlayerResource>(entity =>
        {
            entity.HasKey(item => item.Id);
            entity.Property(item => item.UserId).IsRequired();
            entity.Property(item => item.ResourceId).HasMaxLength(50).IsRequired();
            entity.HasIndex(item => new { item.UserId, item.ResourceId }).IsUnique();
        });
    }
}
