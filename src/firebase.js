import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzNiuX6FmI7ZC0a6pMX6-iz9PAx3YnDac",
  authDomain: "montra-c35d3.firebaseapp.com",
  projectId: "montra-c35d3",
  storageBucket: "montra-c35d3.firebasestorage.app",
  messagingSenderId: "601303129652",
  appId: "1:601303129652:web:9c345257d3da5d46eef461",
  measurementId: "G-VSNLMWYWRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
