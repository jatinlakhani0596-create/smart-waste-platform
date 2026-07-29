import { getWardAnalytics } from "../agents/WardAnalyticsAgent.js";
import { buildDashboardStats } from "../modules/dashboard/dashboardService.js";

export function getDashboardStats() {
  return buildDashboardStats();
}

export function getWardReport(wardId: string) {
  return getWardAnalytics(wardId);
}
