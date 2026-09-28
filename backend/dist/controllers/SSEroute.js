"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamEndpointRequests = void 0;
const sseClients_1 = require("../lib/sseClients");
const streamEndpointRequests = (req, res) => {
    const { endpointId } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    (0, sseClients_1.addClient)(endpointId, res);
    req.on("close", () => (0, sseClients_1.removeClient)(endpointId, res));
};
exports.streamEndpointRequests = streamEndpointRequests;
