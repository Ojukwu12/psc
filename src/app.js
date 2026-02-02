import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import pastQuestionsRoutes from "./routes/pastQuestionsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", adminRoutes);
app.use("/api", pastQuestionsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
