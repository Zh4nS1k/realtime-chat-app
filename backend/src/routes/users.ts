import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import UserModel from "../models/User";
import { sanitizeUser } from "../utils/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const authUser = (req as any).authUser;
  const query = (req.query.q as string) || "";

  const users = await UserModel.find(
    query
      ? {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
          _id: { $ne: authUser._id },
        }
      : { _id: { $ne: authUser._id } }
  )
    .sort({ username: 1 })
    .limit(20);

  return res.json({ users: users.map(sanitizeUser) });
});

export default router;
