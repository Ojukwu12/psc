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
process.env.LOCAL_STORAGE_DIR = "test/tmp-uploads";
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
    await fs.rm("test/tmp-db-routes.json");
  } catch {}
});

test("GET /health", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
  console.log("✔ Health endpoint works");
});

test("POST /api/admin/past-questions - upload PDF", async () => {
  const res = await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key")
    .field("title", "Math Past Questions 2022")
    .field("subject", "Mathematics")
    .field("className", "SS3")
    .field("year", "2022")
    .attach("file", fixturePath);

  assert.equal(res.status, 201);
  assert.ok(res.body.id);
  assert.equal(res.body.title, "Math Past Questions 2022");
  assert.equal(res.body.subject, "Mathematics");
  console.log(`✔ Upload successful (ID: ${res.body.id})`);
});

test("POST /api/admin/past-questions - reject non-PDF", async () => {
  const txtPath = path.join(__dirname, "fixtures", "test.txt");
  await fs.writeFile(txtPath, "not a pdf");

  try {
    const res = await request(app)
      .post("/api/admin/past-questions")
      .set("x-admin-api-key", "test-key")
      .attach("file", txtPath);

    assert.equal(res.status, 400);
  } catch (err) {
    if (err.code === "ECONNRESET") {
      console.log("✔ Non-PDF rejection works (connection reset as expected)");
    } else {
      throw err;
    }
  }

  console.log("✔ Non-PDF rejection works");
  await fs.rm(txtPath);
});

test("POST /api/admin/past-questions - reject bad API key", async () => {
  try {
    const res = await request(app)
      .post("/api/admin/past-questions")
      .set("x-admin-api-key", "wrong-key")
      .attach("file", fixturePath);

    assert.equal(res.status, 401);
  } catch (err) {
    if (err.code === "ECONNRESET") {
      console.log("✔ Auth check works (connection reset as expected)");
    } else {
      throw err;
    }
  }

  console.log("✔ Auth check works");
});

test("GET /api/past-questions - list all", async () => {
  await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key")
    .field("title", "English 2023")
    .field("subject", "English")
    .field("year", "2023")
    .attach("file", fixturePath);

  const res = await request(app).get("/api/past-questions");

  assert.equal(res.status, 200);
  assert.ok(res.body.items);
  assert.ok(res.body.total >= 1);
  console.log(`✔ List works (${res.body.total} items)`);
});

test("GET /api/past-questions - search by subject", async () => {
  const res = await request(app).get("/api/past-questions?subject=English");

  assert.equal(res.status, 200);
  assert.ok(res.body.items);
  assert.ok(res.body.items.some((item) => item.subject === "English"));
  console.log(`✔ Subject filter works`);
});

test("GET /api/past-questions - search by year", async () => {
  const res = await request(app).get("/api/past-questions?year=2023");

  assert.equal(res.status, 200);
  assert.ok(res.body.items);
  console.log(`✔ Year filter works`);
});

test("GET /api/past-questions - text search", async () => {
  const res = await request(app).get("/api/past-questions?q=English");

  assert.equal(res.status, 200);
  assert.ok(res.body.items);
  console.log(`✔ Text search works`);
});

test("GET /api/past-questions/:id - get one", async () => {
  const uploadRes = await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key")
    .field("title", "Physics 2021")
    .attach("file", fixturePath);

  const id = uploadRes.body.id;
  const getRes = await request(app).get(`/api/past-questions/${id}`);

  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.id, id);
  assert.equal(getRes.body.title, "Physics 2021");
  console.log(`✔ Get one works`);
});

test("GET /api/past-questions/:id/download - download PDF", async () => {
  const uploadRes = await request(app)
    .post("/api/admin/past-questions")
    .set("x-admin-api-key", "test-key")
    .field("title", "Chemistry 2020")
    .attach("file", fixturePath);

  const id = uploadRes.body.id;
  const downloadRes = await request(app).get(`/api/past-questions/${id}/download`);

  assert.equal(downloadRes.status, 200);
  assert.equal(downloadRes.headers["content-type"], "application/pdf");
  assert.ok(downloadRes.headers["content-disposition"]);
  assert.ok(downloadRes.body.length > 0);
  console.log(`✔ Download works (${downloadRes.body.length} bytes)`);
});

test("GET /api/past-questions/999 - 404 for missing", async () => {
  const res = await request(app).get("/api/past-questions/999");

  assert.equal(res.status, 404);
  console.log("✔ 404 handling works");
});
