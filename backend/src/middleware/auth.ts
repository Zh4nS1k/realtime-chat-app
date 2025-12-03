import { Request, Response, NextFunction } from "express";
import UserModel from "../models/User";
import { verifyToken } from "../utils/auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Unauthorized" });
  const [, token] = header.split(" ");
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: "Unauthorized" });

  const user = await UserModel.findById(payload.userId);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  (req as any).authUser = user;
  (req as any).authPayload = payload;
  next();
}
