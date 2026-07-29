// ─── Segregation Tracking Module ─────────────────────────────────────────────
//
// Tracks waste segregation quality at bin level:
//  - Detects contamination using simulated sensor/AI scan
//  - Computes per-bin and per-zone compliance scores
//  - Generates citizen feedback and zone alerts
// ─────────────────────────────────────────────────────────────────────────────

import type {
  WasteCategory,
  SegregationRecord,
  WasteBin,
} from "../../data/models.js";
import { bins, segregationRecords } from "../../data/seed.js";

// ── Category compatibility matrix ────────────────────────────────────────────
// Defines what contamination categories are "acceptable" cross-contamination
// (minor tolerance) vs completely incompatible.
const INCOMPATIBLE: Partial<Record<WasteCategory, WasteCategory[]>> = {
  medical:    ["organic", "general", "recyclable", "ewaste"],
  hazardous:  ["organic", "general", "recyclable", "medical"],
  ewaste:     ["organic", "general"],
  organic:    ["hazardous", "medical", "ewaste"],
  recyclable: ["hazardous", "medical"],
  general:    ["hazardous", "medical"],
};

// ── Contamination risk multiplier ─────────────────────────────────────────────
function contamRisk(expected: WasteCategory, found: WasteCategory): number {
  if (expected === found) return 0;
  const incompatible = INCOMPATIBLE[expected] ?? [];
  return incompatible.includes(found) ? 2.5 : 1.0;
}

// ── Scan a single bin ─────────────────────────────────────────────────────────
export interface ScanResult {
  record:           SegregationRecord;
  isCompliant:      boolean;
  alerts:           string[];
  feedbackMessage:  string;
}

export function scanBin(binId: string): ScanResult | null {
  const bin = bins.find((b) => b.id === binId);
  if (!bin) return null;

  // Simulate AI sensor scan: base contamination 5–40%, higher for general bins
  const baseContam  = bin.category === "general" ? Math.random() * 20 + 5 : Math.random() * 35 + 2;
  const contam      = parseFloat(Math.min(baseContam, 60).toFixed(1));

  // Pick 1–2 contaminating categories randomly
  const otherCats   = (Object.keys(INCOMPATIBLE) as WasteCategory[]).filter((c) => c !== bin.category);
  const contamCat   = otherCats[Math.floor(Math.random() * otherCats.length)];
  const risk        = contamRisk(bin.category, contamCat);

  const adjustedContam = parseFloat(Math.min(contam * (risk > 1 ? 1.4 : 1.0), 80).toFixed(1));
  const compliance     = Math.max(0, Math.round(100 - adjustedContam - Math.random() * 5));

  const detected: { category: WasteCategory; percentage: number }[] = [
    { category: bin.category, percentage: parseFloat((100 - adjustedContam).toFixed(1)) },
  ];
  if (adjustedContam > 3) {
    detected.push({ category: contamCat, percentage: adjustedContam });
  }

  const alerts: string[] = [];
  if (adjustedContam > 40) alerts.push(`HIGH contamination (${adjustedContam}%) in ${bin.id}`);
  if (risk > 1)             alerts.push(`Incompatible waste: "${contamCat}" in "${bin.category}" bin`);
  if (compliance < 50)      alerts.push(`Compliance below threshold (${compliance}%)`);

  const feedbackMessage =
    compliance >= 85
      ? `Great job! Your ${bin.location.address} bin has excellent segregation (${compliance}% compliant).`
      : compliance >= 65
        ? `Reminder: Please check segregation at ${bin.location.address}. Minor contamination detected (${adjustedContam}%).`
        : `⚠️ Action needed at ${bin.location.address}: ${contamCat} waste found in ${bin.category} bin. Compliance: ${compliance}%.`;

  const record: SegregationRecord = {
    id:                   `SEG-LIVE-${Date.now()}-${binId}`,
    binId,
    recordedAt:           new Date(),
    expectedCategory:     bin.category,
    detectedCategories:   detected,
    contaminationLevel:   adjustedContam,
    complianceScore:      compliance,
    zone:                 bin.location.zone,
    citizenFeedbackSent:  compliance < 70,
  };

  segregationRecords.push(record);

  return {
    record,
    isCompliant: compliance >= 70,
    alerts,
    feedbackMessage,
  };
}

// ── Zone compliance report ─────────────────────────────────────────────────────
export interface ZoneComplianceReport {
  zone:                string;
  totalBins:           number;
  scannedBins:         number;
  avgComplianceScore:  number;
  avgContamination:    number;
  compliantBins:       number;
  nonCompliantBins:    number;
  topOffenders:        { binId: string; score: number; contamination: number }[];
  trend:               "improving" | "stable" | "declining";
}

export function getZoneCompliance(): ZoneComplianceReport[] {
  const zones = [...new Set(bins.map((b) => b.location.zone))];

  return zones.map((zone) => {
    const zoneBins    = bins.filter((b) => b.location.zone === zone);
    const zoneRecords = segregationRecords.filter((r) => r.zone === zone);

    // Use latest record per bin
    const latestPerBin = new Map<string, SegregationRecord>();
    for (const rec of zoneRecords) {
      const existing = latestPerBin.get(rec.binId);
      if (!existing || rec.recordedAt > existing.recordedAt) {
        latestPerBin.set(rec.binId, rec);
      }
    }

    const records = [...latestPerBin.values()];
    const avg     = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const scores  = records.map((r) => r.complianceScore);
    const contams = records.map((r) => r.contaminationLevel);

    const topOffenders = records
      .filter((r) => r.complianceScore < 70)
      .sort((a, b) => a.complianceScore - b.complianceScore)
      .slice(0, 3)
      .map((r) => ({ binId: r.binId, score: r.complianceScore, contamination: r.contaminationLevel }));

    // Simulate trend using randomness seeded by zone name
    const trendVal  = zone.charCodeAt(0) % 3;
    const trend     = trendVal === 0 ? "improving" : trendVal === 1 ? "stable" : "declining";

    return {
      zone,
      totalBins:          zoneBins.length,
      scannedBins:        records.length,
      avgComplianceScore: parseFloat(avg(scores).toFixed(1)),
      avgContamination:   parseFloat(avg(contams).toFixed(1)),
      compliantBins:      records.filter((r) => r.complianceScore >= 70).length,
      nonCompliantBins:   records.filter((r) => r.complianceScore < 70).length,
      topOffenders,
      trend,
    };
  });
}

// ── Aggregated platform-wide segregation stats ────────────────────────────────
export function getSegregationStats() {
  const all        = segregationRecords;
  const total      = all.length;
  const avgCompliance =
    total > 0 ? all.reduce((s, r) => s + r.complianceScore, 0) / total : 0;
  const avgContam     =
    total > 0 ? all.reduce((s, r) => s + r.contaminationLevel, 0) / total : 0;

  const categoryBreakdown: Record<WasteCategory, { count: number; avgCompliance: number }> = {
    organic: { count: 0, avgCompliance: 0 },
    recyclable: { count: 0, avgCompliance: 0 },
    hazardous: { count: 0, avgCompliance: 0 },
    general: { count: 0, avgCompliance: 0 },
    ewaste: { count: 0, avgCompliance: 0 },
    medical: { count: 0, avgCompliance: 0 },
  };

  for (const rec of all) {
    const cat = rec.expectedCategory;
    categoryBreakdown[cat].count += 1;
    categoryBreakdown[cat].avgCompliance += rec.complianceScore;
  }

  for (const cat of Object.keys(categoryBreakdown) as WasteCategory[]) {
    const entry = categoryBreakdown[cat];
    if (entry.count > 0) {
      entry.avgCompliance = parseFloat((entry.avgCompliance / entry.count).toFixed(1));
    }
  }

  return {
    totalRecords:            total,
    avgComplianceScore:      parseFloat(avgCompliance.toFixed(1)),
    avgContaminationLevel:   parseFloat(avgContam.toFixed(1)),
    feedbackSentCount:       all.filter((r) => r.citizenFeedbackSent).length,
    categoryBreakdown,
  };
}
