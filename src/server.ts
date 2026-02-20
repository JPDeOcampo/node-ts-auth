import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import connectDB from "../src/config/db.js";
import usersRoutes from "./routes/userRoutes.js";
import cookieParser from 'cookie-parser';
// import authenticateJWT from "@/middleware/authenticateJWT.js";

connectDB();

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Verify JWT token
// app.get("/api/verify-token", authenticateJWT, (req: Request & { user?: any }, res: Response) => {
//   if (req.user) {
//     return res
//       .status(200)
//       .json({ message: "JWT token is valid.", validToken: true });
//   } else {
//     return res
//       .status(401)
//       .json({ message: "JWT token is invalid or missing." });
//   }
// });

// Routes
app.use("/api", usersRoutes);


if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
