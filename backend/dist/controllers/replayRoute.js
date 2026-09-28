"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayRequest = void 0;
const prisma_1 = require("../lib/prisma");
const ipcheck_1 = require("../lib/ipcheck");
const authorizations_1 = require("../lib/authorizations");
const replayRequest = async (req, res) => {
    try {
        const userId = req.userId;
        const { requestId } = req.params;
        const { targetUrl, method: overrideMethod, headers: overrideHeaders, body: overrideBody } = req.body;
        const storedRequest = await prisma_1.prisma.webhookRequest.findUnique({
            where: { id: requestId },
        });
        if (!storedRequest) {
            return res.status(404).json({ error: "Request not found" });
        }
        const endpoint_check = await (0, authorizations_1.checkEndpointOwnership)(storedRequest.endpointId, userId);
        if ('error' in endpoint_check) {
            return res.status(endpoint_check.status).json({ error: endpoint_check.error });
        }
        let finalUrl = targetUrl;
        if (finalUrl.startsWith('/')) {
            finalUrl = `${req.protocol}://${req.get('host')}${finalUrl}`;
        }
        const headersToReplay = { ...storedRequest.headers, ...(overrideHeaders || {}) };
        delete headersToReplay['host'];
        delete headersToReplay['content-length'];
        delete headersToReplay['connection'];
        const methodToUse = (overrideMethod || storedRequest.method || 'POST').toString().toUpperCase();
        let bodyToSend = undefined;
        if (methodToUse !== 'GET' && methodToUse !== 'HEAD') {
            if (overrideBody !== undefined) {
                bodyToSend = typeof overrideBody === 'string' ? overrideBody : JSON.stringify(overrideBody);
            }
            else {
                bodyToSend = storedRequest.body ? JSON.stringify(storedRequest.body) : undefined;
            }
        }
        try {
            await (0, ipcheck_1.assertSafeReplayTarget)(finalUrl);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
        const start = Date.now();
        const replayResponse = await fetch(finalUrl, {
            redirect: 'manual',
            method: methodToUse,
            headers: headersToReplay,
            body: bodyToSend,
            signal: AbortSignal.timeout(10000),
        });
        const duration = Date.now() - start;
        const responseHeaders = {};
        replayResponse.headers.forEach((v, k) => {
            responseHeaders[k] = v;
        });
        let responseText = null;
        try {
            responseText = await replayResponse.text();
        }
        catch (e) {
            responseText = null;
        }
        let parsedBody = null;
        if (responseText) {
            try {
                parsedBody = JSON.parse(responseText);
            }
            catch (e) {
                parsedBody = responseText;
            }
        }
        if (replayResponse.status >= 300 && replayResponse.status < 400) {
            return res.status(400).json({ error: "Target attempted a redirect — not followed for safety" });
        }
        return res.status(200).json({
            replayed: true,
            status: replayResponse.status,
            statusText: replayResponse.statusText || '',
            duration,
            responseHeaders,
            responseBody: parsedBody,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Replay failed " });
    }
};
exports.replayRequest = replayRequest;
