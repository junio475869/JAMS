import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createTables } from './migrations';
import gmailRoutes from './routes/gmail';
import cors from 'cors';

const app = express();

// CORS configuration - more permissive in development
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? true : process.env.CLIENT_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.get('/', (req, res) => {
//   res.send('Server is up!');
// });
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

// Register Gmail routes
// app.use('/api/gmail', gmailRoutes);

(async () => {
  try {
    const server = await registerRoutes(app);

    // Setup Vite in development
    if (isDev) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const ports = [8080, 3000, 4000];
    let serverStarted = false;

    for (const port of ports) {
      try {
        await new Promise((resolve, reject) => {
          server.listen({
            port,
            host: "localhost",
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

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();