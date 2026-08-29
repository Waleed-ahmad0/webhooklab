import { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

export default async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body
        const finduser = await prisma.user.findUnique({ where: { email } })
        if (!finduser) {
            return res.status(404).json({ message: "no user exist with this email" })
        }
        if (!finduser.password) {
            return res.status(404).json(null)

        }
        const check_password = await bcrypt.compare(
            password,
            finduser.password
        );
        if (!check_password) {
            return res.status(400).json({ error: "invalid email or passwsford" })

        }
        const token = jwt.sign(
            { userId: finduser.id },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        );
        // console.log(check_password, password, finduser.password)

        // console.log(finduser)
        res.status(200).json({ token, finduser });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "internal server error" })
    }
}
