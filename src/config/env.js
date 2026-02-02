import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT || 4000),
  adminApiKey: process.env.ADMIN_API_KEY || "change-me",
  storageBackend: process.env.STORAGE_BACKEND || "local",
  localStorageDir: process.env.LOCAL_STORAGE_DIR || "uploads",
  dbPath: process.env.DB_PATH || "data/app.json",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 20),
  s3: {
    region: process.env.S3_REGION || "us-east-1",
    bucket: process.env.S3_BUCKET || "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    endpoint: process.env.S3_ENDPOINT || "",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
};

export default env;
