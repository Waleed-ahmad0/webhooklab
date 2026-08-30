"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveWebhook = void 0;
exports.getawebhookrequest = getawebhookrequest;
const prisma_1 = require("../lib/prisma");
const authorizations_1 = require("../lib/authorizations");
const receiveWebhook = async (req, res) => {
    try {
        const { token } = req.params;
        const endpoint = await prisma_1.prisma.endpoint.findUnique({ where: { token: token } });
        if (!endpoint)
            return res.status(404).json({ error: "Endpoint not found" });
        await prisma_1.prisma.webhookRequest.create({
            data: {
                endpointId: endpoint.id,
                method: req.method,
                headers: req.headers,
                body: req.body,
            },
        });
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};
exports.receiveWebhook = receiveWebhook;
async function getawebhookrequest(req, res) {
    try {
        const userId = req.userId;
        const { requestId } = req.params;
        const getdetailrequest = await prisma_1.prisma.webhookRequest.findUnique({ where: { id: requestId } });
        if (!getdetailrequest) {
            return res.status(404).json({ error: 'request not found' });
        }
        const checkowner = await (0, authorizations_1.checkEndpointOwnership)(getdetailrequest?.endpointId, userId);
        if ('error' in checkowner) {
            return res.status(checkowner.status).json({ error: checkowner.error });
        }
        res.status(200).json(getdetailrequest);
    }
    catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
}
