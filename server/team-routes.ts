import { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { UserRole } from "@shared/schema";

export function setupTeamRoutes(app: Express) {
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
  // - Admins see all users
  // - Group leaders see only members of their team
  app.get("/api/team/members", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { role, teamId } = req.user;
      
      let members;
      if (role === UserRole.ADMIN) {
        // Admins can see all users
        members = await storage.getAllUsers();
      } else if (teamId) {
        // Group leaders can only see their team members
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
  
  // Get user by ID
  app.get("/api/team/members/:id", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      const { role, teamId } = req.user;
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Group leaders can only view members of their team
      if (role === UserRole.GROUP_LEADER && user.teamId !== teamId) {
        return res.status(403).json({ message: "Access denied. User is not in your team." });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Create new team member
  app.post("/api/team/members", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { role, teamId } = req.user;
      
      // Create schema with validation
      const createUserSchema = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().optional(),
        role: z.string(),
        teamId: z.number().optional(),
      });
      
      const data = createUserSchema.parse(req.body);
      
      // Group leaders can only create users in their team and can't create admins or other group leaders
      if (role === UserRole.GROUP_LEADER) {
        if (data.role === UserRole.ADMIN || data.role === UserRole.GROUP_LEADER) {
          return res.status(403).json({ 
            message: "Group leaders cannot create administrator or group leader accounts" 
          });
        }
        
        // Force team ID to be the group leader's team
        if (teamId) {
          data.teamId = teamId;
        } else {
          return res.status(400).json({ message: "Team ID not found for group leader" });
        }
      }
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const newUser = await storage.createUser(data);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating team member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });
  
  // Update team member
  app.patch("/api/team/members/:id", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      const user = req.user;
      const currentUserId = user.id;
      const role = user.role;
      const teamId = user.teamId;
      
      // Prevent users from modifying themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot modify your own account through this endpoint" });
      }
      
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Group leaders can only update users in their team
      if (role === UserRole.GROUP_LEADER && targetUser.teamId !== teamId) {
        return res.status(403).json({ message: "Access denied. User is not in your team." });
      }
      
      // Create schema with validation
      const updateUserSchema = z.object({
        fullName: z.string().optional(),
        role: z.string().optional(),
        teamId: z.number().optional(),
      });
      
      const updates = updateUserSchema.parse(req.body);
      
      // Group leaders have limitations on what they can update
      if (role === UserRole.GROUP_LEADER) {
        // Can't change role to admin or group leader
        if (updates.role && (updates.role === UserRole.ADMIN || updates.role === UserRole.GROUP_LEADER)) {
          return res.status(403).json({ 
            message: "Group leaders cannot promote users to administrator or group leader roles" 
          });
        }
        
        // Can't change team ID
        if (updates.teamId && updates.teamId !== teamId) {
          return res.status(403).json({ 
            message: "Group leaders cannot change the team assignment" 
          });
        }
        
        // Force team ID to be the group leader's team
        if (teamId) {
          updates.teamId = teamId;
        } else {
          return res.status(400).json({ message: "Team ID not found for group leader" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating team member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update team member" });
    }
  });
  
  // Delete team member
  app.delete("/api/team/members/:id", requireAdminOrLeader, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      const user = req.user;
      const currentUserId = user.id;
      const role = user.role;
      const teamId = user.teamId;
      
      // Prevent users from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Group leaders can only delete users in their team and can't delete admins or other group leaders
      if (role === UserRole.GROUP_LEADER) {
        if (targetUser.teamId !== teamId) {
          return res.status(403).json({ message: "Access denied. User is not in your team." });
        }
        
        if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.GROUP_LEADER) {
          return res.status(403).json({ 
            message: "Group leaders cannot delete administrator or group leader accounts" 
          });
        }
      }
      
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });
}