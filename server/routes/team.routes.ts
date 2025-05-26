
import { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { UserRole } from "@shared/schema";
import { Router } from 'express';

const router = Router();

// Middleware to check admin or group leader roles
const requireAdminOrLeader = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const userRole = req.user.role;
  if (!userRole || (userRole !== UserRole.ADMIN && userRole !== UserRole.GROUP_LEADER)) {
    return res.status(403).json({ message: "Access denied. Requires administrator or group leader role." });
  }
  
  next();
};

// Get team members
router.get("/members", requireAdminOrLeader, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { role, teamId } = req.user;
    
    let members;
    if (role === UserRole.ADMIN) {
      members = await storage.getAllUsers();
    } else if (teamId) {
      members = await storage.getUsersByTeamId(teamId);
    } else {
      return res.status(400).json({ message: "Team ID not found for group leader" });
    }
    
    res.json(members);
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

// Other team routes...
router.get("/members/:id", requireAdminOrLeader, async (req, res) => {
  // Implementation
});

router.post("/members", requireAdminOrLeader, async (req, res) => {
  // Implementation
});

router.patch("/members/:id", requireAdminOrLeader, async (req, res) => {
  // Implementation
});

router.delete("/members/:id", requireAdminOrLeader, async (req, res) => {
  // Implementation
});

export default router;
