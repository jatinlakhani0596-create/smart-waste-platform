// ─── Smart Waste Management Platform — Main Entry Point ──────────────────────
//
// Runs a full demonstration of all four platform pillars:
//   1. AI-Powered Waste Reporting
//   2. Route Optimization Engine
//   3. Segregation Tracking
//   4. Municipal Dashboard Snapshot
// ─────────────────────────────────────────────────────────────────────────────
import chalk from "chalk";
import { classifyReport, submitReport, getReportStats, getCriticalReports, } from "./modules/reporting/aiReporter.js";
import { optimizeRoutes, simulateRouteProgress, } from "./modules/routing/routeOptimizer.js";
import { scanBin, getZoneCompliance, getSegregationStats, } from "./modules/segregation/segregationTracker.js";
import { buildDashboardStats, getActiveAlerts, getTruckFleetSummary, } from "./modules/dashboard/dashboardService.js";
import { bins, trucks } from "./data/seed.js";
// ── Formatting helpers ────────────────────────────────────────────────────────
const HR = chalk.gray("─".repeat(72));
const BOLD = chalk.bold;
function section(title) {
    console.log("\n" + chalk.bgBlue.white.bold(` ${title} `));
    console.log(HR);
}
function kv(label, value, unit = "") {
    console.log(`  ${chalk.cyan(label.padEnd(36))} ${chalk.white(String(value))} ${chalk.gray(unit)}`);
}
function badge(status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors = {
        critical: chalk.bgRed.white,
        high: chalk.bgYellow.black,
        warning: chalk.bgYellow.black,
        medium: chalk.bgYellow.black,
        low: chalk.bgGreen.black,
        info: chalk.bgCyan.black,
        pending: chalk.bgMagenta.white,
        assigned: chalk.bgBlue.white,
        resolved: chalk.bgGreen.black,
        rejected: chalk.bgGray.white,
        planned: chalk.bgBlue.white,
        active: chalk.bgGreen.black,
        completed: chalk.bgGreen.black,
        improving: chalk.bgGreen.black,
        stable: chalk.bgCyan.black,
        declining: chalk.bgRed.white,
    };
    const fn = colors[status.toLowerCase()] ?? chalk.bgGray.white;
    return fn(` ${status.toUpperCase()} `);
}
// ═════════════════════════════════════════════════════════════════════════════
//  MODULE 1 — AI-Powered Waste Reporting
// ═════════════════════════════════════════════════════════════════════════════
function demoReporting() {
    section("📋  MODULE 1 — AI-Powered Waste Reporting");
    // --- Single classification demo ---
    const testDescription = "Overflowing bin with toxic chemical paint cans blocking the road";
    console.log(`\n  ${chalk.bold("Test description:")} "${testDescription}"\n`);
    const classification = classifyReport(testDescription);
    kv("Detected Category", classification.category);
    kv("Severity", classification.severity);
    kv("AI Confidence", `${(classification.confidence * 100).toFixed(1)}%`);
    kv("AI Tags", classification.tags.join(", "));
    console.log(`\n  ${chalk.dim("Reasoning:")} ${classification.reasoning}`);
    // --- Submit 3 live reports ---
    console.log(`\n  ${BOLD("Submitting 3 citizen reports via AI pipeline…")}\n`);
    const submissions = [
        {
            description: "Medical syringes and bandages found near the park playground",
            citizenId: "CIT-99001",
            location: { lat: 40.730, lng: -74.002, address: "Central Park East", zone: "Central" },
        },
        {
            description: "Large pile of cardboard boxes and plastic bottles outside the mall",
            citizenId: "CIT-99002",
            location: { lat: 40.780, lng: -73.955, address: "55 Mall Blvd", zone: "North" },
        },
        {
            description: "Kitchen food waste bins overflowing, bad smell, fruit scraps on sidewalk",
            citizenId: "CIT-99003",
            location: { lat: 40.682, lng: -74.005, address: "3 Harbor View", zone: "South" },
        },
    ];
    for (const sub of submissions) {
        const report = submitReport(sub);
        console.log(`  ${chalk.gray(report.id)}  ${badge(report.severity)}  ${badge(report.status)}` +
            `  ${chalk.cyan(report.category.padEnd(12))}  conf: ${chalk.white((report.aiConfidence * 100).toFixed(0) + "%")}` +
            `  → ${chalk.gray(report.assignedTruckId ?? "unassigned")}`);
    }
    // --- Stats ---
    const stats = getReportStats();
    console.log(`\n  ${BOLD("Platform-wide report statistics:")}`);
    kv("Total reports", stats.total);
    kv("Pending", stats.byStatus.pending);
    kv("Assigned", stats.byStatus.assigned);
    kv("Resolved", stats.byStatus.resolved);
    kv("Critical/High", stats.bySeverity.critical + " / " + stats.bySeverity.high);
    kv("Avg AI confidence", `${(stats.avgConfidence * 100).toFixed(1)}%`);
    const critical = getCriticalReports();
    if (critical.length > 0) {
        console.log(`\n  ${chalk.red.bold("⚠  Critical & High-severity open reports:")}`);
        critical.slice(0, 4).forEach((r) => {
            console.log(`   ${chalk.gray(r.id)}  ${badge(r.severity)}  ${chalk.yellow(r.location.address)} — ${r.description.slice(0, 55)}…`);
        });
    }
}
// ═════════════════════════════════════════════════════════════════════════════
//  MODULE 2 — Route Optimization
// ═════════════════════════════════════════════════════════════════════════════
function demoRouting() {
    section("🗺   MODULE 2 — AI Route Optimization Engine");
    const result = optimizeRoutes(40);
    console.log(`\n  ${BOLD(result.summary)}\n`);
    kv("Routes generated", result.routes.length);
    kv("Unassigned bins", result.unassignedBins.length);
    kv("CO₂ saved (today)", result.co2SavedKg, "kg");
    kv("Fuel saved (today)", result.fuelSavedLiters, "L");
    console.log(`\n  ${BOLD("Per-truck route details:")}`);
    for (const route of result.routes) {
        const progress = simulateRouteProgress(route);
        const done = progress.stops.filter((s) => s.completedAt !== null).length;
        console.log(`\n  ${chalk.cyan(route.id)}  Truck: ${chalk.white(route.truckId)}  ${badge(progress.status)}`);
        kv("  Stops (total / done)", `${route.stops.length} / ${done}`);
        kv("  Total distance", route.totalDistanceKm, "km");
        kv("  Est. duration", route.estimatedDurationMin, "min");
        kv("  Optimization score", route.optimizationScore + "%");
        kv("  Fuel saved", route.fuelSavedLiters, "L");
        kv("  CO₂ saved", route.co2SavedKg, "kg");
        console.log(`  ${chalk.dim("  Stops:")}`);
        route.stops.slice(0, 4).forEach((s) => {
            const eta = s.arrivalEta.toTimeString().slice(0, 5);
            console.log(`    ${chalk.gray(`#${s.sequence}`.padStart(3))}  ${chalk.cyan(s.binId)}  ` +
                `${s.location.address.padEnd(28)}  ETA ${chalk.white(eta)}`);
        });
        if (route.stops.length > 4) {
            console.log(chalk.dim(`    … and ${route.stops.length - 4} more stops`));
        }
    }
    if (result.unassignedBins.length > 0) {
        console.log(`\n  ${chalk.yellow("Unassigned priority bins (no truck available):")}`);
        result.unassignedBins.slice(0, 5).forEach((b) => {
            console.log(`   ${chalk.gray(b.id)}  fill: ${chalk.white(b.fillLevel + "%")}  ${b.location.address} (${b.location.zone})`);
        });
    }
}
// ═════════════════════════════════════════════════════════════════════════════
//  MODULE 3 — Segregation Tracking
// ═════════════════════════════════════════════════════════════════════════════
function demoSegregation() {
    section("♻️   MODULE 3 — Waste Segregation Tracking");
    // Scan 6 bins live
    console.log(`\n  ${BOLD("Live AI segregation scans on 6 bins:")}\n`);
    const scanTargets = bins.slice(0, 6).map((b) => b.id);
    for (const binId of scanTargets) {
        const result = scanBin(binId);
        if (!result)
            continue;
        const { record, isCompliant, alerts, feedbackMessage } = result;
        const compColor = record.complianceScore >= 85
            ? chalk.green
            : record.complianceScore >= 65
                ? chalk.yellow
                : chalk.red;
        console.log(`  ${chalk.cyan(record.binId)}  ` +
            `compliance: ${compColor(record.complianceScore + "%")}  ` +
            `contamination: ${chalk.yellow(record.contaminationLevel + "%")}  ` +
            (isCompliant ? chalk.green("✓ COMPLIANT") : chalk.red("✗ NON-COMPLIANT")));
        if (alerts.length > 0) {
            alerts.forEach((a) => console.log(chalk.red(`    ⚠  ${a}`)));
        }
        console.log(chalk.dim(`    💬 ${feedbackMessage}`));
    }
    // Zone compliance report
    console.log(`\n  ${BOLD("Zone-level compliance summary:")}\n`);
    const zones = getZoneCompliance();
    for (const z of zones) {
        console.log(`  ${chalk.bold(z.zone.padEnd(10))}  ` +
            `compliance: ${chalk.cyan(z.avgComplianceScore + "%")}  ` +
            `contam: ${chalk.yellow(z.avgContamination + "%")}  ` +
            `scanned: ${chalk.white(z.scannedBins + "/" + z.totalBins)}  ` +
            `trend: ${badge(z.trend)}`);
        if (z.topOffenders.length > 0) {
            z.topOffenders.forEach((o) => {
                console.log(chalk.dim(`    ↳ ${o.binId}  score: ${o.score}%  contam: ${o.contamination}%`));
            });
        }
    }
    // Platform stats
    const stats = getSegregationStats();
    console.log(`\n  ${BOLD("Overall segregation statistics:")}`);
    kv("Total scan records", stats.totalRecords);
    kv("Avg compliance score", stats.avgComplianceScore + "%");
    kv("Avg contamination", stats.avgContaminationLevel + "%");
    kv("Citizen feedbacks sent", stats.feedbackSentCount);
    console.log(`\n  ${BOLD("Per-category breakdown:")}`);
    for (const [cat, data] of Object.entries(stats.categoryBreakdown)) {
        if (data.count > 0) {
            console.log(`   ${chalk.cyan(cat.padEnd(14))}  records: ${data.count}  avg compliance: ${chalk.white(data.avgCompliance + "%")}`);
        }
    }
}
// ═════════════════════════════════════════════════════════════════════════════
//  MODULE 4 — Municipal Dashboard
// ═════════════════════════════════════════════════════════════════════════════
function demoDashboard() {
    section("🏛   MODULE 4 — Municipal Operations Dashboard");
    const stats = buildDashboardStats();
    const alerts = getActiveAlerts();
    const fleet = getTruckFleetSummary();
    console.log(`\n  ${BOLD("📊  Key Performance Indicators")}\n`);
    kv("Waste collected today", stats.totalWasteCollectedTons, "tonnes");
    kv("Active trucks", `${stats.activeTrucks} / ${trucks.length}`);
    kv("Total bins monitored", stats.totalBins);
    kv("Overflow bins", stats.overflowBins);
    kv("Recycling rate", stats.recyclingRatePercent + "%");
    kv("Segregation compliance", stats.segregationCompliancePercent + "%");
    kv("Open citizen reports", stats.openReports);
    kv("Resolved reports", stats.resolvedReports);
    kv("Avg route efficiency", stats.avgRouteEfficiencyPercent + "%");
    kv("CO₂ saved (this month)", stats.co2SavedKgThisMonth, "kg");
    kv("Fuel saved (this month)", stats.fuelSavedLitersThisMonth, "L");
    console.log(`\n  ${BOLD("📍  Zone-by-Zone Breakdown:")}\n`);
    for (const z of stats.zoneBreakdown) {
        console.log(`  ${chalk.bold(z.zone.padEnd(10))}  ` +
            `bins: ${chalk.cyan(String(z.bins).padStart(3))}  ` +
            `overflow: ${chalk.red(String(z.overflowBins).padStart(2))}  ` +
            `collected: ${chalk.white(z.collectedTons + "t")}  ` +
            `compliance: ${chalk.green(z.compliancePercent + "%")}  ` +
            `open reports: ${chalk.yellow(String(z.openReports))}`);
    }
    console.log(`\n  ${BOLD("🚛  Fleet Status:")}\n`);
    for (const t of fleet) {
        const loadColor = t.loadPercent > 85 ? chalk.red : t.loadPercent > 60 ? chalk.yellow : chalk.green;
        const fuelColor = t.fuelLevel < 25 ? chalk.red : t.fuelLevel < 50 ? chalk.yellow : chalk.green;
        console.log(`  ${chalk.cyan(t.id)}  ${t.driver.padEnd(16)}  ${badge(t.status)}  ` +
            `zone: ${chalk.white(t.zone.padEnd(8))}  ` +
            `load: ${loadColor(t.loadPercent + "%")}  ` +
            `fuel: ${fuelColor(t.fuelLevel + "%")}`);
    }
    console.log(`\n  ${BOLD("🚨  Active Alerts (" + alerts.length + " total):")}\n`);
    alerts.slice(0, 10).forEach((a) => {
        const time = a.time.toTimeString().slice(0, 8);
        console.log(`  ${badge(a.severity)}  ${badge(a.type)}  ` +
            `${chalk.gray(time)}  ${chalk.yellow("[" + a.zone + "]")}  ${a.message.slice(0, 65)}`);
    });
    if (alerts.length > 10) {
        console.log(chalk.dim(`  … and ${alerts.length - 10} more alerts`));
    }
}
// ═════════════════════════════════════════════════════════════════════════════
//  ENTRY POINT
// ═════════════════════════════════════════════════════════════════════════════
console.log("\n" +
    chalk.bgGreen.black.bold("                                                                        ") + "\n" +
    chalk.bgGreen.black.bold("     🗑  SMART WASTE MANAGEMENT PLATFORM  —  Municipal Demo v1.0       ") + "\n" +
    chalk.bgGreen.black.bold("                                                                        "));
demoReporting();
demoRouting();
demoSegregation();
demoDashboard();
console.log("\n" + HR);
console.log(chalk.green.bold("  ✅  Platform demo complete. All modules operational.\n"));
