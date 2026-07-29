import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { fetchHouseholdCompliance, saveHouseholdCompliance } from "../services/complianceService.js";
const router = Router();
router.post("/compliance/update", authenticate, (req, res) => {
    const { householdId, score, language } = req.body;
    if (!householdId || score == null || !language) {
        return res.status(400).json({ error: "householdId, score and language are required" });
    }
    const result = saveHouseholdCompliance(householdId, Number(score), language);
    return res.json(result);
});
router.get("/compliance/:householdId", authenticate, (req, res) => {
    const record = fetchHouseholdCompliance(req.params.householdId);
    if (!record) {
        return res.status(404).json({ error: "Household record not found" });
    }
    return res.json(record);
});
export default router;
