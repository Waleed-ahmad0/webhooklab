import { Response, Request } from "express";
import { prisma } from "../lib/prisma"
import { checkEndpointOwnership } from "../lib/authorizations";
import { getToken } from "@auth/core/jwt";

async function webhookDelete(owner: string, repoName: string, githubhookId: number, githubAccessToken: unknown) {
    const ghRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/hooks/${githubhookId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${githubAccessToken}` },
        }
    );
    if (ghRes.ok) {
        return { message: "true" }

    }
    return { message: "false" }
}

export const updateendpoint = async (req: Request, res: Response) => {
    try {
        const token = await getToken({
            req: { headers: new Headers(req.headers as Record<string, string>) },
            secret: process.env.AUTH_SECRET!
        });
        const userId = req.userId
        const { events, endpointId, repo, endpointName } = req.body
        console.log("updating endpoint", endpointId, endpointName)
        const getendpoint = await checkEndpointOwnership(endpointId, userId)
        if ("error" in getendpoint) return res.status(getendpoint.status as number).json({ error: getendpoint.error });
        if (!('endpoint' in getendpoint)) return res.status(404).json({ error: 'Endpoint not found' });

        const endpoint = getendpoint.endpoint;

        if (endpointName) {
            console.log("updating name")
            const updateName = await prisma.endpoint.update({
                where: {
                    id: endpoint.id
                },
                data: {
                    name: endpointName
                }
            })
            if (!updateName) {
                return res.status(400).json({ error: "failed to update name" })
            }
            return res.status(201).json({ message: "name updated successfully" })

        }

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
        const { endpointId, repo, message } = req.body
        let owner, repoName;
        if (repo && typeof repo === "string") {
            [owner, repoName] = repo.split("/");
        }

        const userId = req.userId
        const checkowner = await checkEndpointOwnership(endpointId, userId)
        if (('error' in checkowner)) return res.status(checkowner.status as number).json({ error: checkowner.error });
        if (!('endpoint' in checkowner)) return res.status(404).json({ error: 'Endpoint not found' });
        const endpoint = checkowner.endpoint;

        if (owner && repoName && endpoint.githubhookId && token?.githubAccessToken && message === 'disconnect') {
            const response = await webhookDelete(owner, repoName, endpoint.githubhookId, token?.githubAccessToken)
            if (response.message) {
                await prisma.endpoint.update({ where: { id: endpoint.id }, data: { githubhookId: null } })
                return res.status(200).json({ message: "successfully disconnected " })

            } else {
                return res.status(400).json({ error: "failed to disconnect" })
            }

        } else if (owner && repoName && endpoint.githubhookId && token?.githubAccessToken && message === 'delete') {
            const response = await webhookDelete(owner, repoName, endpoint.githubhookId, token?.githubAccessToken)
            if (response.message) {
                const deleteendpoint = await prisma.endpoint.delete({ where: { id: endpoint.id } })
                if (!deleteendpoint) {
                    return res.status(500).json({ error: "failed to delete endpoint" })
                }
                return res.status(201).json({ error: "endpoint deleted" })

            } else {
                return res.status(400).json({ error: "failed to disconnect" })
            }

        } else {
            const deleteendpoint = await prisma.endpoint.delete({ where: { id: endpoint.id } })
            if (!deleteendpoint) {
                return res.status(500).json({ error: "failed to delete endpoint" })
            }
            return res.status(200).json({ message: "endpoint deleted" })

        }
    } catch (error) {
        return res.status(500).json({ error: "internal sever error" })

    }
}