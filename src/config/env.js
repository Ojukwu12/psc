import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const env = {
  port: Number(process.env.PORT || 4000),
  adminApiKey: process.env.ADMIN_API_KEY || "change-me",
  storageBackend: process.env.STORAGE_BACKEND || "local",
  localStorageDir: process.env.LOCAL_STORAGE_DIR || "uploads",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/napss-website",
  allowDbFallback: process.env.ALLOW_DB_FALLBACK === "true",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 20),
  s3: {
    region: process.env.S3_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    endpoint: process.env.S3_ENDPOINT || "",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

export default env;
