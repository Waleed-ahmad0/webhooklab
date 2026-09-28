import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getToken } from "@auth/core/jwt";
import { resolve } from "node:dns";

export async function workspaceFunc(req: Request, res: Response) {
    try {
        const userId = req.userId
        const { name } = await req.body
        const createworkspace = await prisma.workspace.create({
            data: {
                name, ownerId: userId as string
            }
        })
        res.status(201).json(createworkspace)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'internal server error status 500' })
    }
}

export async function getworkspace(req: Request, res: Response) {
    try {
        const userId = req.userId
        const getworkspaces = await prisma.workspace.findMany({ where: { ownerId: userId } })
        res.status(200).json(getworkspaces)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "internal server error" })
    }
}

export async function updateWorkspaceFunc(req: Request, res: Response) {
    try {
        const userId = req.userId;
        const workspaceIdParam = req.params.workspaceId;
        const workspaceId = Array.isArray(workspaceIdParam) ? workspaceIdParam[0] : workspaceIdParam;
        const { name } = req.body ?? {};

        if (!workspaceId || typeof name !== "string") {
            return res.status(400).json({ error: "Valid workspace id and name are required" });
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            return res.status(400).json({ error: "Workspace name cannot be empty" });
        }

        const workspace = await prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                ownerId: userId as string,
            },
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const updatedWorkspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: trimmedName },
        });

        return res.status(200).json(updatedWorkspace);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
}

export async function deleteWorkspaceFunc(req: Request, res: Response) {
    try {
        const token = await getToken({
            req: { headers: new Headers(req.headers as Record<string, string>) },
            secret: process.env.AUTH_SECRET!
        });
        const userId = req.userId;
        const workspaceIdParam = req.params.workspaceId;
        const workspaceId = Array.isArray(workspaceIdParam) ? workspaceIdParam[0] : workspaceIdParam;

        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace id is required" });
        }

        const workspace = await prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                ownerId: userId as string,
            },
            include: {
                endpoints: true
            },
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        const endpoints = workspace.endpoints

        const github_endpoints = endpoints.filter(e => e.githubRepoId)

        const successfulGitHubIds: string[] = []

        const githubPromises = github_endpoints.map(async (e) => {
            const githubRepo = e.githubRepo;
            if (!githubRepo) return;

            const [owner, repoName] = githubRepo.split("/");
            if (!owner || !repoName) return;

            const ghRes = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/hooks/${e.githubhookId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token?.githubAccessToken}` },
                }
            );

            if (ghRes.ok || ghRes.status === 404) { successfulGitHubIds.push(e.id) };
        });
        await Promise.all(githubPromises);
        if (github_endpoints.length === successfulGitHubIds.length) {
            const deleted = await prisma.workspace.delete({
                where: { id: workspace.id }
            })
            return res.status(200).json({ success: true, message: "Workspace deleted" });
        }

        await prisma.endpoint.deleteMany({
            where: {
                id: {
                    in: successfulGitHubIds
                }
            }
        });

        console.log(successfulGitHubIds)

        return res.status(200).json({ success: true, message: "Workspace deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
}
export async function deleteAllWorkspaceEndpoints(req: Request, res: Response) {

    const userId = req.userId;
    const workspaceIdParam = req.params.workspaceId;
    const workspaceId = Array.isArray(workspaceIdParam) ? workspaceIdParam[0] : workspaceIdParam;

    const token = await getToken({
        req: { headers: new Headers(req.headers as Record<string, string>) },
        secret: process.env.AUTH_SECRET!
    });
    if (!workspaceId) {
        return res.status(400).json({ error: "id is missing" })
    }
    const getworkspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, include: { endpoints: true } })
    if (!getworkspace) {
        return res.status(404).json({ error: "workspace not found" })
    }
    if (userId !== getworkspace.ownerId) {
        return res.status(401).json({ error: "unauthorized" })

    }
    const endpoints = getworkspace.endpoints
    const github_endpoints = endpoints.filter(e => e.githubRepoId)
    console.log('getworkspace', getworkspace, 'github', github_endpoints)

}