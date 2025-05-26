import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { admin } from "../utils/firebase-admin";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate a random password for Firebase users
function generateRandomPassword() {
  return randomBytes(16).toString('hex');
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "jams-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Validation schemas
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  const firebaseAuthSchema = z.object({
    idToken: z.string(),
    email: z.string().email(),
    displayName: z.string().optional(),
    photoURL: z.string().optional(),
  });

  // Firebase Authentication endpoint
  app.post("/api/firebase-auth", async (req, res, next) => {
    try {
      const { idToken, email, displayName, photoURL } = firebaseAuthSchema.parse(req.body);
      
      try {
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUID = decodedToken.uid;
        
        // Check if user exists by either email or firebaseUID
        let user = await storage.getUserByEmail(email) || await storage.getUserByFirebaseUID(firebaseUID);
        
        if (user) {
          // Update existing user with Firebase UID and latest info
          user = await storage.updateUser(user.id, { 
            firebaseUID,
            fullName: displayName || user.fullName,
            profilePicture: photoURL || user.profilePicture,
            email: email // Update email in case it changed
          });
        } else {
          // Create a new user in our database
          const username = email.split('@')[0] + '-' + Math.floor(Math.random() * 1000);
          user = await storage.createUser({
            username,
            email,
            fullName: displayName || username,
            password: await hashPassword(generateRandomPassword()),
            profilePicture: photoURL || '',
            firebaseUID,
          });
        }
        
        // Log the user in
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          // Remove password from the response
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      } catch (error) {
        console.error("Firebase token verification failed:", error);
        return res.status(401).json({ message: "Firebase authentication failed" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Email-based Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Generate a username from the email
      const username = userData.email.split('@')[0] + '-' + Math.floor(Math.random() * 1000);
      
      // Create the user
      const user = await storage.createUser({
        ...userData,
        username,
        password: await hashPassword(userData.password)
      });

      // Remove password from the response
      const { password, ...userWithoutPassword } = user;
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Email-based Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          
          // Remove password from the response
          const { password, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from the response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}
