import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkEndpointOwnership } from "../lib/authorizations";

export const replayRequest = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { requestId } = req.params;
        const { targetUrl, method: overrideMethod, headers: overrideHeaders, body: overrideBody } = req.body;

        console.log('Replay endpoint received body:', req.body);
        const storedRequest = await prisma.webhookRequest.findUnique({
            where: { id: requestId as string },
        });


        if (!storedRequest) {
            return res.status(404).json({ error: "Request not found" });
        }
        const endpoint_check = await checkEndpointOwnership(storedRequest.endpointId, userId)
        if ('error' in endpoint_check) {
            return res.status(endpoint_check.status as number).json({ error: endpoint_check.error })
        }
        let finalUrl = targetUrl;
        if (finalUrl.startsWith('/')) {
            finalUrl = `${req.protocol}://${req.get('host')}${finalUrl}`;
        }

        const headersToReplay = { ...(storedRequest.headers as Record<string, string>), ...(overrideHeaders || {}) };
        delete headersToReplay['host'];
        delete headersToReplay['content-length'];
        delete headersToReplay['connection'];

        const methodToUse = (overrideMethod || storedRequest.method || 'POST').toString().toUpperCase();

        // Determine body to send. For GET/HEAD methods, no body is sent.
        let bodyToSend: any = undefined;
        if (methodToUse !== 'GET' && methodToUse !== 'HEAD') {
            if (overrideBody !== undefined) {
                // If client provided a raw string, send as-is; otherwise stringify objects
                bodyToSend = typeof overrideBody === 'string' ? overrideBody : JSON.stringify(overrideBody);
            } else {
                bodyToSend = storedRequest.body ? JSON.stringify(storedRequest.body) : undefined;
            }
        }

        const start = Date.now();
        const replayResponse = await fetch(finalUrl, {
            method: methodToUse,
            headers: headersToReplay,
            body: bodyToSend,
        });
        const duration = Date.now() - start;

        // collect headers
        const responseHeaders: Record<string, string> = {};
        replayResponse.headers.forEach((v, k) => {
            responseHeaders[k] = v;
        });

        // read body as text and try parse JSON
        let responseText: string | null = null;
        try {
            responseText = await replayResponse.text();
        } catch (e) {
            responseText = null;
        }
        let parsedBody: any = null;
        if (responseText) {
            try {
                parsedBody = JSON.parse(responseText);
            } catch (e) {
                parsedBody = responseText;
            }
        }

        return res.status(200).json({
            replayed: true,
            status: replayResponse.status,
            statusText: (replayResponse as any).statusText || '',
            duration,
            responseHeaders,
            responseBody: parsedBody,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Replay failed " });
    }
};