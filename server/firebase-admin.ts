import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing Firebase Admin credentials in environment variables.",
  );
}

// Replace escaped newlines with actual newlines
privateKey = privateKey.replace(/\\n/g, "\n");

// Initialize the Firebase Admin app (only once)
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  : getApp();

// Export the admin auth instance
const auth = getAuth(app);

export const admin = {
  auth: () => auth,
};
