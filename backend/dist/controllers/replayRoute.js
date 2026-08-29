"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayRequest = void 0;
const prisma_1 = require("../lib/prisma");
const replayRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { targetUrl } = req.body; // where the user wants it resent
        const storedRequest = await prisma_1.prisma.webhookRequest.findUnique({
            where: { id: requestId },
        });
        if (!storedRequest) {
            return res.status(404).json({ error: "Request not found" });
        }
        let finalUrl = targetUrl;
        if (finalUrl.startsWith('/')) {
            finalUrl = `${req.protocol}://${req.get('host')}${finalUrl}`;
        }
        const replayResponse = await fetch(finalUrl, {
            method: storedRequest.method,
            headers: storedRequest.headers,
            body: storedRequest.body ? JSON.stringify(storedRequest.body) : undefined,
        });
        res.status(200).json({
            replayed: true,
            targetStatus: replayResponse.status,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Replay failed " });
    }
};
exports.replayRequest = replayRequest;
