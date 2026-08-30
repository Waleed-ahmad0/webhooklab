"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpointRequests = exports.webhookendpoint = void 0;
exports.getAllWorkspaceEndpoints = getAllWorkspaceEndpoints;
const prisma_1 = require("../lib/prisma");
const authorizations_1 = require("../lib/authorizations");
const webhookendpoint = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, workspaceId } = req.body;
        const findworkspace = await prisma_1.prisma.workspace.findUnique({ where: { id: workspaceId } });
        console.log(findworkspace);
        if (findworkspace?.ownerId !== userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const createEndpoint = await prisma_1.prisma.endpoint.create({
            data: {
                name, workspaceId
            }
        });
        res.status(201).json(createEndpoint);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'server error 500 endpoint request hit' });
    }
};
exports.webhookendpoint = webhookendpoint;
const getEndpointRequests = async (req, res) => {
    try {
        const { endpointId } = req.params;
        const userId = req.userId;
        const checkendpointowner = await (0, authorizations_1.checkEndpointOwnership)(endpointId, userId);
        if ("error" in checkendpointowner)
            return res.status(checkendpointowner.status).json({ error: checkendpointowner.error });
        const requests = await prisma_1.prisma.webhookRequest.findMany({
            where: { endpointId: endpointId },
            orderBy: { receivedAt: "desc" },
        });
        res.status(200).json(requests);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch requests" });
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
        res.status(200).json(getallendpoints);
    }
    catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
}
