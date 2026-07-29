// ─── AI-Powered Waste Reporting Module ────────────────────────────────────────
//
// Simulates an AI vision + NLP pipeline that:
//  1. Classifies an incoming report image/description
//  2. Assigns severity using rule-based heuristics + confidence scoring
//  3. Auto-tags and routes the report to the nearest available truck
// ─────────────────────────────────────────────────────────────────────────────

import type { WasteReport, WasteCategory, ReportSeverity, GeoPoint } from "../../data/models.js";
import { reports, trucks } from "../../data/seed.js";

// ── Keyword taxonomy used by the AI classifier ────────────────────────────────
const CATEGORY_KEYWORDS: Record<WasteCategory, string[]> = {
  organic:    ["food", "organic", "compost", "vegetable", "fruit", "biodegradable", "kitchen"],
  recyclable: ["plastic", "bottle", "glass", "paper", "cardboard", "metal", "can", "recycle"],
  hazardous:  ["chemical", "paint", "battery", "acid", "flammable", "toxic", "bleach", "pesticide"],
  general:    ["garbage", "trash", "litter", "rubbish", "waste", "dump", "overflow", "spill"],
  ewaste:     ["tv", "monitor", "computer", "laptop", "phone", "electronics", "cable", "ewaste"],
  medical:    ["syringe", "needle", "bandage", "medical", "clinical", "pharmaceutical", "drugs"],
};

const SEVERITY_KEYWORDS: Record<ReportSeverity, string[]> = {
  critical: ["fire", "burning", "explosion", "toxic", "chemical spill", "syringe", "needle", "flood"],
  high:     ["overflow", "blocking", "road", "hazard", "medical", "large scale", "illegal dump"],
  medium:   ["full", "broken", "damaged", "smell", "missed", "scheduled"],
  low:      ["minor", "small", "litter", "aesthetic"],
};

// ── AI Classifier ─────────────────────────────────────────────────────────────
export interface ClassificationResult {
  category:   WasteCategory;
  severity:   ReportSeverity;
  confidence: number;
  tags:       string[];
  reasoning:  string;
}

export function classifyReport(description: string, imageMetadata?: string): ClassificationResult {
  const text = `${description} ${imageMetadata ?? ""}`.toLowerCase();

  // Score each category
  const categoryScores: Record<WasteCategory, number> = {
    organic: 0, recyclable: 0, hazardous: 0, general: 0, ewaste: 0, medical: 0,
  };
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [WasteCategory, string[]][]) {
    for (const kw of keywords) {
      if (text.includes(kw)) categoryScores[cat] += 1;
    }
  }

  // Pick best category, fallback to "general"
  const category = (Object.entries(categoryScores) as [WasteCategory, number][])
    .sort((a, b) => b[1] - a[1])[0][0] ?? "general";

  // Score severity
  const severityScores: Record<ReportSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS) as [ReportSeverity, string[]][]) {
    for (const kw of keywords) {
      if (text.includes(kw)) severityScores[sev] += 1;
    }
  }

  const severity: ReportSeverity =
    severityScores.critical > 0 ? "critical" :
    severityScores.high     > 0 ? "high"     :
    severityScores.medium   > 0 ? "medium"   : "low";

  // Build tags from matched keywords
  const tags: string[] = [];
  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw) && !tags.includes(kw)) tags.push(kw);
    }
  }

  // Confidence based on keyword hits + a stochastic factor
  const totalHits = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  const baseConf  = Math.min(0.5 + totalHits * 0.08, 0.97);
  const confidence = parseFloat((baseConf + (Math.random() * 0.04 - 0.02)).toFixed(3));

  const reasoning =
    `Detected ${totalHits} keyword signal(s). ` +
    `Dominant category: "${category}" (score ${categoryScores[category]}). ` +
    `Severity escalation triggered by: [${tags.slice(0, 3).join(", ")}].`;

  return { category, severity, confidence, tags: tags.slice(0, 6), reasoning };
}

// ── Nearest-truck assignment ───────────────────────────────────────────────────
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R  = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function assignTruck(reportLocation: GeoPoint): string | null {
  const available = trucks.filter((t) => t.status !== "maintenance" && t.currentLoadKg < t.capacityKg * 0.9);
  if (available.length === 0) return null;

  const nearest = available.sort(
    (a, b) => haversineKm(a.location, reportLocation) - haversineKm(b.location, reportLocation)
  )[0];

  return nearest.id;
}

// ── Submit a new report ────────────────────────────────────────────────────────
export interface ReportSubmission {
  description: string;
  location:    GeoPoint;
  citizenId:   string;
  imageHash?:  string;
}

export function submitReport(submission: ReportSubmission): WasteReport {
  const ai          = classifyReport(submission.description, submission.imageHash ?? "");
  const truckId     = assignTruck(submission.location);
  const now         = new Date();

  const report: WasteReport = {
    id:             `RPT-${String(reports.length + 1).padStart(4, "0")}`,
    reportedAt:     now,
    location:       submission.location,
    category:       ai.category,
    severity:       ai.severity,
    description:    submission.description,
    imageHash:      submission.imageHash ?? null,
    aiConfidence:   ai.confidence,
    aiTags:         ai.tags,
    status:         truckId ? "assigned" : "pending",
    assignedTruckId: truckId,
    citizenId:      submission.citizenId,
    resolvedAt:     null,
  };

  reports.push(report);
  return report;
}

// ── Query helpers ─────────────────────────────────────────────────────────────
export function getReportsByStatus(status: WasteReport["status"]) {
  return reports.filter((r) => r.status === status);
}

export function getReportsBySeverity(severity: ReportSeverity) {
  return reports.filter((r) => r.severity === severity);
}

export function getCriticalReports() {
  return reports.filter((r) => r.severity === "critical" || r.severity === "high");
}

export function getReportStats() {
  const total    = reports.length;
  const byStatus = Object.fromEntries(
    (["pending", "assigned", "resolved", "rejected"] as const).map((s) => [
      s, reports.filter((r) => r.status === s).length,
    ])
  );
  const bySeverity = Object.fromEntries(
    (["critical", "high", "medium", "low"] as const).map((s) => [
      s, reports.filter((r) => r.severity === s).length,
    ])
  );
  const avgConfidence =
    reports.reduce((sum, r) => sum + r.aiConfidence, 0) / total;

  return { total, byStatus, bySeverity, avgConfidence: parseFloat(avgConfidence.toFixed(3)) };
}
