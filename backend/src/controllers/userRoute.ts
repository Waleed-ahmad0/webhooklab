import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createUser = async (req: Request, res: Response) => {
  try {
    const body = req.body
    console.log(body)
    const { email, firstName, lastName } = req.body;

    const user = await prisma.user.create({
      data: { email, firstName, lastName },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

