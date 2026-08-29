"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpointRequests = exports.webhookendpoint = void 0;
exports.getAllWorkspaceEndpoints = getAllWorkspaceEndpoints;
const prisma_1 = require("../lib/prisma");
const webhookendpoint = async (req, res) => {
    try {
        const body = req.body;
        console.log(body);
        const { name, workspaceId } = req.body;
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
        const { workspaceId } = req.params;
        const getallendpoints = await prisma_1.prisma.endpoint.findMany({ where: { workspaceId: workspaceId } });
        res.status(200).json(getallendpoints);
    }
    catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
}
