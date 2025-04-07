import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0-qPdAdPfhxl_pO6ZHifyOp28FdHuYfI",
  authDomain: "jams-5f746.firebaseapp.com",
  projectId: "jams-5f746",
  storageBucket: "jams-5f746.appspot.com",
  messagingSenderId: "342952638180",
  appId: "1:342952638180:web:94c09380f826a686871ef1",
  measurementId: "G-ZFDCPE872P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
