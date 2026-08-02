import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW0F58u7tEikVGhP4-ZSYKNguHhbLPokY",
  authDomain: "prospectos-f2a6e.firebaseapp.com",
  projectId: "prospectos-f2a6e",
  storageBucket: "prospectos-f2a6e.firebasestorage.app",
  messagingSenderId: "775471132024",
  appId: "1:775471132024:web:60dcaeabe80f7455122c8d"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export default app;

