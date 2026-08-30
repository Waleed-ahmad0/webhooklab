import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkEndpointOwnership } from "../lib/authorizations";

export const replayRequest = async (req: Request, res: Response) => {
    try {
        const userId = req.userId
        const { requestId } = req.params;
        const { targetUrl } = req.body;

        const storedRequest = await prisma.webhookRequest.findUnique({
            where: { id: requestId as string },
        });

        // console.log(storedRequest, storedRequest?.body)

        if (!storedRequest) {
            return res.status(404).json({ error: "Request not found" });
        }
        const endpoint_check = await checkEndpointOwnership(storedRequest.endpointId, userId)
        if ('error' in endpoint_check) {
            return res.status(endpoint_check.status as number).json({error:endpoint_check.error})
        }
        let finalUrl = targetUrl;
        if (finalUrl.startsWith('/')) {
            finalUrl = `${req.protocol}://${req.get('host')}${finalUrl}`;
        }

        const headersToReplay = { ...(storedRequest.headers as Record<string, string>) };
        delete headersToReplay['host'];
        delete headersToReplay['content-length'];
        delete headersToReplay['connection'];

        const replayResponse = await fetch(finalUrl, {
            method: storedRequest.method,
            headers: headersToReplay,
            body: storedRequest.body ? JSON.stringify(storedRequest.body) : undefined,
        });
        console.log('founded', replayResponse)
        res.status(200).json({
            replayed: true,
            targetStatus: replayResponse.status,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Replay failed " });
    }
};