import { Response, Request } from "express";

import { getToken } from "@auth/core/jwt";

export const listGithubRepos = async (req: Request, res: Response) => {
    const token = await getToken({
        req: { headers: new Headers(req.headers as Record<string, string>) },
        secret: process.env.AUTH_SECRET!,
    });
    if (!token?.githubAccessToken) {
        return res.status(400).json({ error: "GitHub not connected" });
    }
    console.log('token mil gaya', token.githubAccessToken)
    const ghRes = await fetch("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${token.githubAccessToken}` },
    });
    const repos = await ghRes.json();
    return res.status(200).json(repos);
};
