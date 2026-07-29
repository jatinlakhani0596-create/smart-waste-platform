// ─── Municipal Dashboard Module ───────────────────────────────────────────────
//
// Aggregates data from all modules into a unified dashboard view:
// - KPI metrics, zone summaries, truck status, open alerts
// ─────────────────────────────────────────────────────────────────────────────
import { bins, trucks, reports } from "../../data/seed.js";
import { getReportStats } from "../reporting/aiReporter.js";
import { optimizeRoutes } from "../routing/routeOptimizer.js";
import { getZoneCompliance, getSegregationStats } from "../segregation/segregationTracker.js";
// ── Build full stats snapshot ─────────────────────────────────────────────────
export function buildDashboardStats() {
    const now = new Date();
    const rptStats = getReportStats();
    const segStats = getSegregationStats();
    const { routes, co2SavedKg, fuelSavedLiters } = optimizeRoutes();
    const zoneReports = getZoneCompliance();
    const overflowBins = bins.filter((b) => b.status === "overflow").length;
    const activeTrucks = trucks.filter((t) => t.status === "on-route" || t.status === "collecting").length;
    const totalWaste = trucks.reduce((s, t) => s + t.currentLoadKg, 0) / 1000; // tons
    const recyclingRate = parseFloat(((bins.filter((b) => b.category === "recyclable").reduce((s, b) => s + b.fillLevel, 0) /
        (bins.reduce((s, b) => s + b.fillLevel, 0) || 1)) * 100).toFixed(1));
    const avgRouteEff = routes.length > 0
        ? routes.reduce((s, r) => s + r.optimizationScore, 0) / routes.length
        : 0;
    const zoneBreakdown = zoneReports.map((zr) => ({
        zone: zr.zone,
        bins: zr.totalBins,
        overflowBins: bins.filter((b) => b.location.zone === zr.zone && b.status === "overflow").length,
        collectedTons: parseFloat((trucks
            .filter((t) => t.location.zone === zr.zone)
            .reduce((s, t) => s + t.currentLoadKg, 0) / 1000).toFixed(2)),
        compliancePercent: zr.avgComplianceScore,
        openReports: reports.filter((r) => r.location.zone === zr.zone && (r.status === "pending" || r.status === "assigned")).length,
    }));
    return {
        date: now,
        totalWasteCollectedTons: parseFloat(totalWaste.toFixed(2)),
        recyclingRatePercent: recyclingRate,
        segregationCompliancePercent: segStats.avgComplianceScore,
        activeTrucks,
        totalBins: bins.length,
        overflowBins,
        openReports: rptStats.byStatus["pending"] + rptStats.byStatus["assigned"],
        resolvedReports: rptStats.byStatus["resolved"],
        avgRouteEfficiencyPercent: parseFloat(avgRouteEff.toFixed(1)),
        co2SavedKgThisMonth: parseFloat((co2SavedKg * 22).toFixed(1)), // × working days
        fuelSavedLitersThisMonth: parseFloat((fuelSavedLiters * 22).toFixed(1)),
        zoneBreakdown,
    };
}
export function getActiveAlerts() {
    const alerts = [];
    // Overflow bin alerts
    bins
        .filter((b) => b.status === "overflow" || b.status === "damaged")
        .forEach((b, i) => {
        alerts.push({
            id: `ALT-BIN-${i + 1}`,
            type: "overflow",
            severity: b.status === "overflow" ? "critical" : "warning",
            message: `Bin ${b.id} at ${b.location.address} is ${b.status.toUpperCase()} (${b.fillLevel}% fill)`,
            zone: b.location.zone,
            time: new Date(),
        });
    });
    // Critical reports
    reports
        .filter((r) => (r.severity === "critical" || r.severity === "high") && r.status !== "resolved")
        .forEach((r, i) => {
        alerts.push({
            id: `ALT-RPT-${i + 1}`,
            type: "report",
            severity: r.severity === "critical" ? "critical" : "warning",
            message: `${r.severity.toUpperCase()} report at ${r.location.address}: ${r.description.slice(0, 60)}…`,
            zone: r.location.zone,
            time: r.reportedAt,
        });
    });
    // Low-battery sensors
    bins
        .filter((b) => b.sensorBattery < 20)
        .forEach((b, i) => {
        alerts.push({
            id: `ALT-SNS-${i + 1}`,
            type: "sensor",
            severity: "info",
            message: `Sensor battery low on ${b.id} (${b.sensorBattery}%) at ${b.location.address}`,
            zone: b.location.zone,
            time: new Date(),
        });
    });
    // Trucks needing service
    trucks
        .filter((t) => {
        const daysSince = (Date.now() - t.lastService.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 45 || t.fuelLevel < 25;
    })
        .forEach((t, i) => {
        const daysSince = Math.round((Date.now() - t.lastService.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
            id: `ALT-TRK-${i + 1}`,
            type: "truck",
            severity: t.fuelLevel < 15 ? "critical" : "warning",
            message: t.fuelLevel < 25
                ? `Truck ${t.id} (${t.driverName}) has low fuel: ${t.fuelLevel}%`
                : `Truck ${t.id} overdue for service (${daysSince} days since last)`,
            zone: t.location.zone,
            time: new Date(),
        });
    });
    // Sort: critical first, then by time desc
    return alerts.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2 };
        if (order[a.severity] !== order[b.severity])
            return order[a.severity] - order[b.severity];
        return b.time.getTime() - a.time.getTime();
    });
}
// ── Truck fleet summary ───────────────────────────────────────────────────────
export function getTruckFleetSummary() {
    return trucks.map((t) => ({
        id: t.id,
        driver: t.driverName,
        status: t.status,
        zone: t.location.zone,
        loadPercent: Math.round((t.currentLoadKg / t.capacityKg) * 100),
        fuelLevel: t.fuelLevel,
        licensePlate: t.licensePlate,
    }));
}
