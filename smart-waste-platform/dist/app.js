import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { db } from "./services/db.js";
dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 3000);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.json({ message: "Municipal Waste Management Agent API", version: "1.0.0" });
});
app.use("/api", routes);
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
});
async function init() {
    await db.connect();
}
init().catch((error) => {
    console.error("Database initialization failed", error);
});
export default app;
