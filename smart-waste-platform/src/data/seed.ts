// ─── Seed / Mock Data ─────────────────────────────────────────────────────────
import type {
  WasteBin,
  WasteCategory,
  CollectionTruck,
  WasteReport,
  SegregationRecord,
  AppUser,
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  HouseholdCompliance,
  WardMetadata,
  AiDocument,
} from "./models.js";

const zones = ["North", "South", "East", "West", "Central"];

const addresses: Record<string, string[]> = {
  North:   ["12 Maple Ave", "34 Pine Rd", "56 Oak St", "78 Elm Blvd", "90 Cedar Ln"],
  South:   ["1 Harbor Dr", "22 Bay Rd", "44 Cove St", "66 Tide Ave", "88 Shore Blvd"],
  East:    ["5 Sunrise Rd", "17 Dawn St", "29 Morning Ave", "41 Dew Ln", "53 Horizon Dr"],
  West:    ["3 Sunset Blvd", "15 Dusk Rd", "27 Twilight St", "39 Glow Ave", "51 Amber Ln"],
  Central: ["100 Main St", "200 City Hall Rd", "300 Plaza Ave", "400 Metro Blvd", "500 Hub Ln"],
};

const geoForZone: Record<string, { lat: number; lng: number }> = {
  North:   { lat: 40.78, lng: -73.96 },
  South:   { lat: 40.68, lng: -74.01 },
  East:    { lat: 40.73, lng: -73.88 },
  West:    { lat: 40.73, lng: -74.08 },
  Central: { lat: 40.73, lng: -73.98 },
};

function rnd(min: number, max: number, decimals = 0): number {
  const v = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.floor(v);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ── Bins ──────────────────────────────────────────────────────────────────────
const categories = ["organic", "recyclable", "hazardous", "general", "ewaste", "medical"] as const;
const statuses   = ["empty", "partial", "full", "overflow", "damaged"] as const;

export const bins: WasteBin[] = Array.from({ length: 30 }, (_, i) => {
  const zone    = zones[i % zones.length];
  const addrIdx = Math.floor(i / zones.length) % 5;
  const fill    = rnd(5, 105);          // allow slight overflow
  const clipped = Math.min(fill, 100);
  let status: WasteBin["status"] =
    fill >= 100 ? "overflow" : fill >= 80 ? "full" : fill >= 40 ? "partial" : "empty";
  if (i % 15 === 0) status = "damaged";

  return {
    id:            `BIN-${String(i + 1).padStart(3, "0")}`,
    location: {
      lat:     geoForZone[zone].lat + rnd(-5, 5, 3) / 100,
      lng:     geoForZone[zone].lng + rnd(-5, 5, 3) / 100,
      address: addresses[zone][addrIdx],
      zone,
    },
    category:       categories[i % categories.length],
    capacityLiters: [120, 240, 360, 660, 1100][i % 5],
    fillLevel:      clipped,
    status,
    lastCollected:  daysAgo(rnd(1, 7)),
    nextScheduled:  daysFromNow(rnd(1, 3)),
    sensorBattery:  rnd(15, 100),
  };
});

// ── Trucks ────────────────────────────────────────────────────────────────────
const driverNames = ["Alex Turner", "Maria Santos", "James Okafor", "Priya Nair", "Chen Wei"];
const truckStatuses: CollectionTruck["status"][] = ["on-route", "collecting", "idle", "on-route", "at-depot"];

export const trucks: CollectionTruck[] = driverNames.map((name, i) => {
  const zone = zones[i];
  return {
    id:            `TRK-${String(i + 1).padStart(2, "0")}`,
    licensePlate:  `WM-${1000 + i * 111}`,
    capacityKg:    5000,
    currentLoadKg: rnd(500, 4200),
    status:        truckStatuses[i],
    driverName:    name,
    location: {
      lat:     geoForZone[zone].lat + rnd(-2, 2, 3) / 100,
      lng:     geoForZone[zone].lng + rnd(-2, 2, 3) / 100,
      address: `Depot ${zone}`,
      zone,
    },
    fuelLevel:    rnd(30, 100),
    lastService:  daysAgo(rnd(10, 60)),
  };
});

// ── Reports ───────────────────────────────────────────────────────────────────
const reportDescs = [
  "Overflowing bin near the bus stop, waste spilling on sidewalk.",
  "Illegal dumping of construction debris in the alley.",
  "Medical waste improperly disposed of in a general bin.",
  "Burning smell from a bin, possible hazardous waste.",
  "Recyclable bin full despite recent schedule — missed collection.",
  "E-waste (TV, monitor) left on the footpath.",
  "Dead animal near waste collection point.",
  "Broken bin lid — waste exposed to rain.",
  "Bin relocated by residents, not at designated GPS point.",
  "Large-scale littering after street fair event.",
];

const reportStatuses = ["pending", "assigned", "resolved", "resolved", "pending"] as const;

export const reports: WasteReport[] = Array.from({ length: 20 }, (_, i) => {
  const zone = zones[i % zones.length];
  const cat  = categories[i % categories.length];
  const sev: WasteReport["severity"] =
    i % 5 === 0 ? "critical" : i % 4 === 0 ? "high" : i % 3 === 0 ? "medium" : "low";

  return {
    id:             `RPT-${String(i + 1).padStart(4, "0")}`,
    reportedAt:     daysAgo(rnd(0, 10)),
    location: {
      lat:     geoForZone[zone].lat + rnd(-8, 8, 3) / 100,
      lng:     geoForZone[zone].lng + rnd(-8, 8, 3) / 100,
      address: addresses[zone][i % 5],
      zone,
    },
    category:        cat,
    severity:        sev,
    description:     reportDescs[i % reportDescs.length],
    imageHash:       i % 3 !== 0 ? `sha256:${Math.random().toString(36).slice(2)}` : null,
    aiConfidence:    rnd(60, 99, 2) / 100,
    aiTags:          ["overflow", "litter", "hazard", "illegal-dump", "broken-bin"].slice(0, rnd(1, 4)),
    status:          reportStatuses[i % reportStatuses.length],
    assignedTruckId: i % 3 === 0 ? null : `TRK-0${(i % 5) + 1}`,
    citizenId:       `CIT-${String(1000 + i).padStart(5, "0")}`,
    resolvedAt:      reportStatuses[i % reportStatuses.length] === "resolved" ? daysAgo(rnd(0, 3)) : null,
  };
});

// ── Segregation Records ───────────────────────────────────────────────────────
export const segregationRecords: SegregationRecord[] = bins.slice(0, 20).map((bin, i) => {
  const contamination = rnd(0, 45);
  const compliance    = Math.max(0, 100 - contamination - rnd(0, 10));

  const detected: { category: WasteCategory; percentage: number }[] = [
    { category: bin.category, percentage: 100 - contamination },
  ];
  if (contamination > 5) {
    detected.push({ category: categories[(categories.indexOf(bin.category) + 1) % categories.length], percentage: contamination });
  }

  return {
    id:                   `SEG-${String(i + 1).padStart(4, "0")}`,
    binId:                bin.id,
    recordedAt:           daysAgo(rnd(0, 5)),
    expectedCategory:     bin.category,
    detectedCategories:   detected,
    contaminationLevel:   contamination,
    complianceScore:      compliance,
    zone:                 bin.location.zone,
    citizenFeedbackSent:  compliance < 70,
  };
});

export const users: AppUser[] = [
  {
    id: "USR-1001",
    name: "Anjali Patel",
    email: "anjali.patel@example.com",
    passwordHash: "$2a$10$Hn6C3xqRq0/whpP5GmCYwOKrFXN6t35cNt3BXxVjvYx7ZraNfrn8e",
    role: "citizen",
    ward: "Ward 12",
    registeredAt: daysAgo(45),
  },
  {
    id: "USR-1002",
    name: "Rohit Kumar",
    email: "rohit.kumar@example.com",
    passwordHash: "",
    role: "citizen",
    ward: "Ward 7",
    registeredAt: daysAgo(20),
  },
  {
    id: "USR-2001",
    name: "Meera Singh",
    email: "meera.singh@example.com",
    passwordHash: "",
    role: "supervisor",
    ward: "Ward 12",
    registeredAt: daysAgo(100),
  },
];

export const wardMetadata = [
  { id: "12", name: "Ward 12", population: 65000, dailyPickupTarget: 120, pendingComplaints: 14, complianceRate: 76, region: "North" },
  { id: "07", name: "Ward 7", population: 52000, dailyPickupTarget: 95, pendingComplaints: 9, complianceRate: 81, region: "South" },
  { id: "03", name: "Ward 3", population: 47000, dailyPickupTarget: 80, pendingComplaints: 6, complianceRate: 84, region: "East" },
];

export const householdCompliance: HouseholdCompliance[] = [
  { householdId: "HH-001", ward: "12", complianceScore: 72, lastUpdated: daysAgo(3), remindersSent: 2, preferredLanguage: "gu" },
  { householdId: "HH-002", ward: "07", complianceScore: 89, lastUpdated: daysAgo(1), remindersSent: 0, preferredLanguage: "en" },
  { householdId: "HH-003", ward: "03", complianceScore: 65, lastUpdated: daysAgo(7), remindersSent: 3, preferredLanguage: "hi" },
];

export const aiDocuments = [
  {
    id: "DOC-01",
    title: "Ward 12 Sanitation SOP",
    content: "All complaints related to missed pickups, overflow and mixed waste in Ward 12 must be routed to the Ward 12 Sanitation Department within 2 hours.",
    source: "Internal SOP",
  },
  {
    id: "DOC-02",
    title: "Segregation Guidelines",
    content: "Households must separate organic, recyclable, hazardous, medical, ewaste and general waste. Recyclable waste should be cleaned and dry before disposal.",
    source: "Municipal Guidelines",
  },
  {
    id: "DOC-03",
    title: "Complaint Escalation Rules",
    content: "Unresolved high-priority complaints escalate automatically after 24 hours to the supervisor and then to the municipal control room after 48 hours.",
    source: "Policy Document",
  },
];

export const complaints: Complaint[] = reports.map((r) => ({
  id: r.id,
  createdAt: r.reportedAt,
  citizenId: r.citizenId,
  ward: r.location.zone === "Central" ? "12" : r.location.zone === "North" ? "07" : "03",
  location: r.location,
  category: (r.description.toLowerCase().includes("medical") ? "mixed-waste" : r.description.toLowerCase().includes("overflow") ? "overflow" : "missed-collection") as ComplaintCategory,
  severity: r.severity,
  status: (r.status === "resolved" ? "resolved" : "pending") as ComplaintStatus,
  title: r.description.slice(0, 42),
  description: r.description,
  voiceText: undefined,
  imageUrl: null,
  aiSummary: `Auto-classified as ${r.description} issue with priority ${r.severity}.`,
  assignedDepartment: r.severity === "critical" || r.severity === "high" ? "Ward Sanitation Department" : "Local Waste Team",
  escalatedAt: r.status !== "resolved" && r.severity !== "low" ? daysAgo(1) : null,
  updatedAt: r.reportedAt,
}));
