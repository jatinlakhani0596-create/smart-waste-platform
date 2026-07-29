import { verifyToken } from "../services/jwtService.js";
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing" });
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = payload;
    next();
}
export function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (req.user.role !== role && req.user.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}
