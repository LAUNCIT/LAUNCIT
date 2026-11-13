import React, { useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  KeyRound,
  Crown,
  Lock,
  Power,
  Eye,
  EyeOff,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  BusinessMember,
  Professional,
  SaasPlanId,
  UserRole,
} from '../types';
import {
  getPlanDisplayName,
  getPlanUserLimit,
  ROLE_LABELS,
} from '../utils/permissions';

interface AccessTeamSectionProps {
  currentUserUid: string;
  activePlan: SaasPlanId;
  members: BusinessMember[];
  professionals: Professional[];
  loading: boolean;
  onCreateMember: (data: {
    nombre: string;
    email: string;
    password: string;
    rol: UserRole;
    profesionalId?: string | null;
    profesionalNombre?: string | null;
  }) => Promise<void>;
  onToggleMemberActive: (member: BusinessMember) => Promise<void>;
  onChangeMemberRole: (
    member: BusinessMember,
    newRole: UserRole,
    profesionalId?: string | null,
    profesionalNombre?: string | null
  ) => Promise<void>;
  onResetMemberPassword: (member: BusinessMember) => Promise<void>;
  onGoToPricing: () => void;
}

export const AccessTeamSection: React.FC<AccessTeamSectionProps> = ({
  currentUserUid,
  activePlan,
  members,
  professionals,
  loading,
  onCreateMember,
  onToggleMemberActive,
  onChangeMemberRole,
  onResetMemberPassword,
  onGoToPricing,
}) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rol, setRol] = useState<UserRole>('trabajador');
  const [selectedProId, setSelectedProId] = useState<string>(
    professionals[0]?.id || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const userLimit = getPlanUserLimit(activePlan);
  const currentCount = members.length;
  const limitReached = currentCount >= userLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (limitReached) {
      setFormError(
        `Tu plan actual (${getPlanDisplayName(activePlan)}) permite máximo ${userLimit} usuario(s). Mejora tu plan para agregar más.`
      );
      return;
    }

    if (!nombre.trim()) {
      setFormError('Ingresa el nombre del integrante.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 8) {
      setFormError('La contraseña temporal debe tener mínimo 8 caracteres.');
      return;
    }

    let linkedPro: Professional | undefined;
    if (rol === 'trabajador') {
      linkedPro = professionals.find((p) => p.id === selectedProId);
      if (!linkedPro) {
        setFormError('Selecciona el especialista vinculado para el trabajador.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onCreateMember({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol,
        profesionalId: linkedPro ? linkedPro.id : null,
        profesionalNombre: linkedPro ? linkedPro.name : null,
      });
      setNombre('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setFormError(
        err?.message || 'No se pudo crear la cuenta del usuario.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Equipo de acceso
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Crea cuentas individuales con correo propio y contraseña temporal para tus administradores y trabajadores.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800">
          <Users className="w-4 h-4 text-champagne-500 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">Cupo del plan: </span>
            <span className="font-mono font-extrabold text-slate-900 dark:text-white">
              {currentCount} / {userLimit}
            </span>
          </div>
          {limitReached && (
            <button
              type="button"
              onClick={onGoToPricing}
              className="px-2.5 py-1 rounded-lg bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-colors"
            >
              <Crown className="w-3 h-3" />
              <span>Mejorar Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Limits Info Strip */}
      <div className="p-4 rounded-2xl bg-sand-100/80 dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-champagne-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            Plan actual: <strong className="text-champagne-600 dark:text-champagne-400">{getPlanDisplayName(activePlan)}</strong> · Límite por plan: Gratis 1, Intermedio 3, Pro 5.
          </span>
        </div>
        {!limitReached && (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
            Puedes crear {userLimit - currentCount} cuenta(s) más
          </span>
        )}
      </div>

      {/* Create Member Form */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-4">
        <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-champagne-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Crear nueva cuenta de acceso
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Se exigirá cambio de contraseña al primer ingreso
          </span>
        </div>

        {limitReached && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Alcanzaste el límite de {userLimit} usuario(s) de tu plan actual.
              </span>
            </div>
            <button
              type="button"
              onClick={onGoToPricing}
              className="px-3 py-1.5 rounded-lg bg-champagne-500 text-slate-950 font-extrabold text-[11px] self-start sm:self-auto"
            >
              Ver Planes
            </button>
          </div>
        )}

        {formError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              required
              disabled={limitReached || submitting}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Laura Gómez"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Correo propio *
            </label>
            <input
              type="email"
              required
              disabled={limitReached || submitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@correo.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña temporal (mín. 8) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                disabled={limitReached || submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-champagne-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rol asignado *
            </label>
            <select
              disabled={limitReached || submitting}
              value={rol}
              onChange={(e) => setRol(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500 disabled:opacity-50"
            >
              <option value="trabajador">Trabajador (Solo su agenda)</option>
              <option value="administrador">Administrador (Operación diaria)</option>
              <option value="propietario">Propietario (Acceso total)</option>
            </select>
          </div>

          {rol === 'trabajador' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Especialista vinculado *
              </label>
              <select
                disabled={limitReached || submitting}
                value={selectedProId}
                onChange={(e) => setSelectedProId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500 disabled:opacity-50"
              >
                {professionals.length === 0 ? (
                  <option value="">Crea un especialista primero</option>
                ) : (
                  professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={limitReached || submitting || (rol === 'trabajador' && professionals.length === 0)}
              className="w-full py-2.5 px-4 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creando cuenta...' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Team Members List */}
      <div className="rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-200 dark:border-obsidian-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Cuentas del negocio ({members.length})
          </h3>
          {loading && (
            <span className="text-xs text-slate-400">Actualizando...</span>
          )}
        </div>

        <div className="divide-y divide-sand-200 dark:divide-obsidian-800">
          {members.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay miembros registrados aún.
            </div>
          ) : (
            members.map((member) => {
              const isSelf = member.uid === currentUserUid;
              const isBusy = busyUid === member.uid;
              return (
                <div
                  key={member.uid}
                  className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-sand-50/70 dark:hover:bg-obsidian-850/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {member.nombre}
                      </span>
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-md bg-champagne-500/15 text-champagne-600 dark:text-champagne-400 text-[10px] font-bold">
                          Tú
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          member.activo
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {member.activo ? 'Activo' : 'Desactivado'}
                      </span>
                      {member.mustChangePassword && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          Clave temporal pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                      {member.email}
                    </p>
                    {member.rol === 'trabajador' && member.profesionalNombre && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Especialista vinculado:{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {member.profesionalNombre}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs">
                    {isSelf ? (
                      <span
                        title="No puedes quitar ni cambiar tu propio rol"
                        className="px-3 py-1.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3 text-champagne-500" />
                        <span>{ROLE_LABELS[member.rol]}</span>
                      </span>
                    ) : (
                      <select
                        disabled={isBusy}
                        aria-label={`Rol de ${member.nombre}`}
                        value={member.rol}
                        onChange={async (e) => {
                          const newRole = e.target.value as UserRole;
                          setBusyUid(member.uid);
                          try {
                            const defaultPro =
                              newRole === 'trabajador'
                                ? professionals.find((p) => p.id === member.profesionalId) ||
                                  professionals[0]
                                : undefined;
                            await onChangeMemberRole(
                              member,
                              newRole,
                              defaultPro?.id || null,
                              defaultPro?.name || null
                            );
                          } finally {
                            setBusyUid(null);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-champagne-500"
                      >
                        <option value="trabajador">Trabajador</option>
                        <option value="administrador">Administrador</option>
                        <option value="propietario">Propietario</option>
                      </select>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={async () => {
                        setBusyUid(member.uid);
                        try {
                          await onResetMemberPassword(member);
                        } finally {
                          setBusyUid(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl border border-sand-200 dark:border-obsidian-750 text-slate-700 dark:text-slate-200 hover:border-champagne-500 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-champagne-500" />
                      <span>Restablecer clave</span>
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={async () => {
                          setBusyUid(member.uid);
                          try {
                            await onToggleMemberActive(member);
                          } finally {
                            setBusyUid(null);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                          member.activo
                            ? 'border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{member.activo ? 'Desactivar' : 'Activar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
