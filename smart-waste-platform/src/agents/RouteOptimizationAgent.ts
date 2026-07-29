import type { CollectionTruck, GeoPoint, Complaint } from "../data/models.js";

export interface RouteStopSummary {
  sequence: number;
  complaintId: string;
  location: GeoPoint;
  etaMinutes: number;
}

export interface RoutePlan {
  truckId: string;
  ward: string;
  stops: RouteStopSummary[];
  estimatedDurationMin: number;
  priorityScore: number;
}

export function buildRoutePlan(trucks: CollectionTruck[], complaints: Complaint[]) {
  const pending = complaints.filter((c) => c.status === "pending" || c.status === "in-review");

  return trucks.map((truck, truckIndex) => {
    const zoneComplaints = pending.filter((c) => c.ward.endsWith(truck.location.zone) || c.ward.includes(truck.location.zone));
    const selected = zoneComplaints.slice(0, 4);
    const stops = selected.map((complaint, idx) => ({
      sequence: idx + 1,
      complaintId: complaint.id,
      location: complaint.location,
      etaMinutes: (idx + 1) * 15,
    }));

    const priorityScore = selected.reduce((sum, complaint) => sum + (complaint.severity === "critical" ? 30 : complaint.severity === "high" ? 20 : 10), 0);
    return {
      truckId: truck.id,
      ward: truck.location.zone,
      stops,
      estimatedDurationMin: stops.length * 15 + 10,
      priorityScore,
    };
  }).filter((route) => route.stops.length > 0);
}
