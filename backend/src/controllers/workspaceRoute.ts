import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function workspaceFunc(req: Request, res: Response) {
    try {
        const userId = req .userId
        const { name } = await req.body
        const createworkspace = await prisma.workspace.create({
            data: {
                name, ownerId: userId as string
            }
        })
        res.status(201).json(createworkspace)
    } catch (error) {
        console.error(error)
        res.json(500).json({ error: 'internal server error status 500' })
    }
}

export async function getworkspace(req: Request, res: Response) {
    try {
        const userId = req .userId
        const getworkspaces = await prisma.workspace.findMany({ where: { ownerId: userId as string } })
        res.status(200).json(getworkspaces)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "internal server error" })
    }
}