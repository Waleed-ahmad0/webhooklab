"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getdeliveries = getdeliveries;
const authorizations_1 = require("../lib/authorizations");
const jwt_1 = require("@auth/core/jwt");
async function getdeliveries(req, res) {
    try {
        const token = await (0, jwt_1.getToken)({
            req: { headers: new Headers(req.headers) },
            secret: process.env.AUTH_SECRET
        });
        const { endpointId } = req.params;
        const userId = req.userId;
        const ownercheck = await (0, authorizations_1.checkEndpointOwnership)(endpointId, userId);
        if ("error" in ownercheck) {
            return res.status(ownercheck.status).json({ error: ownercheck.error });
        }
        if (!('endpoint' in ownercheck))
            return res.status(404).json({ error: 'Endpoint not found' });
        const endpointdetails = ownercheck.endpoint;
        const githubRepo = endpointdetails.githubRepo;
        if (!githubRepo) {
            return res.status(400).json({ error: 'GitHub repo not configured for this endpoint' });
        }
        const [owner, repo] = githubRepo.split('/');
        const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks/${endpointdetails.githubhookId}/deliveries`, {
            headers: {
                Authorization: `Bearer ${token?.githubAccessToken}`,
                "Content-Type": "application/json",
            }
        });
        const deliveries = await ghRes.json();
        return res.status(200).json(deliveries);
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
