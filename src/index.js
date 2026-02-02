import app from "./app.js";
import env from "./config/env.js";
import { initDb } from "./config/db.js";

const start = async () => {
  await initDb();
  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
