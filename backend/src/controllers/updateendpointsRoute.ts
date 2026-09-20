import { Response, Request } from "express";
import { prisma } from "../lib/prisma"
import { checkEndpointOwnership } from "../lib/authorizations";
import { getToken } from "@auth/core/jwt";

export const updateendpoint = async (req: Request, res: Response) => {
    try {
        const token = await getToken({
            req: { headers: new Headers(req.headers as Record<string, string>) },
            secret: process.env.AUTH_SECRET!
        });
        const userId = req.userId
        const { events, endpointId, repo } = req.body
        const getendpoint = await checkEndpointOwnership(endpointId, userId)
        if ("error" in getendpoint) return res.status(getendpoint.status as number).json({ error: getendpoint.error });
        if (!('endpoint' in getendpoint)) return res.status(404).json({ error: 'Endpoint not found' });

        const endpoint = getendpoint.endpoint;
        const [owner, repoName] = repo.split("/");

        const ghRes = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/hooks/${endpoint.githubhookId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token?.githubAccessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ events }),
            }
        );

        if (ghRes.ok) {


            const update = await prisma.endpoint.update({
                where: {
                    id: endpoint.id,
                    githubRepoId: endpoint.githubRepoId,
                },
                data: {
                    events: events
                }
            })
            return res.status(201).json(update)
        }
        return res.status(400).json({ error: "failed to updated webhook" })
    } catch (error) {
        return res.status(500).json(error)
    }
}

export async function deleteenpoint(req: Request, res: Response) {
    try {


        const token = await getToken({
            req: { headers: new Headers(req.headers as Record<string, string>) },
            secret: process.env.AUTH_SECRET!
        });
        const { endpointId, repo } = req.body
        const [owner, repoName] = repo.split("/");


        const userId = req.userId
        const checkowner = await checkEndpointOwnership(endpointId, userId)
        if (('error' in checkowner)) return res.status(checkowner.status as number).json({ error: checkowner.error });
        if (!('endpoint' in checkowner)) return res.status(404).json({ error: 'Endpoint not found' });
        const endpoint = checkowner.endpoint;
        const ghRes = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/hooks/${endpoint.githubhookId}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token?.githubAccessToken}` },
            }
        );
        if (ghRes.ok) {
            return res.status(200).json({ message: "successfully disconnected " })

        }
        return res.status(400).json({ error: "failed to disconnect" })
    } catch (error) {
        return res.status(500).json({ error: "internal sever error" })

    }
}