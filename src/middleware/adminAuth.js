import env from "../config/env.js";

export function requireAdmin(req, res, next) {
  const apiKey = req.header("x-admin-api-key");
  if (!apiKey || apiKey !== env.adminApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}
