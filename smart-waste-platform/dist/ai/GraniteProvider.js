export class MockGraniteProvider {
    async classify(text) {
        const normalized = text.toLowerCase();
        const category = normalized.includes("overflow") ? "Overflow" : normalized.includes("missed") ? "Missed Collection" : normalized.includes("illegal") ? "Illegal Dumping" : "General Waste";
        const urgency = normalized.includes("3 days") || normalized.includes("urgent") || normalized.includes("critical") ? "High" : "Medium";
        return {
            category,
            urgency,
            suggestions: ["Dispatch nearest vehicle", "Notify ward supervisor", "Send citizen acknowledgement"],
        };
    }
    async embed(text) {
        return Array.from({ length: 32 }, (_, i) => ((text.charCodeAt(i % text.length) || 35) % 11) / 10);
    }
    async semanticSearch(query, documents, topK) {
        const normalized = query.toLowerCase();
        const scored = documents.map((doc) => {
            const score = doc.content.toLowerCase().split(/\s+/).reduce((acc, token) => acc + (normalized.includes(token) ? 1 : 0), 0);
            return { doc, score };
        });
        return scored.sort((a, b) => b.score - a.score).slice(0, topK).map((entry) => entry.doc);
    }
}
