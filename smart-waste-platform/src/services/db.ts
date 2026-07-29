import mongoose from "mongoose";
import { aiDocuments, complaints, householdCompliance, reports, segregationRecords, users, wardMetadata, bins, trucks } from "../data/seed.js";
import type { AppUser, AiDocument, Complaint, HouseholdCompliance, WardMetadata } from "../data/models.js";

export interface DbProvider {
  connect(): Promise<void>;
  users: AppUser[];
  complaints: Complaint[];
  wards: WardMetadata[];
  householdCompliance: HouseholdCompliance[];
  aiDocuments: AiDocument[];
  bins: typeof bins;
  trucks: typeof trucks;
  reports: typeof reports;
  segregationRecords: typeof segregationRecords;
}

const mongoUri = process.env.MONGODB_URI ?? "";

import { loadState, saveState } from "./fileDb.js";

export const db: DbProvider = {
  async connect() {
    if (mongoUri) {
      await mongoose.connect(mongoUri, {
        dbName: process.env.MONGODB_DB ?? "municipal_waste_agent",
      });
      console.log("Connected to MongoDB at", mongoUri);
      return;
    }
    console.log("Using mock in-memory data store (file-backed)");
    const loaded = await loadState({ users, complaints, wards: wardMetadata, householdCompliance, aiDocuments, bins, trucks, reports, segregationRecords });
    // overwrite arrays in-place
    db.users = loaded.users ?? users;
    db.complaints = loaded.complaints ?? complaints;
    db.wards = loaded.wards ?? wardMetadata;
    db.householdCompliance = loaded.householdCompliance ?? householdCompliance;
    db.aiDocuments = loaded.aiDocuments ?? aiDocuments;
    db.bins = loaded.bins ?? bins;
    db.trucks = loaded.trucks ?? trucks;
    db.reports = loaded.reports ?? reports;
    db.segregationRecords = loaded.segregationRecords ?? segregationRecords;
  },
  users,
  complaints,
  wards: wardMetadata,
  householdCompliance,
  aiDocuments,
  bins,
  trucks,
  reports,
  segregationRecords,
};

export const seedData = {
  bins,
  trucks,
  reports,
  segregationRecords,
};

export async function persistState() {
  try {
    await saveState({ users: db.users, complaints: db.complaints, wards: db.wards, householdCompliance: db.householdCompliance, aiDocuments: db.aiDocuments, bins: db.bins, trucks: db.trucks, reports: db.reports, segregationRecords: db.segregationRecords });
  } catch (e) {
    console.error("Failed to persist state:", e);
  }
}

