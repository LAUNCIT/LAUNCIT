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

export function getPlanUserLimit(plan: SaasPlanId | string | undefined): number {
  switch (plan) {
    case 'gratis':
    case 'basico':
      return 1;
    case 'intermedio':
      return 3;
    case 'pro':
    case 'elite':
      return 5;
    default:
      return 1;
  }
}

export function getPlanDisplayName(plan: SaasPlanId | string | undefined): string {
  switch (plan) {
    case 'gratis':
    case 'basico':
      return 'Gratis (1 usuario)';
    case 'intermedio':
      return 'Intermedio (3 usuarios)';
    case 'pro':
    case 'elite':
      return 'Pro (5 usuarios)';
    default:
      return 'Gratis (1 usuario)';
  }
}
