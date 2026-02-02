import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Use environment variables for S3 config - DO NOT hardcode secrets here!
// Set these in .env file:
// S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY

process.env.STORAGE_BACKEND = "s3";
process.env.DB_PATH = "test/tmp-db-s3.json";
process.env.ADMIN_API_KEY = "test-key";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "sample.pdf");

const { default: app } = await import("../src/app.js");
const { initDb, closeDb } = await import("../src/config/db.js");

await initDb();

test.after(async () => {
  await closeDb();
  try {
    await fs.rm("test/tmp-db-s3.json");
  } catch {}
});

test("S3 Upload and Download", async () => {
  if (!process.env.S3_BUCKET) {
    console.log("⏭️  Skipping S3 test - S3_BUCKET not configured in .env");
    return;
  }

  console.log("\n🚀 Testing S3 Upload...");
  
  const uploadRes = await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key")
    .field("title", "Biology S3 Test 2024")
    .field("subject", "Biology")
    .field("className", "SS3")
    .field("year", "2024")
    .attach("file", fixturePath);

  assert.equal(uploadRes.status, 201);
  assert.ok(uploadRes.body.id);
  assert.ok(uploadRes.body.file_key);
  assert.ok(uploadRes.body.file_key.includes("past-questions/"));
  
  console.log(`✅ Upload successful!`);
  console.log(`   ID: ${uploadRes.body.id}`);
  console.log(`   S3 Key: ${uploadRes.body.file_key}`);
  console.log(`   Title: ${uploadRes.body.title}`);

  console.log("\n📥 Testing S3 Download...");
  
  const downloadRes = await request(app).get(`/api/past-questions/${uploadRes.body.id}/download`);

  assert.equal(downloadRes.status, 200);
  assert.equal(downloadRes.headers["content-type"], "application/pdf");
  assert.ok(downloadRes.body.length > 0);
  
  console.log(`✅ Download successful!`);
  console.log(`   Size: ${downloadRes.body.length} bytes`);
  console.log(`   Content-Type: ${downloadRes.headers["content-type"]}`);
  
  console.log("\n✨ S3 storage working perfectly!\n");
});
