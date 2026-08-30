"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireauth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireauth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1]; // "Bearer <token>" → grab the token part
    if (!token) {
        res.redirect(`${req.protocol}://localhost:3000/login`);
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // attach it for the route to use
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
;
