"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateendpoint = void 0;
exports.deleteenpoint = deleteenpoint;
const prisma_1 = require("../lib/prisma");
const authorizations_1 = require("../lib/authorizations");
const jwt_1 = require("@auth/core/jwt");
async function webhookDelete(owner, repoName, githubhookId, githubAccessToken) {
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/hooks/${githubhookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${githubAccessToken}` },
    });
    if (ghRes.ok) {
        return { message: "true" };
    }
    return { message: "false" };
}
const updateendpoint = async (req, res) => {
    try {
        const token = await (0, jwt_1.getToken)({
            req: { headers: new Headers(req.headers) },
            secret: process.env.AUTH_SECRET
        });
        const userId = req.userId;
        const { events, endpointId, repo, endpointName } = req.body;
        console.log("updating endpoint", endpointId, endpointName);
        const getendpoint = await (0, authorizations_1.checkEndpointOwnership)(endpointId, userId);
        if ("error" in getendpoint)
            return res.status(getendpoint.status).json({ error: getendpoint.error });
        if (!('endpoint' in getendpoint))
            return res.status(404).json({ error: 'Endpoint not found' });
        const endpoint = getendpoint.endpoint;
        if (endpointName) {
            console.log("updating name");
            const updateName = await prisma_1.prisma.endpoint.update({
                where: {
                    id: endpoint.id
                },
                data: {
                    name: endpointName
                }
            });
            if (!updateName) {
                return res.status(400).json({ error: "failed to update name" });
            }
            return res.status(201).json({ message: "name updated successfully" });
        }
        let owner, repoName;
        if (endpoint.githubRepo && typeof endpoint.githubRepo === "string") {
            [owner, repoName] = endpoint.githubRepo.split("/");
        }
        const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/hooks/${endpoint.githubhookId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token?.githubAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ events }),
        });
        if (ghRes.ok) {
            const update = await prisma_1.prisma.endpoint.update({
                where: {
                    id: endpoint.id,
                    githubRepoId: endpoint.githubRepoId,
                },
                data: {
                    events: events
                }
            });
            return res.status(201).json(update);
        }
        return res.status(400).json({ error: "failed to updated webhook" });
    }
    catch (error) {
        return res.status(500).json(error);
    }
};
exports.updateendpoint = updateendpoint;
async function deleteenpoint(req, res) {
    try {
        const token = await (0, jwt_1.getToken)({
            req: { headers: new Headers(req.headers) },
            secret: process.env.AUTH_SECRET
        });
        const { endpointId, message } = req.body;
        const userId = req.userId;
        const checkowner = await (0, authorizations_1.checkEndpointOwnership)(endpointId, userId);
        if (('error' in checkowner))
            return res.status(checkowner.status).json({ error: checkowner.error });
        if (!('endpoint' in checkowner))
            return res.status(404).json({ error: 'Endpoint not found' });
        const endpoint = checkowner.endpoint;
        let owner, repoName;
        if (endpoint.githubRepo && typeof endpoint.githubRepo === "string") {
            [owner, repoName] = endpoint.githubRepo.split("/");
        }
        if (owner && repoName && endpoint.githubhookId && token?.githubAccessToken && message === 'disconnect') {
            const response = await webhookDelete(owner, repoName, endpoint.githubhookId, token?.githubAccessToken);
            if (response.message) {
                await prisma_1.prisma.endpoint.update({ where: { id: endpoint.id }, data: { githubhookId: null } });
                return res.status(200).json({ message: "successfully disconnected " });
            }
            else {
                return res.status(400).json({ error: "failed to disconnect" });
            }
        }
        else if (owner && repoName && endpoint.githubhookId && token?.githubAccessToken && message === 'delete') {
            const response = await webhookDelete(owner, repoName, endpoint.githubhookId, token?.githubAccessToken);
            if (response.message) {
                const deleteendpoint = await prisma_1.prisma.endpoint.delete({ where: { id: endpoint.id } });
                if (!deleteendpoint) {
                    return res.status(500).json({ error: "failed to delete endpoint" });
                }
                return res.status(200).json({ error: "endpoint deleted" });
            }
            else {
                return res.status(400).json({ error: "failed to disconnect" });
            }
        }
        else {
            await prisma_1.prisma.endpoint.delete({ where: { id: endpoint.id } });
            return res.status(200).json({ message: "endpoint deleted" });
        }
    }
    catch (error) {
        return res.status(500).json({ error: "internal server error" });
    }
}
