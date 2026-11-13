import React, { useState } from 'react';
import { Store, CheckCircle2, LogOut } from 'lucide-react';
import { ServiceCategory } from '../types';
import { CATEGORY_LABELS } from '../data/initialData';
import { useAuth } from '../context/AuthContext';

interface CompleteBusinessScreenProps {
  onBusinessCreated: (negocioId: string, name: string) => void;
  onLogout: () => void;
}

export const CompleteBusinessScreen: React.FC<CompleteBusinessScreenProps> = ({
  onBusinessCreated,
  onLogout,
}) => {
  const { user, createBusinessForOwner } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('belleza');
  const [phone, setPhone] = useState('+57 ');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa el nombre de tu negocio.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const created = await createBusinessForOwner({
        name,
        category,
        phone,
        address,
        description,
      });
      onBusinessCreated(created.id, created.name);
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar el negocio. Verifica los permisos de Firebase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-sand-50 dark:bg-obsidian-950">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-sand-200 dark:border-obsidian-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-champagne-500/15 border border-champagne-500/30 flex items-center justify-center text-champagne-500 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                Completa tu negocio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cuenta: <span className="font-mono">{user?.email}</span> · Rol inicial: Propietario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre del establecimiento *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Barbería El Clásico / Spa Armonía"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 font-medium"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp del negocio
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 312 456 7890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-champagne-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección y ciudad
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Cra 13 #82-45, Bogotá"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descripción breve
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntale a tus clientes qué hace especial a tu local..."
              className="w-full px-3.5 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Creando negocio...' : 'Crear negocio y entrar al panel'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
