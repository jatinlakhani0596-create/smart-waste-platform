import { useEffect, useState } from "react";

interface DashboardData {
  totalWasteCollectedTons: number;
  recyclingRatePercent: number;
  segregationCompliancePercent: number;
  activeTrucks: number;
  totalBins: number;
  overflowBins: number;
  openReports: number;
  resolvedReports: number;
  avgRouteEfficiencyPercent: number;
  co2SavedKgThisMonth: number;
  fuelSavedLitersThisMonth: number;
  zoneBreakdown: Array<{ zone: string; bins: number; overflowBins: number; collectedTons: number; compliancePercent: number; openReports: number }>;
}

function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((resp) => resp.json())
      .then((data) => setDashboard(data))
      .catch((e) => setError("Unable to load dashboard data"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Smart City Waste Management</p>
              <h1 className="text-4xl font-semibold tracking-tight">Municipal Waste Management Agent</h1>
            </div>
            <div className="rounded-3xl border border-slate-700 bg-slate-900/80 px-5 py-4 text-slate-300">
              <p className="text-sm">Live API status</p>
              <p className="mt-1 text-lg font-medium text-emerald-300">{dashboard ? "Connected" : error ? "Offline" : "Loading..."}</p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl bg-rose-950/60 border border-rose-800 p-6 text-rose-200">
            <p>{error}</p>
          </div>
        ) : dashboard ? (
          <main className="space-y-8">
            <section className="grid gap-4 md:grid-cols-3">
              {(() => {
                const items = [
                  { label: "Waste collected today", value: `${dashboard.totalWasteCollectedTons ?? 0} tonnes` },
                  { label: "Recycling rate", value: `${dashboard.recyclingRatePercent ?? 0}%` },
                  { label: "Segregation compliance", value: `${dashboard.segregationCompliancePercent ?? 0}%` },
                  { label: "Open complaints", value: String(dashboard.openReports ?? 0) },
                  { label: "Resolved complaints", value: String(dashboard.resolvedReports ?? 0) },
                  { label: "Route efficiency", value: `${dashboard.avgRouteEfficiencyPercent ?? 0}%` },
                ];
                return items.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                  </div>
                ));
              })()}
            </section>

            <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Ward Analytics</h2>
                  <p className="text-slate-400">Heatmap-ready zone summaries and monthly compliance trends.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/90 text-slate-300">
                    <tr>
                      <th className="border-b border-slate-800 px-4 py-3">Ward</th>
                      <th className="border-b border-slate-800 px-4 py-3">Bins</th>
                      <th className="border-b border-slate-800 px-4 py-3">Overflow</th>
                      <th className="border-b border-slate-800 px-4 py-3">Collected</th>
                      <th className="border-b border-slate-800 px-4 py-3">Compliance</th>
                      <th className="border-b border-slate-800 px-4 py-3">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard.zoneBreakdown || []).map((zone) => (
                      <tr key={zone.zone} className="border-b border-slate-800/80">
                        <td className="px-4 py-4">{zone.zone}</td>
                        <td className="px-4 py-4">{zone.bins}</td>
                        <td className="px-4 py-4">{zone.overflowBins}</td>
                        <td className="px-4 py-4">{zone.collectedTons} t</td>
                        <td className="px-4 py-4">{zone.compliancePercent}%</td>
                        <td className="px-4 py-4">{zone.openReports}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        ) : (
          <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 text-slate-300">Loading dashboard...</div>
        )}
      </div>
    </div>
  );
}

export default App;
