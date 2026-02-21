import express, { type Express } from "express";
import cors from "cors";
import connectDB from "../src/config/db.js";
import usersRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";

connectDB();

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api", usersRoutes);

// Global error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
