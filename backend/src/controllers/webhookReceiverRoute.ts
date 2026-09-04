import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkEndpointOwnership } from "../lib/authorizations";
import { broadcastToEndpoint } from "../lib/sseClients";

export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const endpoint = await prisma.endpoint.findUnique({ where: { token: token as string } });
    if (!endpoint) return res.status(404).json({ error: "Endpoint not found" });

    const newRequest=await prisma.webhookRequest.create({
      data: {
        endpointId: endpoint.id,
        method: req.method,
        headers: req.headers as any,
        body: req.body,
      },
    });
    broadcastToEndpoint(endpoint.id, newRequest); 

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
};

export async function getawebhookrequest(req: Request, res: Response) {
  try {
    const userId = req.userId
    const { requestId } = req.params
    const getdetailrequest = await prisma.webhookRequest.findUnique({ where: { id: requestId as string } })
    if (!getdetailrequest) {
      return res.status(404).json({ error: 'request not found' })
    }
    const checkowner = await checkEndpointOwnership(getdetailrequest?.endpointId, userId)
    if ('error' in checkowner) {
      return res.status(checkowner.status as number).json({ error: checkowner.error })
    }
    res.status(200).json(getdetailrequest)
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }
}