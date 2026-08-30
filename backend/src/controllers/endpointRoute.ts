import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkEndpointOwnership, checkWorkspaceOwnership } from "../lib/authorizations";

export const webhookendpoint = async (req: Request, res: Response) => {
  try {

    const userId = req.userId
    const { name, workspaceId } = req.body

    const findworkspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
    console.log(findworkspace)
    if (findworkspace?.ownerId !== userId) {
      return res.status(401).json({ error: 'unauthorized' })
    }
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
    const userId = req.userId
    const checkendpointowner = await checkEndpointOwnership(endpointId as string, userId)
    if ("error" in checkendpointowner) return res.status(checkendpointowner.status as number).json({ error: checkendpointowner.error });

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

export async function getAllWorkspaceEndpoints(req: Request, res: Response) {
  try {
    const userId = req.userId
    const { workspaceId } = req.params
    const checkworkspace = await checkWorkspaceOwnership(workspaceId as string, userId)
    if ('error' in checkworkspace) {
      return res.status(checkworkspace.status as number).json({ error: checkworkspace.error })
    }
    const getallendpoints = await prisma.endpoint.findMany({ where: { workspaceId: workspaceId as string } })
    res.status(200).json(getallendpoints)
  } catch (error) {
    console.error(error)
    res.status(500).json(error)
  }

}