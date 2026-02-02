import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.STORAGE_BACKEND = "local";
process.env.LOCAL_STORAGE_DIR = "test/tmp-uploads-auth";
process.env.DB_PATH = "test/tmp-db-auth.json";
process.env.ADMIN_API_KEY = "admin-password-123";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "sample.pdf");

const { default: app } = await import("../src/app.js");
const { initDb, closeDb } = await import("../src/config/db.js");

await fs.mkdir(process.env.LOCAL_STORAGE_DIR, { recursive: true });
await initDb();

test.after(async () => {
  await closeDb();
  try {
    await fs.rm("test/tmp-uploads-auth", { recursive: true });
    await fs.rm("test/tmp-db-auth.json");
  } catch {}
});

let adminToken;

test("Admin login", async () => {
  const res = await request(app)
    .post("/api/auth/admin/login")
    .send({ password: "admin-password-123" });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  adminToken = res.body.token;
  console.log("✅ Admin login successful");
});

test("Reject invalid login", async () => {
  const res = await request(app)
    .post("/api/auth/admin/login")
    .send({ password: "wrong-password" });

  assert.equal(res.status, 401);
  console.log("✅ Invalid login rejected");
});

test("Upload requires auth token", async () => {
  try {
    const res = await request(app)
      .post("/api/admin/past-questions")
      .field("title", "No Auth Test")
      .attach("file", fixturePath);

    assert.equal(res.status, 401);
  } catch (err) {
    if (err.code !== "ECONNRESET") throw err;
  }
  console.log("✅ Upload blocked without token");
});

test("Upload requires title", async () => {
  const res = await request(app)
    .post("/api/admin/past-questions")
    .set("authorization", `Bearer ${adminToken}`)
    .attach("file", fixturePath);

  assert.equal(res.status, 400);
  assert.ok(res.body.error.includes("Title"));
  console.log("✅ Title required for upload");
});

test("Admin upload with title", async () => {
  const res = await request(app)
    .post("/api/admin/past-questions")
    .set("authorization", `Bearer ${adminToken}`)
    .field("title", "Biology Final Exam 2024")
    .field("subject", "Biology")
    .field("year", "2024")
    .attach("file", fixturePath);

  assert.equal(res.status, 201);
  assert.equal(res.body.title, "Biology Final Exam 2024");
  console.log("✅ Admin upload successful with title");
});

test("Public can list questions (no auth)", async () => {
  const res = await request(app).get("/api/past-questions");

  assert.equal(res.status, 200);
  assert.ok(res.body.items);
  console.log("✅ Public list access granted");
});

test("Public can search questions (no auth)", async () => {
  const res = await request(app).get("/api/past-questions?q=Biology");

  assert.equal(res.status, 200);
  assert.ok(res.body.items);
  console.log("✅ Public search access granted");
});

test("Public can download (no auth required)", async () => {
  // Get a question first
  const listRes = await request(app).get("/api/past-questions");
  const questionId = listRes.body.items[0].id;

  const downloadRes = await request(app).get(`/api/past-questions/${questionId}/download`);

  assert.equal(downloadRes.status, 200);
  assert.ok(downloadRes.body.length > 0);
  console.log("✅ Public download access granted");
});

test("Verify token", async () => {
  const res = await request(app)
    .get("/api/auth/admin/verify")
    .set("authorization", `Bearer ${adminToken}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.valid);
  console.log("✅ Token verification works");
});

test("Logout invalidates token", async () => {
  const logoutRes = await request(app)
    .post("/api/auth/admin/logout")
    .set("authorization", `Bearer ${adminToken}`);

  assert.equal(logoutRes.status, 200);

  // Try to verify token after logout
  const verifyRes = await request(app)
    .get("/api/auth/admin/verify")
    .set("authorization", `Bearer ${adminToken}`);

  assert.equal(verifyRes.status, 401);
  console.log("✅ Logout invalidates token");
});
