"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpointRequests = exports.webhookendpoint = void 0;
exports.getAllWorkspaceEndpoints = getAllWorkspaceEndpoints;
exports.deleteAllWorkspaceEndpoints = deleteAllWorkspaceEndpoints;
const prisma_1 = require("../lib/prisma");
const authorizations_1 = require("../lib/authorizations");
const jwt_1 = require("@auth/core/jwt");
const webhookendpoint = async (req, res) => {
    try {
        const token = await (0, jwt_1.getToken)({
            req: { headers: new Headers(req.headers) },
            secret: process.env.AUTH_SECRET
        });
        const userId = req.userId;
        const { name, workspaceId, owner, events, githubRepoId, githubRepo } = req.body;
        const findworkspace = await prisma_1.prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (findworkspace?.ownerId !== userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        if (owner && githubRepoId && events) {
            const existingEndpoint = await prisma_1.prisma.endpoint.findFirst({
                where: {
                    workspaceId,
                    githubRepoId
                }
            });
            if (existingEndpoint) {
                return res.status(400).json({ error: "An endpoint for this GitHub repository already exists in this workspace." });
            }
            const selectedEvents = Array.isArray(events) && events.length > 0
                ? events.filter((event) => typeof event === 'string' && event.trim().length > 0)
                : ['*'];
            const tempEndpoint = await prisma_1.prisma.endpoint.create({
                data: {
                    name, workspaceId, githubRepoId, events: selectedEvents, githubRepo
                }
            });
            const ghRes = await fetch(`https://api.github.com/repos/${owner}/${name}/hooks`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token?.githubAccessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    config: {
                        url: `${process.env.BACKEND_URL}/webhook/api/h/${tempEndpoint.token}`,
                        content_type: "json",
                    },
                    events: selectedEvents,
                }),
            });
            const data = await ghRes.json();
            if (!ghRes.ok) {
                await prisma_1.prisma.endpoint.delete({
                    where: { id: tempEndpoint.id }
                });
            }
            else {
                await prisma_1.prisma.endpoint.update({
                    where: { token: tempEndpoint.token },
                    data: { githubhookId: data.id, },
                });
            }
            return res.status(ghRes.status).json(data);
        }
        else {
            const createEndpoint = await prisma_1.prisma.endpoint.create({
                data: {
                    name, workspaceId
                }
            });
            return res.status(201).json(createEndpoint);
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'server error 500 endpoint request hit' });
    }
};
exports.webhookendpoint = webhookendpoint;
const getEndpointRequests = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 25, 100);
        const skip = (page - 1) * limit;
        const { endpointId } = req.params;
        const userId = req.userId;
        const checkendpointowner = await (0, authorizations_1.checkEndpointOwnership)(endpointId, userId);
        if ("error" in checkendpointowner)
            return res.status(checkendpointowner.status).json({ error: checkendpointowner.error });
        const [requests, total] = await Promise.all([
            prisma_1.prisma.webhookRequest.findMany({
                where: { endpointId: endpointId },
                orderBy: { receivedAt: "desc" },
                skip,
                take: limit,
            }),
            prisma_1.prisma.webhookRequest.count({
                where: { endpointId: endpointId },
            }),
        ]);
        if (!('endpoint' in checkendpointowner))
            return res.status(404).json({ error: 'Endpoint not found' });
        const modify = {
            requests,
            workspaceName: checkendpointowner.workspace.name,
            endpointName: checkendpointowner.endpoint.name,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        return res.status(200).json(modify);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to fetch requests" });
    }
};
exports.getEndpointRequests = getEndpointRequests;
async function getAllWorkspaceEndpoints(req, res) {
    try {
        const userId = req.userId;
        const { workspaceId } = req.params;
        const checkworkspace = await (0, authorizations_1.checkWorkspaceOwnership)(workspaceId, userId);
        if ('error' in checkworkspace) {
            return res.status(checkworkspace.status).json({ error: checkworkspace.error });
        }
        const getallendpoints = await prisma_1.prisma.endpoint.findMany({ where: { workspaceId: workspaceId } });
        const addedworksapcename = { workspaceName: checkworkspace.workspace.name, endpoints: getallendpoints };
        return res.status(200).json(addedworksapcename);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
}
async function deleteAllWorkspaceEndpoints(req, res) {
    const userId = req.userId;
    const { workspaceId } = req.body;
    const token = await (0, jwt_1.getToken)({
        req: { headers: new Headers(req.headers) },
        secret: process.env.AUTH_SECRET
    });
    if (!workspaceId) {
        return res.status(400).json({ error: "id is missing" });
    }
    const getworkspace = await prisma_1.prisma.workspace.findUnique({ where: { id: workspaceId }, include: { endpoints: true } });
    if (!getworkspace) {
        return res.status(404).json({ error: "workspace not found" });
    }
    if (userId !== getworkspace.ownerId) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const endpoints = getworkspace.endpoints;
    const github_endpoints = endpoints.filter(e => e.githubRepoId);
    console.log('getworkspace', getworkspace, 'github', github_endpoints);
}
