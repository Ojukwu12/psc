import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Debug script for S3 upload
// Configure S3 credentials in .env file before running

process.env.STORAGE_BACKEND = "s3";
process.env.DB_PATH = "test/tmp-db-s3.json";
process.env.ADMIN_API_KEY = "test-key";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "sample.pdf");

const { default: app } = await import("../src/app.js");
const { initDb, closeDb } = await import("../src/config/db.js");

await initDb();

console.log("Testing S3 Upload...");

const uploadRes = await request(app)
  .post("/api/admin/past-questions")
  .set("x-admin-api-key", "test-key")
  .field("title", "Biology Test")
  .attach("file", fixturePath);

console.log("Status:", uploadRes.status);
console.log("Body:", uploadRes.body);

await closeDb();
