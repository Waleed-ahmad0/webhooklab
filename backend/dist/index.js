"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const registerRoute_1 = require("./controllers/registerRoute");
const endpointRoute_1 = require("./controllers/endpointRoute");
const workspaceRoute_1 = require("./controllers/workspaceRoute");
const webhookReceiverRoute_1 = require("./controllers/webhookReceiverRoute");
const replayRoute_1 = require("./controllers/replayRoute");
const express_2 = require("@auth/express");
const SSEroute_1 = require("./controllers/SSEroute");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const requireAuth_1 = require("./middleware/requireAuth");
const auth_1 = require("./lib/auth");
const userController_1 = require("./controllers/userController");
const githubconnect_1 = require("./controllers/githubconnect");
const updateendpointsRoute_1 = require("./controllers/updateendpointsRoute");
const deliveriesRoute_1 = require("./controllers/deliveriesRoute");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean);
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
app.set("trust proxy", true);
app.use("/auth", (0, express_2.ExpressAuth)(auth_1.authConfig));
app.use(express_1.default.json());
const PORT = process.env.PORT || 4000;
app.get('/webhook/api/endpoint/request/:endpointId', requireAuth_1.requireAuth, endpointRoute_1.getEndpointRequests); // all the webhook request for 1 endpoint  ?//
app.get('/webhook/api/workspaces', requireAuth_1.requireAuth, workspaceRoute_1.getworkspace); // get all the workspaces for a specific user    //       
app.get('/webhook/api/workspaces/endpoints/:workspaceId', requireAuth_1.requireAuth, endpointRoute_1.getAllWorkspaceEndpoints); // get all the  endpoints of a specific workspace // 
app.get('/webhook/api/request/:requestId', requireAuth_1.requireAuth, webhookReceiverRoute_1.getawebhookrequest); // all the details of a single webhook request
app.get("/webhook/api/endpoint/:endpointId/stream", requireAuth_1.requireAuth, SSEroute_1.streamEndpointRequests);
app.get('/api/user', requireAuth_1.requireAuth, userController_1.getuserdata);
app.get('/api/github_data', requireAuth_1.requireAuth, githubconnect_1.listGithubRepos);
app.get('/webhook/api/endpoint/:endpointId/github/deliveries', requireAuth_1.requireAuth, deliveriesRoute_1.getdeliveries); // get all the  endpoints of a specific workspace // 
app.post('/webhook/api/workspace', requireAuth_1.requireAuth, workspaceRoute_1.workspaceFunc); //creating workspace of a user //
app.post("/webhook/api/endpoint", requireAuth_1.requireAuth, endpointRoute_1.webhookendpoint); // creating endpoint in a workspace //
app.post("/webhook/api/request/:requestId/replay", requireAuth_1.requireAuth, replayRoute_1.replayRequest); // for replaying an webhook request
app.patch('/webhook/api/endpoint', requireAuth_1.requireAuth, updateendpointsRoute_1.updateendpoint);
app.patch('/webhook/api/workspace/:workspaceId', requireAuth_1.requireAuth, workspaceRoute_1.updateWorkspaceFunc);
app.delete('/webhook/api/endpoint', requireAuth_1.requireAuth, updateendpointsRoute_1.deleteenpoint);
app.delete('/webhook/api/workspace/:workspaceId', requireAuth_1.requireAuth, workspaceRoute_1.deleteWorkspaceFunc);
app.delete('/webhook/api/workspaces/endpoints/:workspaceId', requireAuth_1.requireAuth, endpointRoute_1.deleteAllWorkspaceEndpoints); // get all the  endpoints of a specific workspace // 
app.all('/webhook/api/h/:token', webhookReceiverRoute_1.receiveWebhook); // creating webhook request of an endpoint
app.post("/api/register", registerRoute_1.createUser); // creating user
app.delete('/api/user', requireAuth_1.requireAuth, userController_1.deleteuser);
app.listen(PORT, () => {
});
