import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getDashboardStats, getWardReport } from "../services/analyticsService.js";

const router = Router();

router.get("/analytics/dashboard", (req, res) => {
  return res.json(getDashboardStats());
});

router.get("/analytics/ward/:id", (req, res) => {
  const report = getWardReport(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Ward not found" });
  }
  return res.json(report);
});

export default router;
