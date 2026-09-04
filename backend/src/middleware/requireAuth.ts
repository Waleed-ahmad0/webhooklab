import { getSession } from "@auth/express";
import { Response, Request, NextFunction } from "express";
import { authConfig } from "../lib/auth";
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const session = await getSession(req, authConfig); 
    if (!session) return res.status(401).json({ error: "Not authenticated" });
    req.userId = (session as any).user.id; 
    next();
  } catch (error) {
    res.status(401).json({ error: "error" });

  }
};

