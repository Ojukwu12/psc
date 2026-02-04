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
process.env.LOCAL_STORAGE_DIR = "test/tmp-uploads-final";
process.env.ADMIN_API_KEY = "test-key-final";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "sample.pdf");

const { default: app } = await import("../src/app.js");
const { initDb, closeDb } = await import("../src/config/db.js");

await fs.mkdir(process.env.LOCAL_STORAGE_DIR, { recursive: true });
await initDb();

test.after(async () => {
  await closeDb();
  try {
    await fs.rm("test/tmp-uploads-final", { recursive: true });
    await fs.rm("test/tmp-db-final.json");
  } catch {}
});

let adminToken;

test("Login first", async () => {
  const res = await request(app)
    .post("/api/auth/admin/login")
    .send({ password: "test-key-final" });

  assert.equal(res.status, 200);
  adminToken = res.body.token;
});

test("Complete Upload & Download Flow", async () => {
  console.log("\n📤 UPLOAD TEST");
  console.log("=" .repeat(50));
  
  const uploadRes = await request(app)
    .post("/api/admin/past-questions")
    .set("authorization", `Bearer ${adminToken}`)
    .field("title", "Physics Past Questions 2023")
    .field("subject", "Physics")
    .field("className", "SS3")
    .field("year", "2023")
    .attach("file", fixturePath);

  console.log(`Status: ${uploadRes.status}`);
  assert.equal(uploadRes.status, 201);
  
  const record = uploadRes.body;
  console.log(`✅ Upload successful!`);
  console.log(`   ID: ${record.id}`);
  console.log(`   Title: ${record.title}`);
  console.log(`   Subject: ${record.subject}`);
  console.log(`   Class: ${record.class_name}`);
  console.log(`   Year: ${record.year}`);
  console.log(`   File: ${record.file_name}`);
  console.log(`   Size: ${record.size} bytes`);

  console.log("\n📋 LIST TEST");
  console.log("=" .repeat(50));
  
  const listRes = await request(app).get("/api/past-questions");
  console.log(`Status: ${listRes.status}`);
  assert.equal(listRes.status, 200);
  console.log(`✅ Found ${listRes.body.total} past question(s)`);

  console.log("\n🔍 SEARCH TEST (by subject)");
  console.log("=" .repeat(50));
  
  const searchRes = await request(app).get("/api/past-questions?subject=Physics");
  console.log(`Status: ${searchRes.status}`);
  assert.equal(searchRes.status, 200);
  console.log(`✅ Found ${searchRes.body.items.length} Physics question(s)`);

  console.log("\n📥 DOWNLOAD TEST");
  console.log("=" .repeat(50));
  
  const downloadRes = await request(app).get(`/api/past-questions/${record.id}/download`);
  
  console.log(`Status: ${downloadRes.status}`);
  assert.equal(downloadRes.status, 200);
  assert.equal(downloadRes.headers["content-type"], "application/pdf");
  assert.ok(downloadRes.body.length > 0);
  
  console.log(`✅ Download successful!`);
  console.log(`   Content-Type: ${downloadRes.headers["content-type"]}`);
  console.log(`   Size: ${downloadRes.body.length} bytes`);
  console.log(`   Disposition: ${downloadRes.headers["content-disposition"]}`);

  console.log("\n" + "=".repeat(50));
  console.log("✨ ALL TESTS PASSED - BACKEND READY!");
  console.log("=".repeat(50) + "\n");
});
