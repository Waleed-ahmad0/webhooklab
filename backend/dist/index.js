"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRoute_1 = require("./controllers/userRoute");
const endpointRoute_1 = require("./controllers/endpointRoute");
const workspaceRoute_1 = require("./controllers/workspaceRoute");
const webhookReceiverRoute_1 = require("./controllers/webhookReceiverRoute");
const replayRoute_1 = require("./controllers/replayRoute");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 4000;
app.get('/webhook/api/endpoint/request/:endpointId', endpointRoute_1.getEndpointRequests); // all the webhook request for 1 endpoint  ?//
app.get('/webhook/api/workspaces/:userId', workspaceRoute_1.getworkspace); // get all the workspaces for a specific user           ??
app.get('/webhook/api/workspaces/endpoints/:workspaceId', endpointRoute_1.getAllWorkspaceEndpoints); // get all the  endpoints of a specific workspace ??
app.get('/webhook/api/request/:requestId', webhookReceiverRoute_1.getawebhookrequest); // all the details of a single webhook request
app.post('/webhook/api/workspace', workspaceRoute_1.workspaceFunc); //creating workspace of a user
app.post("/webhook/api/endpoint", endpointRoute_1.webhookendpoint); // creating endpoint in a workspace
app.post("/webhook/api/request/:requestId/replay", replayRoute_1.replayRequest); // for replaying an webhook request
app.all('/webhook/api/h/:token', webhookReceiverRoute_1.receiveWebhook); //creating webhook request of an endpoint
app.post("webhook/api/users", userRoute_1.createUser); // creating user
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
