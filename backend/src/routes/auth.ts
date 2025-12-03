import { Router } from "express";
import bcrypt from "bcryptjs";
import UserModel from "../models/User";
import { signToken, sanitizeUser } from "../utils/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ message: "Email, username and password are required" });
    }

    const existing = await UserModel.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email: email.toLowerCase(),
      username,
      password: hashed,
    });

    const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username });
    return res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error("Register error", error);
    return res.status(500).json({ message: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username });
    return res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ message: "Failed to login" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).authUser;
  return res.json({ user: sanitizeUser(user) });
});

export default router;
