import { Router } from "express";
import { registerUser, authenticateUser } from "../services/authService.js";
import { signToken } from "../services/jwtService.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, ward } = req.body;
    if (!name || !email || !password || !ward) {
      return res.status(400).json({ error: "Missing required user fields" });
    }

    const user = await registerUser(name, email, password, ward);
    const token = signToken(user);
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, ward: user.ward }, token });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, ward: user.ward }, token });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
