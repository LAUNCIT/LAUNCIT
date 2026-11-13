import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Store, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/permissions';

export const ProfileDropdown = ({
  onGoToPanel,
  onLogout,
}: {
  onGoToPanel: () => void;
  onLogout: () => void;
}) => {
  const {
    user,
    activeBusiness,
    activeMember,
    userRole,
    memberships,
    requestSwitchBusiness,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName =
    activeMember?.nombre || user.displayName || user.email || 'Usuario';
  const businessName =
    activeBusiness?.name || activeMember?.negocioNombre || 'Sin negocio asignado';
  const roleLabel = userRole ? ROLE_LABELS[userRole] : 'Sin negocio';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menú de usuario"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-champagne-500 text-slate-950 flex items-center justify-center font-extrabold text-xs overflow-hidden border border-champagne-400/60 hover:opacity-90 transition-opacity shrink-0"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-64 bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5">
          <div className="px-2 py-1.5 border-b border-sand-200 dark:border-obsidian-800 space-y-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="pt-1 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                {businessName}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-champagne-500/15 text-champagne-700 dark:text-champagne-400 font-bold shrink-0">
                <ShieldCheck className="w-3 h-3" />
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onGoToPanel();
              }}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sand-100 dark:hover:bg-obsidian-850 rounded-xl transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-champagne-500" />
              <span>Ir a mi panel</span>
            </button>

            {memberships.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  requestSwitchBusiness();
                }}
                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sand-100 dark:hover:bg-obsidian-850 rounded-xl transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cambiar de negocio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
