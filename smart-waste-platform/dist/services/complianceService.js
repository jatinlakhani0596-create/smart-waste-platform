import { getComplianceForHousehold, updateHouseholdCompliance, buildMultilingualReminder } from "../agents/SegregationComplianceAgent.js";
export function fetchHouseholdCompliance(householdId) {
    return getComplianceForHousehold(householdId);
}
export function saveHouseholdCompliance(householdId, score, language) {
    const record = updateHouseholdCompliance(householdId, score, language);
    const reminder = buildMultilingualReminder(householdId, score, language);
    return { record, reminder };
}
