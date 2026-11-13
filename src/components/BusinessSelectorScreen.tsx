import React from 'react';
import { Store, ChevronRight, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/permissions';

interface BusinessSelectorScreenProps {
  onSelect: (negocioId: string) => Promise<void>;
  onLogout: () => void;
}

export const BusinessSelectorScreen: React.FC<BusinessSelectorScreenProps> = ({
  onSelect,
  onLogout,
}) => {
  const { memberships, user, authError } = useAuth();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-sand-50 dark:bg-obsidian-950">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-md w-full p-6 sm:p-7 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
        <div className="border-b border-sand-200 dark:border-obsidian-800 pb-3.5 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              ¿A qué negocio quieres entrar?
            </h2>
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
            Tu correo <span className="font-mono">{user?.email}</span> tiene acceso a varios negocios.
          </p>
        </div>

        {authError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {authError}
          </div>
        )}

        <div className="space-y-2.5">
          {memberships.map((m) => (
            <button
              key={m.negocioId}
              type="button"
              onClick={() => onSelect(m.negocioId)}
              className="w-full p-3.5 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 hover:border-champagne-500 transition-colors flex items-center justify-between gap-3 text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-champagne-500/15 border border-champagne-500/30 text-champagne-500 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {m.negocioNombre}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-champagne-600 dark:text-champagne-400">
                      <ShieldCheck className="w-3 h-3" />
                      {ROLE_LABELS[m.rol] || m.rol}
                    </span>
                    {!m.activo && (
                      <span className="text-[10px] font-bold text-rose-500">
                        · Desactivado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-champagne-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
