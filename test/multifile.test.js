import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load .env file
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

process.env.STORAGE_BACKEND = "local";
process.env.LOCAL_STORAGE_DIR = "test/tmp-uploads-multi";
process.env.ADMIN_API_KEY = "test-key-multi";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "fixtures", "sample.pdf");
const jpgPath = path.join(__dirname, "fixtures", "sample.jpg");
const docxPath = path.join(__dirname, "fixtures", "sample.docx");

// Create test fixtures
await fs.mkdir(path.join(__dirname, "fixtures"), { recursive: true });
await fs.writeFile(jpgPath, Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]));
await fs.writeFile(docxPath, Buffer.from([0x50, 0x4B, 0x03, 0x04]));

const { default: app } = await import("../src/app.js");
const { initDb, closeDb } = await import("../src/config/db.js");

await fs.mkdir(process.env.LOCAL_STORAGE_DIR, { recursive: true });
await initDb();

test.after(async () => {
  await closeDb();
  try {
    await fs.rm("test/tmp-uploads-multi", { recursive: true });
    await fs.rm("test/tmp-db-multi.json");
    await fs.rm(jpgPath);
    await fs.rm(docxPath);
  } catch {}
});

let adminToken;

test("Login for test", async () => {
  const res = await request(app)
    .post("/api/auth/admin/login")
    .send({ password: "test-key-multi" });

  assert.equal(res.status, 200);
  adminToken = res.body.token;
});

test("Upload PDF file", async () => {
  const res = await request(app)
    .post("/api/admin/past-questions")
    .set("authorization", `Bearer ${adminToken}`)
    .field("title", "Math PDF 2024")
    .attach("file", pdfPath);

  assert.equal(res.status, 201);
  console.log("✅ PDF upload works");
});

test("Upload JPG file", async () => {
  const res = await request(app)
    .post("/api/admin/past-questions")
    .set("authorization", `Bearer ${adminToken}`)
    .field("title", "Physics Diagram")
    .attach("file", jpgPath);

  assert.equal(res.status, 201);
  assert.ok(res.body.mime_type.includes("image"));
  console.log("✅ JPG upload works");
});

test("Upload DOCX file", async () => {
  const res = await request(app)
    .post("/api/admin/past-questions")
    .set("authorization", `Bearer ${adminToken}`)
    .field("title", "Chemistry Notes")
    .attach("file", docxPath);

  assert.equal(res.status, 201);
  console.log("✅ DOCX upload works");
});

test("Reject unsupported file type", async () => {
  const txtPath = path.join(__dirname, "fixtures", "test.txt");
  await fs.writeFile(txtPath, "not allowed");

  try {
    const res = await request(app)
      .post("/api/admin/past-questions")
      .set("x-admin-api-key", "test-key-multi")
      .attach("file", txtPath);

    assert.equal(res.status, 400);
  } catch (err) {
    if (err.code !== "ECONNRESET") throw err;
  }

  await fs.rm(txtPath);
  console.log("✅ Unsupported file rejection works");
});

test("Download with safe headers", async () => {
  const uploadRes = await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key-multi")
    .field("title", "Test Download")
    .attach("file", pdfPath);

  const downloadRes = await request(app).get(`/api/past-questions/${uploadRes.body.id}/download`);

  assert.equal(downloadRes.status, 200);
  assert.ok(downloadRes.headers["x-content-type-options"] === "nosniff");
  assert.ok(downloadRes.headers["content-security-policy"]);
  console.log("✅ Secure download headers set");
});
