import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkEndpointOwnership, checkWorkspaceOwnership } from "../lib/authorizations";
import { getToken } from "@auth/core/jwt";

async function webhookCreate(owner: string, repoName: string, githubAccessToken: unknown, selectedEvents: string[], token: string) {
  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/hooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      config: {
        url: `${process.env.BACKEND_URL}/webhook/api/h/${token}`,
        content_type: "json",
      },
      events: selectedEvents,
    }),

  });
  const data = await ghRes.json()
  if (ghRes.ok) {
    return { data, status: ghRes.status }

  }
  return { message: false, status: ghRes.status }
}

export const webhookendpoint = async (req: Request, res: Response) => {
  try {
    const token = await getToken({
      req: { headers: new Headers(req.headers as Record<string, string>) },
      secret: process.env.AUTH_SECRET!
    });
    const userId = req.userId
    const { name, workspaceId, owner, events, githubRepoId, githubRepo } = req.body

    const findworkspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
    if (findworkspace?.ownerId !== userId) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    const selectedEvents = Array.isArray(events) && events.length > 0
      ? events.filter((event: unknown) => typeof event === 'string' && event.trim().length > 0)
      : ['*'];

    if (owner && githubRepoId && events) {
      const existingEndpoint = await prisma.endpoint.findFirst({
        where: {
          workspaceId,
          githubRepoId
        }
      });
      if (existingEndpoint?.githubhookId) {
        return res.status(400).json({ error: "An endpoint for this GitHub repository already exists in this workspace." });
      } else if (existingEndpoint) {
        const repoParts = typeof existingEndpoint.githubRepo === "string"
          ? existingEndpoint.githubRepo.split("/")
          : [];
        const [existingOwner, existingRepoName] = repoParts;

        if (!existingOwner || !existingRepoName) {
          return res.status(400).json({ error: "Invalid GitHub repository configuration for this endpoint." });
        }

        const data = await webhookCreate(existingOwner, existingRepoName, token?.githubAccessToken, selectedEvents, existingEndpoint.token)
        if (data.data && data.status) {
          await prisma.endpoint.update({
            where: {
              id: existingEndpoint.id
            },
            data: {
              githubhookId: data.data.id, events:selectedEvents
            }
          })
          return res.status(data.status).json({ message: 'endpoint connected' })
        } else {
          return res.status(data.status).json({ message: 'failed to connect endpoint' })

        }
      }
      const tempEndpoint = await prisma.endpoint.create({
        data: {
          name, workspaceId, githubRepoId, events: selectedEvents, githubRepo
        }
      })
      const data = await webhookCreate(owner, name, token?.githubAccessToken, selectedEvents, tempEndpoint.token);
      if (!data.data) {
        await prisma.endpoint.delete({
          where: { id: tempEndpoint.id }
        })
      } else {
        await prisma.endpoint.update({
          where: { token: tempEndpoint.token },
          data: { githubhookId: data.data.id },
        });
      }
      return res.status(data.status).json(data);
    } else {
      const createEndpoint = await prisma.endpoint.create({
        data: {
          name, workspaceId

        }
      })
      return res.status(201).json(createEndpoint)
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'server error 500 endpoint request hit' })
  }
}
export const getEndpointRequests = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 25, 100);

    const skip = (page - 1) * limit;
    const { endpointId } = req.params;
    const userId = req.userId
    const checkendpointowner = await checkEndpointOwnership(endpointId as string, userId)
    if ("error" in checkendpointowner) return res.status(checkendpointowner.status as number).json({ error: checkendpointowner.error });

    const [requests, total] = await Promise.all([
      prisma.webhookRequest.findMany({
        where: { endpointId: endpointId as string },
        orderBy: { receivedAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.webhookRequest.count({
        where: { endpointId: endpointId as string },
      }),
    ]);
    if (!('endpoint' in checkendpointowner)) return res.status(404).json({ error: 'Endpoint not found' });
    const modify = {
      requests,
      workspaceName: checkendpointowner.workspace.name,
      endpointName: checkendpointowner.endpoint.name,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
    return res.status(200).json(modify);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch requests" });
  }
};

export async function getAllWorkspaceEndpoints(req: Request, res: Response) {
  try {
    const userId = req.userId
    const workspaceId = req.params.workspaceId as string
    const checkworkspace = await checkWorkspaceOwnership(workspaceId, userId)
    if ('error' in checkworkspace) {
      return res.status(checkworkspace.status as number).json({ error: checkworkspace.error })
    }
    const getallrequestcount = await prisma.webhookRequest.count({
      where: {
        endpoint: {
          workspaceId: workspaceId
        }
      }
    })
    const now = new Date();

    const startOfToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));

    const startOfTomorrow = new Date(
      startOfToday.getTime() + 24 * 60 * 60 * 1000
    );
    const todaysRequest = await prisma.webhookRequest.count({
      where: {
        endpoint: {
          workspaceId: workspaceId
        },
        receivedAt: {
          gte: startOfToday,
          lt: startOfTomorrow
        }
      }
    })
    const getallendpoints = await prisma.endpoint.findMany({
      where: { workspaceId: workspaceId },
      include: {
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });
    const addedworksapcename = { todaysRequest, totalRequests: getallrequestcount, workspaceName: checkworkspace.workspace.name, endpoints: getallendpoints }
    return res.status(200).json(addedworksapcename)
  } catch (error) {
    console.error(error)
    return res.status(500).json(error)
  }

}

