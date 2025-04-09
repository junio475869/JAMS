
import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";

const staticDataSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
});

export function setupAdminRoutes(app: Express) {
  app.get("/api/admin/static-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Check if user is admin
    if (!req.user?.roles?.includes("admin")) return res.sendStatus(403);
    
    try {
      const data = await storage.getStaticData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch static data" });
    }
  });

  app.post("/api/admin/static-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.roles?.includes("admin")) return res.sendStatus(403);

    try {
      const validatedData = staticDataSchema.parse(req.body);
      const newItem = await storage.createStaticData(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ error: error.message || "Invalid request" });
    }
  });

  app.delete("/api/admin/static-data/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.roles?.includes("admin")) return res.sendStatus(403);

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    try {
      await storage.deleteStaticData(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });
}
