import bcrypt from "bcryptjs";
import { db } from "./db.js";
import type { AppUser } from "../data/models.js";

const saltRounds = 10;

export async function registerUser(name: string, email: string, password: string, ward: string): Promise<AppUser> {
  const existing = db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);
  const user: AppUser = {
    id: `USR-${String(db.users.length + 1001).padStart(4, "0")}`,
    name,
    email,
    passwordHash,
    role: "citizen",
    ward,
    registeredAt: new Date(),
  };

  db.users.push(user);
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<AppUser | null> {
  const user = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const matched = await bcrypt.compare(password, user.passwordHash);
  return matched ? user : null;
}
