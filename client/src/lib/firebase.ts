import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA0-qPdAdPfhxl_pO6ZHifyOp28FdHuYfI",
  authDomain: "jams-5f746.firebaseapp.com",
  projectId: "jams-5f746",
  storageBucket: "jams-5f746.firebasestorage.app",
  messagingSenderId: "342952638180",
  appId: "1:342952638180:web:94c09380f826a686871ef1",
  measurementId: "G-ZFDCPE872P",
  // apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  // projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  // appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const analytics = getAnalytics(app);

export { auth, googleProvider };
