import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK with environment variables
const app = !getApps().length 
  ? initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    })
  : getApp();

// Export the admin auth instance
const auth = getAuth(app);

export const admin = {
  auth: () => auth
};