import { BusinessSubView, SaasPlanId, UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  propietario: 'Propietario',
  administrador: 'Administrador',
  trabajador: 'Trabajador',
};

const ADMIN_ALLOWED_VIEWS: ReadonlySet<BusinessSubView> = new Set([
  'dashboard',
  'calendar',
  'services',
  'schedule',
  'professionals',
  'venue',
  'whatsapp',
  'notifications',
]);

const WORKER_ALLOWED_VIEWS: ReadonlySet<BusinessSubView> = new Set(['calendar']);

export function canAccessView(role: UserRole | null | undefined, view: BusinessSubView): boolean {
  if (!role) return false;
  if (role === 'propietario') return true;
  if (role === 'administrador') return ADMIN_ALLOWED_VIEWS.has(view);
  if (role === 'trabajador') return WORKER_ALLOWED_VIEWS.has(view);
  return false;
}

export function getDefaultViewForRole(role: UserRole | null | undefined): BusinessSubView {
  if (role === 'trabajador') return 'calendar';
  return 'dashboard';
}

export interface SaasPlanDefinition {
  id: 'gratis' | 'intermedio' | 'pro';
  name: string;
  shortName: string;
  audience: string;
  monthlyPrice: number;
  userLimit: number;
  reservationLimit: number | null; // null = ilimitadas
  roleControl: boolean;
  prioritySupport: boolean;
  features: string[];
}

export const SAAS_PLANS: SaasPlanDefinition[] = [
  {
    id: 'gratis',
    name: 'Plan Gratis',
    shortName: 'Gratis',
    audience: 'Para profesionales independientes',
    monthlyPrice: 0,
    userLimit: 1,
    reservationLimit: 40,
    roleControl: false,
    prioritySupport: false,
    features: [
      '1 usuario incluido',
      'Hasta 40 reservas',
      'Reserva cliente sin registro en 4 pasos',
      'Agenda y catálogo básico de servicios',
    ],
  },
  {
    id: 'intermedio',
    name: 'Plan Intermedio',
    shortName: 'Intermedio',
    audience: 'Para barberías, spas y salones en crecimiento',
    monthlyPrice: 49000,
    userLimit: 3,
    reservationLimit: null,
    roleControl: false,
    prioritySupport: false,
    features: [
      'Hasta 3 usuarios en Equipo de acceso',
      'Reservas ilimitadas',
      'Calendario inteligente con bloqueos horarios',
      'Plantillas de confirmación por WhatsApp',
      'Burbuja con logo animado al escanear con LAUNCIT',
    ],
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    shortName: 'Pro',
    audience: 'Para clínicas estéticas y múltiples sedes',
    monthlyPrice: 99000,
    userLimit: 5,
    reservationLimit: null,
    roleControl: true,
    prioritySupport: true,
    features: [
      'Hasta 5 usuarios en Equipo de acceso',
      'Reservas ilimitadas',
      'Control de roles (Propietario, Administrador y Trabajador)',
      'Registro de actividad y soporte prioritario',
      'Recordatorios WhatsApp avanzados',
    ],
  },
];

export function normalizePlanId(plan: SaasPlanId | string | undefined): 'gratis' | 'intermedio' | 'pro' {
  switch (plan) {
    case 'intermedio':
      return 'intermedio';
    case 'pro':
    case 'elite':
      return 'pro';
    case 'gratis':
    case 'basico':
    default:
      return 'gratis';
  }
}

export function getSaasPlanConfig(plan: SaasPlanId | string | undefined): SaasPlanDefinition {
  const normalized = normalizePlanId(plan);
  return SAAS_PLANS.find((p) => p.id === normalized) || SAAS_PLANS[0];
}

export function getPlanUserLimit(plan: SaasPlanId | string | undefined): number {
  return getSaasPlanConfig(plan).userLimit;
}

export function getPlanReservationLimit(plan: SaasPlanId | string | undefined): number | null {
  return getSaasPlanConfig(plan).reservationLimit;
}

export function getPlanShortName(plan: SaasPlanId | string | undefined): string {
  return getSaasPlanConfig(plan).name;
}

export function getPlanDisplayName(plan: SaasPlanId | string | undefined): string {
  const cfg = getSaasPlanConfig(plan);
  if (cfg.id === 'gratis') return 'Plan Gratis (1 usuario · hasta 40 reservas)';
  if (cfg.id === 'intermedio') return 'Plan Intermedio (hasta 3 usuarios · reservas ilimitadas)';
  return 'Plan Pro (hasta 5 usuarios · control de roles y soporte prioritario)';
}
