import { Response } from "express";

const clients = new Map<string, Response[]>(); 

export function addClient(endpointId: string, res: Response) {
    const existing = clients.get(endpointId) || [];
    clients.set(endpointId, [...existing, res]);
}

export function removeClient(endpointId: string, res: Response) {
    const existing = clients.get(endpointId) || [];
    clients.set(endpointId, existing.filter((r) => r !== res));
}

export function broadcastToEndpoint(endpointId: string, data: unknown) {
    const conns = clients.get(endpointId) || [];
    conns.forEach((res) => res.write(`data: ${JSON.stringify(data)}\n\n`));
}