import { Express, Request, Response, NextFunction } from "express";
import adminRoutes from "./admin";
import teamRoutes from "./team";
import apiRoutes from "./api";
import path from "path";
import { createServer, type Server } from "http";
import { setupVite, serveStatic } from "../vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mount route modules
  app.use("/api/admin", adminRoutes);
  app.use("/api/team", teamRoutes);
  app.use("/api", apiRoutes);

  const server = createServer(app);

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err);

    // Handle specific error types
    if (err.name === "UnauthorizedError") {
      return res.status(401).json({
        message: "Authentication required",
        error: err.message,
      });
    }

    if (err.name === "ForbiddenError") {
      return res.status(403).json({
        message: "Access denied",
        error: err.message,
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        error: err.message,
      });
    }

    // Default error response
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? err : undefined,
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Catch-all route for client-side routing
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes and static files
    if (req.path.startsWith("/api") || req.path.startsWith("/assets")) {
      return next();
    }

    // Let Vite handle the request in development
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    // Serve the static index.html file in production
    res.sendFile(path.join(process.cwd(), "dist", "index.html"));
  });

  return server;
}
