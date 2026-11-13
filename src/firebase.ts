import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { UserRole } from './types';

export const firebaseConfig = {
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

export async function createMemberAccountWithSecondaryAuth(params: {
  email: string;
  password: string;
  nombre: string;
  negocioId: string;
  negocioNombre: string;
  rol: UserRole;
}): Promise<{ uid: string; email: string }> {
  const secondaryAppName = `launcit-secondary-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  const secondaryDb = getFirestore(secondaryApp);

  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, params.password);
    const newUser = cred.user;

    if (params.nombre.trim()) {
      await updateProfile(newUser, { displayName: params.nombre.trim() }).catch(() => {});
    }

    // Write membership index for the new user while authenticated as that new user
    await setDoc(doc(secondaryDb, 'usuarios', newUser.uid, 'membresias', params.negocioId), {
      negocioId: params.negocioId,
      negocioNombre: params.negocioNombre,
      rol: params.rol,
      activo: true,
      updatedAt: new Date().toISOString(),
    });

    return { uid: newUser.uid, email: newUser.email || cleanEmail };
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}
