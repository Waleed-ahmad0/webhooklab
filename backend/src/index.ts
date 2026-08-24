import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createUser  } from "./controllers/userRoute";
import { webhookendpoint } from "./controllers/endpointRoute";
import { workspaceFunc } from "./controllers/workspaceRoute";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 4000;

app.post("/webhook/:token", webhookendpoint)


app.post('/webhook/workspace', workspaceFunc)


app.post("/users", createUser);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});