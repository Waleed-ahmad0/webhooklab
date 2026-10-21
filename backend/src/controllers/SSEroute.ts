import { Response, Request } from "express";
import { addClient, removeClient } from "../lib/sseClients";
import { checkEndpointOwnership } from "../lib/authorizations";
export const streamEndpointRequests = async (req: Request, res: Response) => {
    const { endpointId } = req.params;
    const userId = req.userId
    const checkowner = await checkEndpointOwnership(endpointId as string, userId)
    if ("error" in checkowner) return res.status(checkowner.status as number).json({ error: checkowner.error });


    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    addClient(endpointId as string, res);

    req.on("close", () => removeClient(endpointId as string, res));
};