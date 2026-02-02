import env from "../../config/env.js";
import { localStorage } from "./localStorage.js";
import { s3Storage } from "./s3Storage.js";

export function getStorage() {
  if (env.storageBackend === "s3") {
    return s3Storage;
  }
  return localStorage;
}
