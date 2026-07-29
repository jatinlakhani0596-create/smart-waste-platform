import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET ?? "municipal-secret-key";
const expiresIn = "12h";
export function signToken(user) {
    return jwt.sign({ userId: user.id, role: user.role, email: user.email }, secret, {
        expiresIn,
    });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, secret);
    }
    catch {
        return null;
    }
}
