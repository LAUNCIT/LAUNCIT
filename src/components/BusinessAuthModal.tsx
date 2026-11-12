import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, X } from 'lucide-react';

import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface BusinessAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (partnerEmail: string, idToken?: string) => void;
}

export const BusinessAuthModal: React.FC<BusinessAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [email, setEmail] = useState('admin@glowcitas.com');
  const [password, setPassword] = useState('glow2026');
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      // Sync user with backend
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch((e) => console.warn('User sync notice:', e));

      onAuthenticated(user.email || 'socio@glowcitas.com', token);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      // If popup was closed by user or cancelled, show gentle message
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo completar el inicio de sesión con Google.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      setError('Ingresa un correo electrónico corporativo válido.');
      return;
    }
    if (password.trim().length < 4) {
      setError('La contraseña de socio debe tener al menos 4 caracteres.');
      return;
    }
    setError('');
    onAuthenticated(cleanEmail);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="biz-auth-title"
    >
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-md w-full p-6 sm:p-7 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-champagne-500/15 text-champagne-600 dark:text-champagne-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="biz-auth-title"
                className="font-bold text-base text-slate-900 dark:text-white"
              >
                Acceso al Panel de Negocio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Portal protegido para propietarios y socios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar acceso de negocio"
            className="w-8 h-8 rounded-lg border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Administra los servicios y tarifas en COP, configura días cerrados o bloqueos horarios, gestiona especialistas y consulta la agenda general del negocio.
        </p>

        {/* Google Sign-In with Firebase Auth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-obsidian-800 hover:bg-slate-800 dark:hover:bg-obsidian-750 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2.5 border border-sand-300 dark:border-obsidian-700 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loadingGoogle ? 'Conectando con Google...' : 'Continuar con Google'}</span>
        </button>

        <button
          type="button"
          onClick={() => onAuthenticated('admin@glowcitas.com')}
          className="w-full py-2.5 px-4 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          <span>Acceso Rápido Demo (admin@glowcitas.com)</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-sand-200 dark:bg-obsidian-800 flex-1" />
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            o con credenciales de socio
          </span>
          <div className="h-px bg-sand-200 dark:bg-obsidian-800 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label
              htmlFor="partner-email-input"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Correo del Negocio
            </label>
            <input
              id="partner-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@glowcitas.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>

          <div>
            <label
              htmlFor="partner-pass-input"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Contraseña de Socio
            </label>
            <input
              id="partner-pass-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-semibold"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl border border-sand-300 dark:border-obsidian-700 text-slate-800 dark:text-white font-bold hover:bg-sand-100 dark:hover:bg-obsidian-850 transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-champagne-500" />
            <span>Iniciar Sesión de Socio</span>
          </button>
        </form>
      </div>
    </div>
  );
};
