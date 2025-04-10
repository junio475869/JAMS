
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin with error handling
function initializeFirebaseAdmin() {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.error("Missing Firebase Admin credentials. Please check environment variables:");
      console.error("- FIREBASE_PROJECT_ID");
      console.error("- FIREBASE_CLIENT_EMAIL");
      console.error("- FIREBASE_PRIVATE_KEY");
      throw new Error("Missing Firebase Admin credentials");
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

    return getAuth(app);
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw error;
  }
}

const auth = initializeFirebaseAdmin();

export const admin = {
  auth: () => auth,
};
