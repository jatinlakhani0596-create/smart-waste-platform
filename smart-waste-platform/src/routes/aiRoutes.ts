import { Router } from "express";
import { classifyIssue, routeRecommendation, answerWithRag, interpretComplaint } from "../services/aiService.js";

const router = Router();

router.post("/ai/classify", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text field is required" });
  }
  const result = await classifyIssue(text);
  return res.json(result);
});

router.post("/ai/route", async (req, res) => {
  const { ward, trafficLevel, wasteVolume } = req.body;
  if (!ward || !trafficLevel || wasteVolume == null) {
    return res.status(400).json({ error: "Ward, trafficLevel and wasteVolume are required" });
  }
  const result = await routeRecommendation({ ward, trafficLevel, wasteVolume });
  return res.json(result);
});

router.post("/ai/rag", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  const response = await answerWithRag(query);
  return res.json(response);
});

router.post("/ai/interpret", (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }
  const interpretation = interpretComplaint(text);
  return res.json(interpretation);
});

export default router;
