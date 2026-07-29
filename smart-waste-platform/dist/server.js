import app from "./app.js";
import dotenv from "dotenv";
import http from "http";
import { initSocket } from "./services/socket.js";
dotenv.config();
const port = Number(process.env.PORT ?? 3000);
const server = http.createServer(app);
initSocket(server);
server.listen(port, () => {
    console.log(`Municipal Waste Management Agent running at http://localhost:${port}`);
});
