import { Router } from "express";
import crypto from "crypto";
import env from "../config/env.js";

const router = Router();
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  // Check against admin API key as password
  if (password !== env.adminApiKey) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  sessions.set(token, {
    createdAt: new Date(),
    expiresAt,
  });

  res.json({
    token,
    expiresAt,
    message: "Logged in successfully",
  });
});

router.post("/admin/logout", (req, res) => {
  const token = req.header("authorization")?.replace("Bearer ", "");

  if (token) {
    sessions.delete(token);
  }

  res.json({ message: "Logged out successfully" });
});

router.get("/admin/verify", (req, res) => {
  const token = req.header("authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (new Date() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: "Token expired" });
  }

  res.json({
    valid: true,
    expiresAt: session.expiresAt,
  });
});

export function requireAdminSession(req, res, next) {
  const token = req.header("authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (new Date() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: "Token expired" });
  }

  req.adminToken = token;
  next();
}

export default router;
