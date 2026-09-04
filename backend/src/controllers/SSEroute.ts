import { Response, Request } from "express";
import { addClient, removeClient } from "../lib/sseClients";
export const streamEndpointRequests = (req: Request, res: Response) => {
    const { endpointId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    addClient(endpointId as string, res);

    req.on("close", () => removeClient(endpointId as string, res));
};