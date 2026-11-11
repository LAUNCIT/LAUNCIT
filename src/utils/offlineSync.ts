export interface OfflineSyncAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'DELETE' | 'PUT';
  body?: any;
  timestamp: number;
  description?: string;
}

export const OFFLINE_STORAGE_KEYS = {
  VENUES: 'launcit_venues',
  SERVICES: 'launcit_services',
  PROFESSIONALS: 'launcit_professionals',
  WORKING_DAYS: 'launcit_working_days',
  BLOCKED_SLOTS: 'launcit_blocked_slots',
  APPOINTMENTS: 'launcit_appointments',
  WHATSAPP_CONFIG: 'launcit_whatsapp_config',
  SMS_CONFIG: 'launcit_sms_config',
  REVIEWS: 'launcit_reviews',
  QUEUE: 'launcit_offline_queue',
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    // If fallback is an array, ensure parsed is an array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch (err) {
    console.warn(`[offlineSync] Failed to read ${key} from localStorage:`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[offlineSync] Failed to save ${key} to localStorage:`, err);
  }
}

export function getOfflineQueue(): OfflineSyncAction[] {
  return loadFromStorage<OfflineSyncAction[]>(OFFLINE_STORAGE_KEYS.QUEUE, []);
}

export function saveOfflineQueue(queue: OfflineSyncAction[]): void {
  saveToStorage(OFFLINE_STORAGE_KEYS.QUEUE, queue);
}

export function enqueueOfflineAction(
  endpoint: string,
  method: 'POST' | 'DELETE' | 'PUT',
  body?: any,
  description?: string
): OfflineSyncAction[] {
  const currentQueue = getOfflineQueue();
  const newAction: OfflineSyncAction = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    endpoint,
    method,
    body,
    timestamp: Date.now(),
    description: description || `${method} ${endpoint}`,
  };

  const updatedQueue = [...currentQueue, newAction];
  saveOfflineQueue(updatedQueue);
  return updatedQueue;
}

export async function flushOfflineQueue(authToken?: string | null): Promise<{
  syncedCount: number;
  remainingCount: number;
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  let syncedCount = 0;
  const remaining: OfflineSyncAction[] = [];

  for (const item of queue) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(item.endpoint, {
        method: item.method,
        headers,
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      // 2xx success or 404 on delete (already gone on server)
      if (res.ok || (res.status === 404 && item.method === 'DELETE')) {
        syncedCount++;
      } else if (res.status >= 500) {
        // Server error, keep in queue for next sync attempt
        remaining.push(item);
      } else {
        // 4xx bad request / invalid payload, log and remove to avoid blocking the queue permanently
        console.warn(`[offlineSync] Action rejected (${res.status}), discarded:`, item);
      }
    } catch (networkError) {
      // Network still offline or request timed out: stop queue processing and keep remaining
      remaining.push(item);
      // Push the rest of the queue without attempting
      const currentIndex = queue.indexOf(item);
      for (let i = currentIndex + 1; i < queue.length; i++) {
        remaining.push(queue[i]);
      }
      break;
    }
  }

  saveOfflineQueue(remaining);
  return { syncedCount, remainingCount: remaining.length };
}
