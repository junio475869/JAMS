import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createTables } from './migrations';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Run migrations
createTables().catch(console.error);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Try different ports if 5000 is not available
    const ports = [5000, 3000, 8080, 4000];
    let serverStarted = false;

    for (const port of ports) {
      try {
        await new Promise((resolve, reject) => {
          server.listen({
            port,
            host: "localhost", // Changed from 0.0.0.0 to localhost
          }, () => {
            log(`Server running on http://localhost:${port}`);
            serverStarted = true;
            resolve(true);
          }).on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE' || err.code === 'ENOTSUP') {
              log(`Port ${port} is not available, trying next port...`);
              resolve(false);
            } else {
              reject(err);
            }
          });
        });

        if (serverStarted) break;
      } catch (err) {
        if (port === ports[ports.length - 1]) {
          throw err;
        }
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();