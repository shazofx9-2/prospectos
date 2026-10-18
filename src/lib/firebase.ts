import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = (import.meta as any).env || {};

// Read configuration from env variables, bundle fallback, or applet config
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDW0F58u7tEikVGhP4-ZSYKNguHhbLPokY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "prospectos-f2a6e.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "prospectos-f2a6e",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "prospectos-f2a6e.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "775471132024",
  appId: env.VITE_FIREBASE_APP_ID || "1:775471132024:web:60dcaeabe80f7455122c8d"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
