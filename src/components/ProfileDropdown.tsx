import React, { useState } from 'react';
import { LogOut, User, Store, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const ProfileDropdown = ({ onGoToPanel, onLogout }: { onGoToPanel: () => void, onLogout: () => void }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
        {user.email?.charAt(0).toUpperCase()}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-10 w-48 bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-xl shadow-lg z-50 p-2">
          <p className="px-2 py-1 text-xs font-bold text-slate-900 dark:text-white truncate">{user.email}</p>
          <button onClick={onGoToPanel} className="flex items-center gap-2 w-full px-2 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-sand-100 dark:hover:bg-obsidian-850 rounded-lg">
            <Store className="w-3.5 h-3.5" /> Ir a mi panel
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 w-full px-2 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg">
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};
