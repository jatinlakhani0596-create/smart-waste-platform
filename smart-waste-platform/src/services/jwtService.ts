import jwt from "jsonwebtoken";
import type { AppUser } from "../data/models.js";

const secret = process.env.JWT_SECRET ?? "municipal-secret-key";
const expiresIn = "12h";

export interface JwtPayload {
  userId: string;
  role: AppUser["role"];
  email: string;
}

export function signToken(user: AppUser): string {
  return jwt.sign({ userId: user.id, role: user.role, email: user.email } as JwtPayload, secret, {
    expiresIn,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch {
    return null;
  }
}
