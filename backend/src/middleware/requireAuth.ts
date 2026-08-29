import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export default function requireauth(req: Request, res: Response, next: NextFunction){
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1]; // "Bearer <token>" → grab the token part
  if (!token) {
    res.redirect(`${req.protocol}://localhost:3000/login`);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req .userId = decoded.userId // attach it for the route to use
    next(); 
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};