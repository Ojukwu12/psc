import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import env from "../../config/env.js";

function toFilePath(key) {
  return path.join(env.localStorageDir, ...key.split("/"));
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export const localStorage = {
  async upload({ buffer, originalName }) {
    const ext = path.extname(originalName) || ".pdf";
    const folder = new Date().toISOString().slice(0, 10);
    const key = `${folder}/${randomUUID()}${ext}`;
    const filePath = toFilePath(key);

    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, buffer);

    return { key };
  },

  async getStream(key) {
    const filePath = toFilePath(key);
    return createReadStream(filePath);
  },
};
