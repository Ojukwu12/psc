import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load .env file
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

process.env.STORAGE_BACKEND = "local";
process.env.LOCAL_STORAGE_DIR = "test/tmp-uploads-pq";
process.env.ADMIN_API_KEY = "test-key";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "sample.pdf");

const { default: app } = await import("../src/app.js");
const { initDb, closeDb } = await import("../src/config/db.js");

await fs.mkdir(process.env.LOCAL_STORAGE_DIR, { recursive: true });
await initDb();

test.after(async () => {
  await closeDb();
  try {
    await fs.rm("test/tmp-uploads", { recursive: true });
    await fs.rm("test/tmp-db.json");
  } catch {}
});

test("upload and download past question", async () => {
  const uploadRes = await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key")
    .field("title", "Math 2022")
    .attach("file", fixturePath);

  assert.equal(uploadRes.status, 201);
  assert.ok(uploadRes.body.id);

  const downloadRes = await request(app).get(`/api/past-questions/${uploadRes.body.id}/download`);
  assert.equal(downloadRes.status, 200);
  assert.equal(downloadRes.headers["content-type"], "application/pdf");
});
