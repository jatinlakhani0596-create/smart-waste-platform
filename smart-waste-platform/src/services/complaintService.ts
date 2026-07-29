import { db } from "./db.js";
import { analyzeComplaintText } from "../agents/GrievanceIntakeAgent.js";
import type { ComplaintCategory, ComplaintStatus, ReportSeverity, GeoPoint } from "../data/models.js";

export interface ComplaintPayload {
  citizenId: string;
  ward: string;
  location: GeoPoint;
  title: string;
  description: string;
  voiceText?: string;
  imageUrl?: string | null;
}

export function createComplaint(payload: ComplaintPayload) {
  const analysis = analyzeComplaintText(payload.description + (payload.voiceText ? ` ${payload.voiceText}` : ""));
  const complaint = {
    id: `CMP-${String(db.complaints.length + 1001).padStart(4, "0")}`,
    createdAt: new Date(),
    citizenId: payload.citizenId,
    ward: payload.ward,
    location: payload.location,
    category: analysis.category as ComplaintCategory,
    severity: analysis.priority as ReportSeverity,
    status: "pending" as ComplaintStatus,
    title: payload.title,
    description: payload.description,
    voiceText: payload.voiceText,
    imageUrl: payload.imageUrl ?? null,
    aiSummary: analysis.summary,
    assignedDepartment: analysis.department,
    escalatedAt: null,
    updatedAt: new Date(),
  };

  db.complaints.unshift(complaint);
  // persist and notify
  import("./db.js").then(({ persistState }) => persistState().catch(() => {})).catch(()=>{});
  import("./socket.js").then(({ emit }) => emit('complaint:created', complaint)).catch(()=>{});
  return complaint;
}

export function getComplaintById(id: string) {
  return db.complaints.find((entry) => entry.id === id) ?? null;
}

export function listComplaints() {
  return db.complaints.slice(0, 50);
}
