import { Router } from "express";
import { User } from "@shared/schema";
import { UserController } from "../controllers/user.controller";

const router = Router();

router.get("/", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Remove password from the response
  const { password, ...userWithoutPassword } = req.user as User;
  res.json(userWithoutPassword);
});

router.put("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const userController = new UserController();
  const user = await userController.updateUser(req.user.id, req.body as User);
  res.json(user);
});

export default router;
