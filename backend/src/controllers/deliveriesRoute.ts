import { Request, Response } from "express";
import { checkEndpointOwnership } from "../lib/authorizations";
import { getToken } from "@auth/core/jwt";

export async function getdeliveries(req: Request, res: Response) {
    try {
        const token = await getToken({
            req: { headers: new Headers(req.headers as Record<string, string>) },
            secret: process.env.AUTH_SECRET!
        });
        const { endpointId } = req.params
        const userId = req.userId
        const ownercheck = await checkEndpointOwnership(endpointId as string, userId)
        if ("error" in ownercheck) {
            return res.status(ownercheck.status as number).json({ error: ownercheck.error })
        }
        if (!('endpoint' in ownercheck)) return res.status(404).json({ error: 'Endpoint not found' });

        const endpointdetails = ownercheck.endpoint
        const githubRepo = endpointdetails.githubRepo
        if (!githubRepo) {
            return res.status(400).json({ error: 'GitHub repo not configured for this endpoint' })
        }
        const [owner, repo] = githubRepo.split('/')
        const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks/${endpointdetails.githubhookId}/deliveries`, {
            headers: {
                Authorization: `Bearer ${token?.githubAccessToken}`,
                "Content-Type": "application/json",
            }
        })
        const deliveries = await ghRes.json()
        return res.status(200).json(deliveries)
    } catch (error) {
        console.log('Error fetching deliveries:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}