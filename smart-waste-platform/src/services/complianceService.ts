import { getComplianceForHousehold, updateHouseholdCompliance, buildMultilingualReminder } from "../agents/SegregationComplianceAgent.js";

export function fetchHouseholdCompliance(householdId: string) {
  return getComplianceForHousehold(householdId);
}

export function saveHouseholdCompliance(householdId: string, score: number, language: "en" | "hi" | "gu") {
  const record = updateHouseholdCompliance(householdId, score, language);
  const reminder = buildMultilingualReminder(householdId, score, language);
  return { record, reminder };
}
