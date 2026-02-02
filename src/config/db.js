import fs from "fs/promises";
import path from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import env from "./env.js";

let db;

export async function initDb() {
  if (db) {
    return db;
  }

  const dir = path.dirname(env.dbPath);
  if (dir && dir !== ".") {
    await fs.mkdir(dir, { recursive: true });
  }

  const adapter = new JSONFile(env.dbPath);
  db = new Low(adapter, { past_questions: [] });
  await db.read();
  db.data ||= { past_questions: [] };
  await db.write();

  return db;
}

export async function getDb() {
  if (!db) {
    await initDb();
  }
  return db;
}

export async function closeDb() {
  db = null;
}
