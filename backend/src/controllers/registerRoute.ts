import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
export const createUser = async (req: Request, res: Response) => {
  try {
    const body = req.body
    console.log(body)
    const { email, firstName ,password, lastName } = req.body;
    const existuser = await prisma.user.findUnique({ where: { email } })
    if (existuser) {
      return res.status(400).json({ message: "user with this email already exist" })
    }
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, firstName, lastName,password:hashed },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

