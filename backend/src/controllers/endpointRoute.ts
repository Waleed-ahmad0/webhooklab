import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const webhookendpoint = async (req: Request, res: Response) => {
    try {
        const body = req.body
        const { token } = req.params
        console.log(body, token)
        const { name, workspaceId } = req.body
        const createEndpoint = await prisma.endpoint.create({
            data: {
                name, workspaceId, token: token as string
            }
        })
        res.status(201).json(createEndpoint)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'server error' })
    }
}