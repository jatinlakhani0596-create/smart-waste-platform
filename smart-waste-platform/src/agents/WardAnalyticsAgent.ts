import { db } from "../services/db.js";
import type { WardMetadata } from "../data/models.js";

export function getWardAnalytics(wardId: string) {
  const ward = db.wards.find((entry) => entry.id === wardId);
  if (!ward) return null;

  const complaints = db.complaints.filter((entry) => entry.ward === ward.name || entry.ward === ward.id);
  const openCount = complaints.filter((entry) => entry.status !== "resolved").length;
  const criticalCount = complaints.filter((entry) => entry.severity === "critical").length;
  const recentHistory = complaints.slice(0, 10).map((entry) => ({ id: entry.id, title: entry.title, status: entry.status, severity: entry.severity, updatedAt: entry.updatedAt }));

  return {
    ward,
    complaintCount: complaints.length,
    openCount,
    criticalCount,
    averageCompliance: ward.complianceRate,
    recentHistory,
    collectionEfficiency: Math.max(0, 100 - openCount * 2),
    vehicleUtilization: Math.round((db.trucks.filter((truck) => truck.location.zone === ward.region).length / Math.max(1, db.trucks.length)) * 100),
  };
}
