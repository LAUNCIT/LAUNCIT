import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBackToHome?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  onBackToHome,
}) => {
  const { authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const translateError = (code: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Correo electrónico inválido.';
      case 'auth/user-disabled':
        return 'Tu acceso fue desactivado. Contacta al administrador de tu negocio';
      case 'auth/user-not-found':
        return 'No existe una cuenta con ese correo.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 8 caracteres.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Espera un momento e inténtalo de nuevo.';
      default:
        return 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    clearAuthError();

    if (isRegister && password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
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
    setInfoMessage('');
    clearAuthError();
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthenticated();
    } catch (err: any) {
      setError('No se pudo completar el inicio de sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfoMessage('');
    clearAuthError();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Escribe tu correo arriba para enviarte el enlace de recuperación.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setInfoMessage(`Te enviamos un correo de recuperación a ${targetEmail}.`);
    } catch (err: any) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const visibleError = error || authError;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-sand-50 dark:bg-obsidian-950">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-md w-full p-6 sm:p-7 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
        <div className="border-b border-sand-200 dark:border-obsidian-800 pb-3.5">
          <h2 className="font-bold text-xl text-slate-900 dark:text-white">
            {isRegister ? 'Crear cuenta de negocio' : 'Acceso al Panel de Negocio'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isRegister
              ? 'Regístrate para crear y administrar tu negocio'
              : 'Acceso para propietarios, administradores y trabajadores'}
          </p>
        </div>

        {visibleError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {visibleError}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            {infoMessage}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-obsidian-800 hover:bg-slate-800 dark:hover:bg-obsidian-750 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2.5 border border-sand-300 dark:border-obsidian-700 shadow-sm disabled:opacity-60"
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@negocio.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-champagne-600 dark:text-champagne-400 hover:underline font-semibold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isRegister ? 8 : undefined}
              placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors disabled:opacity-60"
          >
            {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setInfoMessage('');
              clearAuthError();
            }}
            className="text-xs text-champagne-600 dark:text-champagne-400 w-full text-center hover:underline font-semibold"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Crear cuenta'}
          </button>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs text-slate-500 dark:text-slate-400 w-full text-center hover:underline"
            >
              Volver a explorar negocios
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
