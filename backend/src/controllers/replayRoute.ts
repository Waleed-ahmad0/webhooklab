import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { assertSafeReplayTarget } from "../lib/ipcheck";
import { checkEndpointOwnership } from "../lib/authorizations";

export const replayRequest = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { requestId } = req.params;
        const { targetUrl, method: overrideMethod, headers: overrideHeaders, body: overrideBody } = req.body;

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

        let bodyToSend: any = undefined;
        if (methodToUse !== 'GET' && methodToUse !== 'HEAD') {
            if (overrideBody !== undefined) {
                bodyToSend = typeof overrideBody === 'string' ? overrideBody : JSON.stringify(overrideBody);
            } else {
                bodyToSend = storedRequest.body ? JSON.stringify(storedRequest.body) : undefined;
            }
        }

        try {
            await assertSafeReplayTarget(finalUrl);
        } catch (err) {
            return res.status(400).json({ error: (err as Error).message });
        }

        const start = Date.now();
        const replayResponse = await fetch(finalUrl, {
            redirect: 'manual',
            method: methodToUse,
            headers: headersToReplay,
            body: bodyToSend,
            signal: AbortSignal.timeout(10_000),

        });
        const duration = Date.now() - start;

        const responseHeaders: Record<string, string> = {};
        replayResponse.headers.forEach((v, k) => {
            responseHeaders[k] = v;
        });

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
        if (replayResponse.status >= 300 && replayResponse.status < 400) {
            return res.status(400).json({ error: "Target attempted a redirect — not followed for safety" });
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