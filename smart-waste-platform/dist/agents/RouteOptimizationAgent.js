export function buildRoutePlan(trucks, complaints) {
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
