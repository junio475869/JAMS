import { Router } from "express";
import { InterviewController } from "../controllers/interview.controller";
import { db } from "../utils/db";
import { InterviewModel } from "../models/interview.model";
import { storage } from "../storage";

const router = Router();

// Profile endpoints
router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  try {
    const profiles = await storage.getJobProfilesByUserId(req.user!.id);
    res.json(profiles);
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.post("/", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const profileData = {
      ...req.body,
      userId: req.user!.id,
      birthday: new Date(req.body.birthday),
    };
    const profile = await storage.createJobProfile(profileData);
    res.status(201).json(profile);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid request";
    res.status(400).json({ error: errorMessage });
  }
});

router.put("/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const profileId = parseInt(req.params.id);
  if (isNaN(profileId)) {
    return res.status(400).json({ error: "Invalid profile ID" });
  }

  try {
    const profile = await storage.getJobProfileById(profileId);
    if (!profile || profile.userId !== req.user!.id) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const updatedProfile = await storage.updateJobProfile(profileId, req.body);
    res.json(updatedProfile);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Invalid request";
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const profileId = parseInt(req.params.id);
  if (isNaN(profileId)) {
    return res.status(400).json({ error: "Invalid profile ID" });
  }

  try {
    const profile = await storage.getJobProfileById(profileId);
    if (!profile || profile.userId !== req.user!.id) {
      return res.status(404).json({ error: "Profile not found" });
    }

    await storage.deleteJobProfile(profileId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

export default router;
