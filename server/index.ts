import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createTables } from './utils/migrations';
import cors from 'cors';
import redisRoutes from './routes/redis';
import openaiRoutes from './routes/openai';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// Get the directory name in ES modules
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);

const app = express();

// CORS configuration - more permissive in development
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? true : process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the public directory
app.use(express.static(path.join(currentDirPath, "./public")));

// Proxy route for Vosk model download
app.get('/download-vosk-model', (req, res) => {
  const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.tar.gz';
  
  https.get(modelUrl, (response) => {
    // Forward the content type if it exists
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Forward the content length if it exists
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Pipe the response
    response.pipe(res);
  }).on('error', (err) => {
    console.error('Error downloading model:', err);
    res.status(500).send('Error downloading model');
  });
});
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

// Routes
app.use('/api/redis', redisRoutes);
app.use('/api/openai', openaiRoutes);

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
            host: process.env.HOST,
          }, () => {
            log(`Server running on http://${process.env.HOST}:${port}`);
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