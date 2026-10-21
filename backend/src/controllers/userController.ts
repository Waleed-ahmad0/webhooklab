import { Response, Request } from "express";
import { prisma } from '../lib/prisma'
import { getToken } from "@auth/core/jwt";

async function webhookDelete(owner: string, repoName: string, githubhookId: number, githubAccessToken: unknown) {
    const ghRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/hooks/${githubhookId}`,
        {
            method: "DELETE",
            headers: { Authorization: `Bearer ${githubAccessToken}` },
        }
    );
    if (ghRes.ok || ghRes.status === 404 || ghRes.status === 204) {
        return {
            status: ghRes.status,
            success: ghRes.ok || ghRes.status === 404,
        };
    }
    return { success: false }
}
export async function getuserdata(req: Request, res: Response) {
    try {
        const userId = req.userId
        if (!userId) {
            return res.status(401).json({ error: 'unauthorized' })
        }
        const getdata = await prisma.user.findUnique({ where: { id: userId } })
        res.status(200).json(getdata)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'internal server error' })
    }
}

export async function deleteuser(req: Request, res: Response) {
    try {
        const token = await getToken({
            req: { headers: new Headers(req.headers as Record<string, string>) },
            secret: process.env.AUTH_SECRET!
        });
        const userId = req.userId
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: "email not found" })
        }
        if (!userId) {
            return res.status(401).json({ error: 'unauthorized' })
        }
        const finduser = await prisma.user.findUnique({ where: { id: userId } })
        if (!finduser) {
            return res.status(404).json({ error: 'user not found' })

        }
        if (email !== finduser?.email) {
            return res.status(401).json({ error: 'unauthorized' })

        }
        const github_endpoints = await prisma.endpoint.findMany({
            where: {
                workspace: {
                    ownerId: userId
                }, githubhookId: {
                    not: null
                }
            }
        });
        const githubResults = await Promise.all(

            github_endpoints.map(async e => {
                if (!e.githubRepo || !e.githubhookId) {
                    return {
                        endpointId: e.id,
                        success: false,
                    };
                }
                const [owner, repoName] = e.githubRepo.split("/");

                if (!owner || !repoName) {
                    return {
                        endpointId: e.id,
                        success: false,
                    };
                }
                try {
                    const result = await webhookDelete(owner, repoName, e.githubhookId, token?.githubAccessToken,)
                    if (result.success) {

                        return {
                            endpointId: e.id,
                            success: true,
                        };
                    }
                    return {
                        success: false,
                        endpointId: e.id
                    }

                } catch (error) {
                    return {
                        endpointId: e.id,
                        success: false,
                    };
                }
            })
        )
        const successfulGitHubIds = githubResults
            .filter(result => result.success)
            .map(result => result.endpointId);
        await prisma.user.delete({ where: { id: finduser?.id } })

        return res.status(200).json({ success: true, message: "user account deleted" });

    } catch (error) {
        res.status(500).json({ error: 'internal server error' })

    }

}