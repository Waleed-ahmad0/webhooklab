import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createUser  } from "./controllers/userRoute";
import { getAllWorkspaceEndpoints, getEndpointRequests, webhookendpoint } from "./controllers/endpointRoute";
import { getworkspace, workspaceFunc } from "./controllers/workspaceRoute";
import { getawebhookrequest, receiveWebhook } from "./controllers/webhookReceiverRoute";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4000;

app.get('/webhook/api/endpoint/request/:endpointId', getEndpointRequests) // all the webhook request for 1 endpoint  ?//
app.get('/webhook/api/workspaces/:userId', getworkspace) // get all the workspaces for a specific user           ??
app.get('/webhook/api/workspaces/endpoints/:workspaceId', getAllWorkspaceEndpoints) // get all the  endpoints of a specific workspace ??
app.get('/webhook/api/request/:requestId',getawebhookrequest) // all the details of a single webhook request


app.post('/webhook/api/workspace', workspaceFunc) //creating workspace of a user
app.post("/webhook/api/endpoint", webhookendpoint) // creating endpoint in a workspace


app.all('/webhook/api/h/:token', receiveWebhook) //creating webhook request of an endpoint

app.post("webhook/api/users", createUser); // creating user


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});