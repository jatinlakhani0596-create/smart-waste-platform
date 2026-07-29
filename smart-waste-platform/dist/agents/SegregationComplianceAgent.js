import { db } from "../services/db.js";
export function getComplianceForHousehold(householdId) {
    return db.householdCompliance.find((entry) => entry.householdId === householdId) ?? null;
}
export function updateHouseholdCompliance(householdId, score, language) {
    let record = db.householdCompliance.find((entry) => entry.householdId === householdId);
    if (!record) {
        record = {
            householdId,
            ward: "12",
            complianceScore: score,
            lastUpdated: new Date(),
            remindersSent: 0,
            preferredLanguage: language,
        };
        db.householdCompliance.push(record);
    }
    else {
        record.complianceScore = score;
        record.lastUpdated = new Date();
        record.preferredLanguage = language;
    }
    // persist and notify
    import("../services/db.js").then(({ persistState }) => persistState().catch(() => { })).catch(() => { });
    import("../services/socket.js").then(({ emit }) => emit('compliance:updated', record)).catch(() => { });
    return record;
}
export function buildMultilingualReminder(householdId, score, language) {
    const messages = {
        en: `Reminder: Please separate your waste correctly. Your compliance score is ${score}%.`,
        hi: `स्मरण: कृपया अपने कचरे को सही तरीके से अलग करें। आपकी अनुपालन स्कोर ${score}% है।`,
        gu: `યાદ અપાવવું: કૃપા કરીને તમારો કચરો યોગ્ય રીતે અલગ કરો. તમારી અનુરૂપતા સ્કોર ${score}% છે.`,
    };
    return messages[language];
}
