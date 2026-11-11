// Configuration for Global Launcit 3D Model & WebAR

export const DEFAULT_GLOBAL_GLB = './logo_launcit.glb';
export const FALLBACK_DEMO_GLB = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
export const STORAGE_KEY_GLOBAL_GLB = 'launcit_global_glb_url';

export function getGlobalGlbUrl(): string {
  try {
    const customUrl = localStorage.getItem(STORAGE_KEY_GLOBAL_GLB);
    if (customUrl && customUrl.trim().length > 0) {
      return customUrl.trim();
    }
  } catch (e) {
    // Ignore localStorage access issues
  }
  return DEFAULT_GLOBAL_GLB;
}

export function setGlobalGlbUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL_GLB, url.trim());
  } catch (e) {
    // Ignore localStorage access issues
  }
}
