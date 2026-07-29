import { MockGraniteProvider } from "../ai/GraniteProvider.js";
import { db } from "./db.js";
import { analyzeComplaintText } from "../agents/GrievanceIntakeAgent.js";
const provider = new MockGraniteProvider();
export async function classifyIssue(text) {
    const analysis = await provider.classify(text);
    return {
        category: analysis.category,
        urgency: analysis.urgency,
        department: analysis.suggestions[1] ?? "Ward Sanitation Department",
        suggestedAction: analysis.suggestions[0],
        citizenMessage: `Your report has been received. ${analysis.suggestions[2] ?? "We will respond shortly."}`,
        escalation: "24 hours if unresolved",
    };
}
export async function routeRecommendation(payload) {
    const suggestions = [`Prioritize ${payload.ward} route`, `Use alternate route if traffic is ${payload.trafficLevel}`, `Maintain ${payload.wasteVolume} ton capacity`];
    return {
        route: `Ward ${payload.ward} optimized route with ${payload.trafficLevel} traffic`,
        eta: `${Math.max(25, 60 - Math.floor(payload.wasteVolume / 2))} min`,
        suggestions,
    };
}
export async function answerWithRag(query) {
    const docs = await provider.semanticSearch(query, db.aiDocuments, 3);
    return {
        query,
        documents: docs,
        answer: `Based on municipal waste rules: ${docs.map((d) => d.title).join("; ")}`,
    };
}
export function interpretComplaint(text) {
    return analyzeComplaintText(text);
}
