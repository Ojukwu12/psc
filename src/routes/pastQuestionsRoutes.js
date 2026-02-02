import { Router } from "express";
import multer from "multer";
import { requireAdminSession } from "./adminRoutes.js";
import env from "../config/env.js";
import { createPastQuestion, getPastQuestionById, listPastQuestions } from "../models/pastQuestionModel.js";
import { getStorage } from "../services/storage/index.js";

const router = Router();
const storage = getStorage();

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".gif", ".webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));
    const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);
    
    if (!mimeOk && !extOk) {
      return callback(new Error("Only PDF, Word, and image files are allowed"));
    }
    return callback(null, true);
  },
});

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

router.post("/admin/past-questions", requireAdminSession, upload.single("file"), handleMulterError, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    if (!req.body.title || !req.body.title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const uploadResult = await storage.upload({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    });

    const record = await createPastQuestion({
      title: req.body.title.trim(),
      subject: req.body.subject || null,
      className: req.body.className || null,
      year: req.body.year || null,
      fileKey: uploadResult.key,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(201).json(record);
  } catch (error) {
    return next(error);
  }
});

router.get("/past-questions", async (req, res, next) => {
  try {
    const result = await listPastQuestions({
      q: req.query.q,
      year: req.query.year,
      subject: req.query.subject,
      className: req.query.className,
      limit: req.query.limit,
      offset: req.query.offset,
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/past-questions/:id", async (req, res, next) => {
  try {
    const record = await getPastQuestionById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(record);
  } catch (error) {
    return next(error);
  }
});

router.get("/past-questions/:id/download", async (req, res, next) => {
  try {
    const record = await getPastQuestionById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Not found" });
    }

    const stream = await storage.getStream(record.file_key);
    
    // Sanitize filename: remove quotes, backslashes, path separators
    const safeName = (record.file_name || "past-question")
      .replace(/["\\/]/g, "")
      .replace(/\.\./g, "")
      .substring(0, 255);

    // Ensure valid content type
    const contentType = record.mime_type || "application/octet-stream";
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'");
    
    if (record.size) {
      res.setHeader("Content-Length", record.size);
    }

    if (stream && typeof stream.pipe === "function") {
      stream.pipe(res);
      return;
    }

    return res.end(stream);
  } catch (error) {
    return next(error);
  }
});

export default router;
