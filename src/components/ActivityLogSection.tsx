import React, { useMemo, useState } from 'react';
import { Activity, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import { ActivityCategory, ActivityLogItem } from '../types';
import { ROLE_LABELS } from '../utils/permissions';

interface ActivityLogSectionProps {
  logs: ActivityLogItem[];
  loading: boolean;
  onRefresh: () => void;
}

const CATEGORY_OPTIONS: Array<{ id: 'all' | ActivityCategory; label: string }> = [
  { id: 'all', label: 'Todo' },
  { id: 'citas', label: 'Citas' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'configuracion', label: 'Configuración' },
  { id: 'plan', label: 'Plan' },
];

export const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({
  logs,
  loading,
  onRefresh,
}) => {
  const [catFilter, setCatFilter] = useState<'all' | ActivityCategory>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((item) => {
      const matchCat = catFilter === 'all' || item.categoria === catFilter;
      const matchSearch =
        !q ||
        item.accion.toLowerCase().includes(q) ||
        item.detalle.toLowerCase().includes(q) ||
        item.actorNombre.toLowerCase().includes(q) ||
        item.actorEmail.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [logs, catFilter, search]);

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-champagne-500" />
            <span>Registro de Actividad</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Auditoría visible solo para el propietario: quién realizó cambios en precios, citas, equipo y configuración.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 bg-white dark:bg-obsidian-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-champagne-500 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar p-1 rounded-xl bg-sand-100 dark:bg-obsidian-850">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCatFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                catFilter === opt.id
                  ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario o acción..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No hay movimientos registrados para este filtro.
          </div>
        ) : (
          <div className="divide-y divide-sand-200 dark:divide-obsidian-800">
            {filteredLogs.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sand-50/70 dark:hover:bg-obsidian-850/40 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {item.accion}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-champagne-500/15 text-champagne-600 dark:text-champagne-400 text-[10px] font-bold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {ROLE_LABELS[item.actorRol] || item.actorRol}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {item.actorNombre}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({item.actorEmail})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {item.detalle}
                  </p>
                </div>

                <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                  {formatDateTime(item.fecha)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
