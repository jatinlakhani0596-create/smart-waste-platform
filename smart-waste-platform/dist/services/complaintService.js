import { db } from "./db.js";
import { analyzeComplaintText } from "../agents/GrievanceIntakeAgent.js";
export function createComplaint(payload) {
    const analysis = analyzeComplaintText(payload.description + (payload.voiceText ? ` ${payload.voiceText}` : ""));
    const complaint = {
        id: `CMP-${String(db.complaints.length + 1001).padStart(4, "0")}`,
        createdAt: new Date(),
        citizenId: payload.citizenId,
        ward: payload.ward,
        location: payload.location,
        category: analysis.category,
        severity: analysis.priority,
        status: "pending",
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
    import("./db.js").then(({ persistState }) => persistState().catch(() => { })).catch(() => { });
    import("./socket.js").then(({ emit }) => emit('complaint:created', complaint)).catch(() => { });
    return complaint;
}
export function getComplaintById(id) {
    return db.complaints.find((entry) => entry.id === id) ?? null;
}
export function listComplaints() {
    return db.complaints.slice(0, 50);
}
