import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { planRoutesForDashboard, optimizeRoutes } from "../services/routingService.js";

const router = Router();

router.post("/routes/optimize", authenticate, (req, res) => {
  const { minFillThreshold } = req.body;
  const result = optimizeRoutes(minFillThreshold ?? 50);
  return res.json(result);
});

router.get("/routes/plan", authenticate, (req, res) => {
  const plan = planRoutesForDashboard();
  return res.json(plan);
});

export default router;
