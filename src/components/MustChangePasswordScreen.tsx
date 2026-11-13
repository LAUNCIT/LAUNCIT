import React, { useState } from 'react';
import { KeyRound, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MustChangePasswordScreenProps {
  onSuccess: () => void;
  onLogout: () => void;
}

export const MustChangePasswordScreen: React.FC<MustChangePasswordScreenProps> = ({
  onSuccess,
  onLogout,
}) => {
  const { activeMember, activeBusiness, completePasswordChange } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await completePasswordChange(newPassword);
      onSuccess();
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setError(
          'Por seguridad debes volver a iniciar sesión antes de cambiar la contraseña.'
        );
      } else if (err?.code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Usa al menos 8 caracteres.');
      } else {
        setError(err?.message || 'No se pudo actualizar la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-sand-50 dark:bg-obsidian-950">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-md w-full p-6 sm:p-7 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
        <div className="border-b border-sand-200 dark:border-obsidian-800 pb-3.5 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-champagne-500">
              <KeyRound className="w-5 h-5" />
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                Cambia tu contraseña temporal
              </h2>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hola <span className="font-semibold text-slate-800 dark:text-slate-200">{activeMember?.nombre}</span>, por seguridad debes crear una contraseña personal antes de ingresar a{' '}
            <span className="font-semibold text-champagne-600 dark:text-champagne-400">
              {activeBusiness?.name}
            </span>
            .
          </p>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Usa mínimo 8 caracteres que solo tú conozcas.</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nueva contraseña (mínimo 8 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Actualizar contraseña y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
