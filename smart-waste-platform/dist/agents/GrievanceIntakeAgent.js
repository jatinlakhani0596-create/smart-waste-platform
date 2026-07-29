const categoryMap = {
    missed: "missed-collection",
    overflow: "overflow",
    illegal: "illegal-dumping",
    dump: "illegal-dumping",
    mixed: "mixed-waste",
    broken: "broken-bin",
    burn: "burning",
};
const departmentMap = {
    "missed-collection": "Ward Collection Team",
    overflow: "Ward Waste Disposal",
    "illegal-dumping": "Environmental Enforcement",
    "mixed-waste": "Segregation Compliance Cell",
    "broken-bin": "Infrastructure Maintenance",
    burning: "Hazardous Response Unit",
    other: "Municipal Helpdesk",
};
export function analyzeComplaintText(text) {
    const normalized = text.toLowerCase();
    let category = "other";
    let severity = "medium";
    let ward = "Ward 12";
    let locationHint = "Unknown location";
    for (const [token, cat] of Object.entries(categoryMap)) {
        if (normalized.includes(token)) {
            category = cat;
            break;
        }
    }
    if (normalized.includes("3 days") || normalized.includes("three days") || normalized.includes("missed pickup")) {
        severity = "high";
    }
    if (normalized.includes("fire") || normalized.includes("chemical") || normalized.includes("medical")) {
        severity = "critical";
    }
    if (normalized.includes("small") || normalized.includes("minor")) {
        severity = "low";
    }
    const wardMatch = normalized.match(/ward\s*(\d+)/i);
    if (wardMatch) {
        ward = `Ward ${wardMatch[1]}`;
    }
    const addressMatch = normalized.match(/(?:at|near|in)\s+([\w\s\d,-]+)/i);
    if (addressMatch) {
        locationHint = addressMatch[1].trim();
    }
    const summary = `Complaint classified as ${category.replace(/-/g, " ")} with ${severity.toUpperCase()} priority. ${departmentMap[category]} will respond.`;
    return {
        category,
        priority: severity,
        department: departmentMap[category],
        ward,
        locationHint,
        summary,
    };
}
