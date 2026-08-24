import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function workspaceFunc(req:Request, res:Response){
    try {
        const {name, ownerId}= await req.body
        const createworkspace= await prisma.workspace.create({
            data:{
                name, ownerId
            }
        })
        res.status(200).json(createworkspace)
    } catch (error) {
        console.error(error)
        res.json(500).json({error:'internal server error status 500'})
    }
}