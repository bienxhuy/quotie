import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

import authRouter from "./routes/auth.route";
import quoteRouter from "./routes/quote.route";


// Create Express app and configure middleware
const app = express();


// Increase body size limit for image uploads (50MB for JSON with base64 images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors(
  {origin: process.env.CLIENT_ORIGIN, credentials: true}
));
app.use(cookieParser());


// Endpoints
app.use("/api/auth", authRouter);
app.use("/api/quotes", quoteRouter);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use((_, res) => {res.status(404).json({ status: "error", message: "Route not found" });});

export default app;
