import { Response, Request } from "express";
import { prisma } from '../lib/prisma'

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
        const userId = req.userId
        const { email } = req.body
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
        await prisma.user.delete({ where: { id: finduser?.id } })
        return res.status(201).json({ message: 'user delted successfully' })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'internal server error' })

    }

}