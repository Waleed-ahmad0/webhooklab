"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const express_1 = require("@auth/express");
const auth_1 = require("../lib/auth");
const requireAuth = async (req, res, next) => {
    try {
        const session = await (0, express_1.getSession)(req, auth_1.authConfig);
        if (!session)
            return res.status(401).json({ error: "Not authenticated" });
        req.userId = session.user.id;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "error" });
    }
};
exports.requireAuth = requireAuth;
