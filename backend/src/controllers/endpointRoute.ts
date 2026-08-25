import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const webhookendpoint = async (req: Request, res: Response) => {
    try {
        const body = req.body
        console.log(body)
        const { name, workspaceId } = req.body
        const createEndpoint = await prisma.endpoint.create({
            data: {
                name, workspaceId
            }
        })
        res.status(201).json(createEndpoint)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'server error 500 endpoint request hit' })
    }
}
export const getEndpointRequests = async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;

    const requests = await prisma.webhookRequest.findMany({
      where: { endpointId: endpointId as string },
      orderBy: { receivedAt: "desc" },
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

export async function getAllWorkspaceEndpoints(req:Request,res:Response) {
    try {
        const {workspaceId}= req.params
        const getallendpoints= await prisma.endpoint.findMany({where:{workspaceId:workspaceId as string}})
        res.status(200).json(getallendpoints)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
    
}