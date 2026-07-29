// ─── Core Domain Models ───────────────────────────────────────────────────────

export type WasteCategory =
  | "organic"
  | "recyclable"
  | "hazardous"
  | "general"
  | "ewaste"
  | "medical";

export type BinStatus = "empty" | "partial" | "full" | "overflow" | "damaged";

export type TruckStatus = "idle" | "on-route" | "collecting" | "at-depot" | "maintenance";

export type ReportSeverity = "low" | "medium" | "high" | "critical";

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
  zone: string;
}

export interface WasteBin {
  id: string;
  location: GeoPoint;
  category: WasteCategory;
  capacityLiters: number;
  fillLevel: number;       // 0–100 percent
  status: BinStatus;
  lastCollected: Date;
  nextScheduled: Date;
  sensorBattery: number;   // 0–100 percent
}

export interface WasteReport {
  id: string;
  reportedAt: Date;
  location: GeoPoint;
  category: WasteCategory;
  severity: ReportSeverity;
  description: string;
  imageHash: string | null;
  aiConfidence: number;    // 0–1
  aiTags: string[];
  status: "pending" | "assigned" | "resolved" | "rejected";
  assignedTruckId: string | null;
  citizenId: string;
  resolvedAt: Date | null;
}

export interface CollectionRoute {
  id: string;
  truckId: string;
  date: Date;
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  optimizationScore: number;   // 0–100 — higher = better route
  status: "planned" | "active" | "completed" | "aborted";
  fuelSavedLiters: number;
  co2SavedKg: number;
}

export interface RouteStop {
  sequence: number;
  binId: string;
  location: GeoPoint;
  arrivalEta: Date;
  collectedKg: number | null;
  completedAt: Date | null;
}

export interface CollectionTruck {
  id: string;
  licensePlate: string;
  capacityKg: number;
  currentLoadKg: number;
  status: TruckStatus;
  driverName: string;
  location: GeoPoint;
  fuelLevel: number;       // 0–100 percent
  lastService: Date;
}

export interface SegregationRecord {
  id: string;
  binId: string;
  recordedAt: Date;
  expectedCategory: WasteCategory;
  detectedCategories: { category: WasteCategory; percentage: number }[];
  contaminationLevel: number;   // 0–100 percent
  complianceScore: number;      // 0–100 percent
  zone: string;
  citizenFeedbackSent: boolean;
}

export interface MunicipalStats {
  date: Date;
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
  zoneBreakdown: ZoneStat[];
}

export interface ZoneStat {
  zone: string;
  bins: number;
  overflowBins: number;
  collectedTons: number;
  compliancePercent: number;
  openReports: number;
}

export type UserRole = "citizen" | "sanitation" | "supervisor" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  ward: string;
  registeredAt: Date;
}

export type ComplaintCategory =
  | "missed-collection"
  | "overflow"
  | "illegal-dumping"
  | "mixed-waste"
  | "broken-bin"
  | "burning"
  | "other";

export type ComplaintStatus = "pending" | "in-review" | "assigned" | "resolved" | "escalated";

export interface Complaint {
  id: string;
  createdAt: Date;
  citizenId: string;
  ward: string;
  location: GeoPoint;
  category: ComplaintCategory;
  severity: ReportSeverity;
  status: ComplaintStatus;
  title: string;
  description: string;
  voiceText?: string;
  imageUrl?: string | null;
  aiSummary: string;
  assignedDepartment: string;
  escalatedAt: Date | null;
  updatedAt: Date;
}

export interface HouseholdCompliance {
  householdId: string;
  ward: string;
  complianceScore: number;
  lastUpdated: Date;
  remindersSent: number;
  preferredLanguage: "en" | "hi" | "gu";
}

export interface WardMetadata {
  id: string;
  name: string;
  population: number;
  dailyPickupTarget: number;
  pendingComplaints: number;
  complianceRate: number;
  region: string;
}

export interface AiDocument {
  id: string;
  title: string;
  content: string;
  source: string;
}
