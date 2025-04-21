
import path from 'path';


import { Express } from "express";
import { createServer, type Server } from "http";
import adminRoutes from './admin';
import teamRoutes from './team';
import apiRoutes from './api';
import { setupAuth } from "../auth";
import { setupVite, serveStatic } from "../vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Mount route modules
  app.use('/api/admin', adminRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api', apiRoutes);

  const server = createServer(app);

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Catch-all route for client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    if (app.get("env") === "development") {
      // Let Vite handle the request
      next();
    } else {
      // Serve the static index.html
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    }
  });

  return server;
}
