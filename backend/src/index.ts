import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createUser } from "./controllers/registerRoute";
import { getAllWorkspaceEndpoints, getEndpointRequests, webhookendpoint } from "./controllers/endpointRoute";
import { getworkspace, workspaceFunc } from "./controllers/workspaceRoute";
import { getawebhookrequest, receiveWebhook } from "./controllers/webhookReceiverRoute";
import { replayRequest } from "./controllers/replayRoute";
import { ExpressAuth } from "@auth/express"
import { streamEndpointRequests } from "./controllers/SSEroute";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/requireAuth";
import { authConfig } from "./lib/auth";

dotenv.config();

const app = express();
app.use(cookieParser());
const allowedOrigins = [process.env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean) as string[];
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.set("trust proxy", true)
app.use("/auth", ExpressAuth(authConfig))

app.use(express.json());
const PORT = process.env.PORT || 4000;

app.get('/webhook/api/endpoint/request/:endpointId', requireAuth, getEndpointRequests) // all the webhook request for 1 endpoint  ?//
app.get('/webhook/api/workspaces', requireAuth, getworkspace) // get all the workspaces for a specific user    //       
app.get('/webhook/api/workspaces/endpoints/:workspaceId', requireAuth, getAllWorkspaceEndpoints) // get all the  endpoints of a specific workspace // 
app.get('/webhook/api/request/:requestId', requireAuth, getawebhookrequest) // all the details of a single webhook request
app.get("/webhook/api/endpoint/:endpointId/stream", requireAuth, streamEndpointRequests);

app.post('/webhook/api/workspace', requireAuth, workspaceFunc) //creating workspace of a user //
app.post("/webhook/api/endpoint", requireAuth, webhookendpoint) // creating endpoint in a workspace //
app.post("/webhook/api/request/:requestId/replay", requireAuth, replayRequest); // for replaying an webhook request

app.all('/webhook/api/h/:token', receiveWebhook) //creating webhook request of an endpoint

app.post("/api/register", createUser); // creating user
// app.post('/api/login', login) // for login

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});