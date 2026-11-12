import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBP6MBGjigFqE2TldHxSWBLi48d9UZPaPU",
  authDomain: "launcit.firebaseapp.com",
  projectId: "launcit",
  storageBucket: "launcit.firebasestorage.app",
  messagingSenderId: "756651018914",
  appId: "1:756651018914:web:156fee6986a8b4dfc0e5fb",
  measurementId: "G-V2WC354TD6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
