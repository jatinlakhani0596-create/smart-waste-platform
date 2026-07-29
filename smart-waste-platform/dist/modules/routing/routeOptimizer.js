// ─── Route Optimization Engine ────────────────────────────────────────────────
//
// Uses a greedy Nearest-Neighbour heuristic (with 2-opt improvement passes)
// to build optimal collection routes for a given set of trucks and bins.
// Accounts for: bin fill level priority, truck capacity, fuel efficiency.
// ─────────────────────────────────────────────────────────────────────────────
import { bins, trucks } from "../../data/seed.js";
// ── Geo utils ─────────────────────────────────────────────────────────────────
function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
}
function routeDistance(stops) {
    let total = 0;
    for (let i = 1; i < stops.length; i++) {
        total += haversineKm(stops[i - 1], stops[i]);
    }
    return total;
}
// ── Priority scoring for bins ─────────────────────────────────────────────────
function binPriority(bin) {
    let score = bin.fillLevel;
    if (bin.status === "overflow")
        score += 30;
    if (bin.status === "damaged")
        score += 20;
    if (bin.category === "medical" || bin.category === "hazardous")
        score += 25;
    const daysSinceCollection = (Date.now() - bin.lastCollected.getTime()) / (1000 * 60 * 60 * 24);
    score += daysSinceCollection * 2;
    return score;
}
// ── Greedy nearest-neighbour route builder ────────────────────────────────────
function buildGreedyRoute(startLocation, candidates, maxLoadKg) {
    const avgKgPerLiter = 0.3;
    let loadKg = 0;
    const route = [];
    const remaining = [...candidates];
    let current = startLocation;
    while (remaining.length > 0) {
        // Find nearest bin that fits in capacity
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < remaining.length; i++) {
            const bin = remaining[i];
            const wasteKg = (bin.fillLevel / 100) * bin.capacityLiters * avgKgPerLiter;
            if (loadKg + wasteKg > maxLoadKg)
                continue;
            const dist = haversineKm(current, bin.location);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        }
        if (bestIdx === -1)
            break; // truck full or no reachable bins
        const chosen = remaining.splice(bestIdx, 1)[0];
        route.push(chosen);
        loadKg += (chosen.fillLevel / 100) * chosen.capacityLiters * avgKgPerLiter;
        current = chosen.location;
    }
    return route;
}
// ── 2-opt improvement ─────────────────────────────────────────────────────────
function twoOpt(route, origin) {
    let improved = true;
    let best = [...route];
    while (improved) {
        improved = false;
        for (let i = 0; i < best.length - 1; i++) {
            for (let j = i + 2; j < best.length; j++) {
                const a = i === 0 ? origin : best[i - 1].location;
                const b = best[i].location;
                const c = best[j].location;
                const d = j + 1 < best.length ? best[j + 1].location : best[best.length - 1].location;
                const currentDist = haversineKm(a, b) + haversineKm(c, d);
                const swappedDist = haversineKm(a, c) + haversineKm(b, d);
                if (swappedDist < currentDist - 0.001) {
                    // Reverse the segment [i..j]
                    const newRoute = [
                        ...best.slice(0, i),
                        ...best.slice(i, j + 1).reverse(),
                        ...best.slice(j + 1),
                    ];
                    best = newRoute;
                    improved = true;
                }
            }
        }
    }
    return best;
}
// ── Compute optimization score ─────────────────────────────────────────────────
function optimizationScore(optimizedDist, naiveDist, avgFill) {
    const distSaving = naiveDist > 0 ? ((naiveDist - optimizedDist) / naiveDist) * 50 : 0;
    const fillBonus = (avgFill / 100) * 30;
    const base = 20;
    return Math.min(100, Math.round(base + distSaving + fillBonus));
}
export function optimizeRoutes(minFillThreshold = 50) {
    // Only collect bins that need attention
    const priorityBins = bins
        .filter((b) => b.fillLevel >= minFillThreshold || b.status === "overflow" || b.status === "damaged")
        .sort((a, b) => binPriority(b) - binPriority(a));
    const allRoutes = [];
    const assigned = new Set();
    const now = new Date();
    // Assign routes per zone per available truck
    const availableTrucks = trucks.filter((t) => t.status !== "maintenance");
    for (const truck of availableTrucks) {
        const zoneBins = priorityBins.filter((b) => b.location.zone === truck.location.zone && !assigned.has(b.id));
        if (zoneBins.length === 0)
            continue;
        const greedyStops = buildGreedyRoute(truck.location, zoneBins, truck.capacityKg - truck.currentLoadKg);
        if (greedyStops.length === 0)
            continue;
        const optimizedStops = twoOpt(greedyStops, truck.location);
        // Naive distance (sequential bin order, no optimization)
        const naiveLocations = [truck.location, ...greedyStops.map((b) => b.location)];
        const optimizedLocations = [truck.location, ...optimizedStops.map((b) => b.location)];
        const naiveDist = routeDistance(naiveLocations);
        const optimizedDist = routeDistance(optimizedLocations);
        const distSaved = Math.max(0, naiveDist - optimizedDist);
        const fuelSaved = distSaved * 0.12; // ~0.12 L/km saved per truck
        const co2Saved = distSaved * 0.27; // ~0.27 kg CO2/km
        const avgFill = optimizedStops.reduce((s, b) => s + b.fillLevel, 0) / optimizedStops.length;
        const stops = optimizedStops.map((bin, idx) => {
            const eta = new Date(now.getTime() + (idx + 1) * 12 * 60 * 1000); // +12 min per stop
            return {
                sequence: idx + 1,
                binId: bin.id,
                location: bin.location,
                arrivalEta: eta,
                collectedKg: null,
                completedAt: null,
            };
        });
        const route = {
            id: `RTE-${truck.id}-${now.toISOString().slice(0, 10)}`,
            truckId: truck.id,
            date: now,
            stops,
            totalDistanceKm: parseFloat(optimizedDist.toFixed(2)),
            estimatedDurationMin: Math.round(optimizedStops.length * 12 + optimizedDist * 3),
            optimizationScore: optimizationScore(optimizedDist, naiveDist, avgFill),
            status: "planned",
            fuelSavedLiters: parseFloat(fuelSaved.toFixed(2)),
            co2SavedKg: parseFloat(co2Saved.toFixed(2)),
        };
        allRoutes.push(route);
        optimizedStops.forEach((b) => assigned.add(b.id));
    }
    const unassigned = priorityBins.filter((b) => !assigned.has(b.id));
    const totalDistSaved = allRoutes.reduce((s, r) => s + r.fuelSavedLiters / 0.12, 0);
    const totalCo2Saved = allRoutes.reduce((s, r) => s + r.co2SavedKg, 0);
    const totalFuelSaved = allRoutes.reduce((s, r) => s + r.fuelSavedLiters, 0);
    return {
        routes: allRoutes,
        unassignedBins: unassigned,
        totalDistanceSaved: parseFloat(totalDistSaved.toFixed(2)),
        co2SavedKg: parseFloat(totalCo2Saved.toFixed(2)),
        fuelSavedLiters: parseFloat(totalFuelSaved.toFixed(2)),
        summary: `${allRoutes.length} optimized routes generated for ${assigned.size} bins. ` +
            `${unassigned.length} bins unassigned (no truck available). ` +
            `Total CO₂ saved: ${totalCo2Saved.toFixed(1)} kg. ` +
            `Fuel saved: ${totalFuelSaved.toFixed(1)} L.`,
    };
}
// ── Live route progress simulation ────────────────────────────────────────────
export function simulateRouteProgress(route) {
    const progressFraction = Math.random();
    const completedStops = Math.floor(route.stops.length * progressFraction);
    const updatedStops = route.stops.map((stop, idx) => {
        if (idx < completedStops) {
            const avgKgPerLiter = 0.3;
            const bin = bins.find((b) => b.id === stop.binId);
            return {
                ...stop,
                collectedKg: bin
                    ? parseFloat(((bin.fillLevel / 100) * bin.capacityLiters * avgKgPerLiter).toFixed(1))
                    : null,
                completedAt: new Date(stop.arrivalEta.getTime() + Math.random() * 5 * 60 * 1000),
            };
        }
        return stop;
    });
    return {
        ...route,
        stops: updatedStops,
        status: completedStops === route.stops.length ? "completed" : "active",
    };
}
