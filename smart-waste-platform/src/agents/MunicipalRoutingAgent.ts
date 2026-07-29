import type { Complaint } from "../data/models.js";

export function assignComplaintDepartment(complaint: Complaint) {
  if (complaint.category === "illegal-dumping") return "Environmental Enforcement";
  if (complaint.category === "mixed-waste") return "Segregation Compliance Cell";
  if (complaint.category === "overflow") return "Ward Waste Disposal";
  if (complaint.category === "missed-collection") return "Ward Collection Team";
  if (complaint.category === "burning") return "Hazardous Response Unit";
  if (complaint.category === "broken-bin") return "Infrastructure Maintenance";
  return "Municipal Helpdesk";
}

export function escalateComplaint(complaint: Complaint) {
  const now = new Date();
  if (complaint.status !== "resolved" && !complaint.escalatedAt) {
    complaint.escalatedAt = now;
    complaint.status = "escalated";
  }
  return complaint;
}
