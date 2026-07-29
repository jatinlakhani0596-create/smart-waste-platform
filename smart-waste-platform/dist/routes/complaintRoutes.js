import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { createComplaint, getComplaintById, listComplaints } from "../services/complaintService.js";
const router = Router();
router.post("/complaints", authenticate, (req, res) => {
    const { title, description, ward, location, voiceText, imageUrl } = req.body;
    if (!title || !description || !ward || !location || !location.lat || !location.lng || !location.address) {
        return res.status(400).json({ error: "Missing complaint payload fields" });
    }
    const complaint = createComplaint({
        citizenId: req.user?.userId ?? "anonymous",
        ward,
        location,
        title,
        description,
        voiceText,
        imageUrl,
    });
    return res.status(201).json(complaint);
});
router.get("/complaints/:id", authenticate, (req, res) => {
    const complaint = getComplaintById(req.params.id);
    if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
    }
    return res.json(complaint);
});
router.get("/complaints", authenticate, (req, res) => {
    return res.json(listComplaints());
});
export default router;
