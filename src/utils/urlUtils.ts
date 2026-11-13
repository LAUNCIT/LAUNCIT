export function getAppBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const { origin, pathname, hostname } = window.location;
  const configuredBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

  // 1. Subpath deployment matching Vite's configured base (e.g. GitHub Pages /LAUNCIT/)
  if (
    configuredBase &&
    configuredBase !== '/' &&
    (pathname === configuredBase || pathname.startsWith(`${configuredBase}/`))
  ) {
    return `${origin}${configuredBase}/`;
  }

  // 2. Any GitHub Pages host (*.github.io/<repo>/...)
  if (hostname.endsWith('.github.io')) {
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    if (firstSegment && !firstSegment.includes('.')) {
      return `${origin}/${firstSegment}/`;
    }
    if (configuredBase && configuredBase !== '/') {
      return `${origin}${configuredBase}/`;
    }
  }

  // 3. Explicit /LAUNCIT subpath fallback
  if (pathname === '/LAUNCIT' || pathname.startsWith('/LAUNCIT/')) {
    return `${origin}/LAUNCIT/`;
  }

  // 4. Root deployment (localhost, AI Studio preview, custom domain)
  return `${origin}/`;
}

export function buildVenueBookingUrl(venue: {
  id: string;
  name: string;
  logo?: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const params = new URLSearchParams();
  if (venue.id) {
    params.set('id', venue.id);
  }
  params.set('negocio', venue.name);

  // Never embed large data: URLs in a QR code; ver.html fetches the logo from Firestore by id
  if (
    venue.logo &&
    !venue.logo.startsWith('data:') &&
    venue.logo.length <= 300
  ) {
    params.set('logo', venue.logo);
  }

  return `${baseUrl}ver.html?${params.toString()}`;
}

export function buildAppointmentTicketUrl(
  venueId: string,
  code: string
): string {
  const baseUrl = getAppBaseUrl();
  const params = new URLSearchParams();
  if (venueId) {
    params.set('id', venueId);
    params.set('negocio', venueId);
  }
  if (code) {
    params.set('codigo', code);
  }
  return `${baseUrl}ver.html?${params.toString()}`;
}

export function buildScannerTestUrl(venue: {
  id: string;
  name: string;
}): string {
  const baseUrl = getAppBaseUrl();
  const params = new URLSearchParams();
  if (venue.id) {
    params.set('id', venue.id);
  }
  params.set('negocio', venue.name);
  return `${baseUrl}escanear.html?${params.toString()}`;
}
