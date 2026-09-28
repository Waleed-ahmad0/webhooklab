"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGithubRepos = void 0;
const jwt_1 = require("@auth/core/jwt");
const listGithubRepos = async (req, res) => {
    try {
        const token = await (0, jwt_1.getToken)({
            req: { headers: new Headers(req.headers) },
            secret: process.env.AUTH_SECRET,
        });
        if (!token?.githubAccessToken) {
            return res.status(400).json({ error: "GitHub not connected" });
        }
        const ghRes = await fetch("https://api.github.com/user/repos", {
            headers: { Authorization: `Bearer ${token.githubAccessToken}` },
        });
        const repos = await ghRes.json();
        return res.status(200).json(repos);
    }
    catch (error) {
        return res.status(500).json(error);
    }
};
exports.listGithubRepos = listGithubRepos;
