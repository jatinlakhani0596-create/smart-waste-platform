import { buildRoutePlan } from "../agents/RouteOptimizationAgent.js";
import { db } from "./db.js";
import { optimizeRoutes as optimizePlatformRoutes } from "../modules/routing/routeOptimizer.js";
export function planRoutesForDashboard() {
    return buildRoutePlan(db.trucks, db.complaints);
}
export function optimizeRoutes(minFillThreshold = 50) {
    return optimizePlatformRoutes(minFillThreshold);
}
