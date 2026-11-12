import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, X, User as UserIcon } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthenticated();
    } catch (err: any) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthenticated();
    } catch (err: any) {
      setError('No se pudo completar el inicio de sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const translateError = (code: string) => {
    switch (code) {
      case 'auth/invalid-email': return 'Correo electrónico inválido.';
      case 'auth/user-disabled': return 'Esta cuenta ha sido deshabilitada.';
      case 'auth/user-not-found': return 'Usuario no encontrado.';
      case 'auth/wrong-password': return 'Contraseña incorrecta.';
      case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
      case 'auth/weak-password': return 'La contraseña es muy débil.';
      default: return 'Ocurrió un error. Inténtalo de nuevo.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-sand-50 dark:bg-obsidian-950">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-md w-full p-6 sm:p-7 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
        <div className="border-b border-sand-200 dark:border-obsidian-800 pb-3.5">
          <h2 className="font-bold text-xl text-slate-900 dark:text-white">
            {isRegister ? 'Crear cuenta de negocio' : 'Acceso al Panel de Negocio'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRegister ? 'Regístrate para gestionar tu local' : 'Portal protegido para propietarios'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-obsidian-800 hover:bg-slate-800 dark:hover:bg-obsidian-750 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2.5 border border-sand-300 dark:border-obsidian-700 shadow-sm"
        >
          <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-sand-200 dark:bg-obsidian-800 flex-1" />
          <span className="text-[11px] font-mono text-slate-400 uppercase">o</span>
          <div className="h-px bg-sand-200 dark:bg-obsidian-800 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>
          {error && <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-semibold">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors"
          >
            {loading ? 'Procesando...' : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <button onClick={() => setIsRegister(!isRegister)} className="text-xs text-indigo-600 dark:text-indigo-400 w-full text-center hover:underline">
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
};
