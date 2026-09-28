"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addClient = addClient;
exports.removeClient = removeClient;
exports.broadcastToEndpoint = broadcastToEndpoint;
const clients = new Map();
function addClient(endpointId, res) {
    const existing = clients.get(endpointId) || [];
    clients.set(endpointId, [...existing, res]);
}
function removeClient(endpointId, res) {
    const existing = clients.get(endpointId) || [];
    clients.set(endpointId, existing.filter((r) => r !== res));
}
function broadcastToEndpoint(endpointId, data) {
    const conns = clients.get(endpointId) || [];
    conns.forEach((res) => res.write(`data: ${JSON.stringify(data)}\n\n`));
}
