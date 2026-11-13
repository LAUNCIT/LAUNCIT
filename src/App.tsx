import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  HelpCircle,
  ListChecks,
  Lock,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  PieChart,
  Store,
  Sun,
  User,
  Users,
  X,
  QrCode,
  WifiOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  OFFLINE_STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  getOfflineQueue,
  enqueueOfflineAction,
  flushOfflineQueue,
} from './utils/offlineSync';
import {
  ActivityLogItem,
  Appointment,
  AppRole,
  BlockedSlot,
  BusinessMember,
  BusinessSubView,
  ClientSubView,
  DayName,
  Professional,
  PushConfig,
  Review,
  SaasPlanId,
  ServiceItem,
  SmsConfig,
  UserRole,
  Venue,
  WhatsAppConfig,
  WorkingDayConfig,
} from './types';
import {
  BRAND_LOGO_FALLBACK,
  DEFAULT_PUSH_CONFIG,
  DEFAULT_SMS_CONFIG,
  DEFAULT_WHATSAPP_CONFIG,
  INITIAL_APPOINTMENTS,
  INITIAL_BLOCKED_SLOTS,
  INITIAL_PROFESSIONALS,
  INITIAL_REVIEWS,
  INITIAL_SERVICES,
  INITIAL_VENUES,
  INITIAL_WORKING_DAYS,
} from './data/initialData';
import { formatCOP } from './utils/scheduleUtils';
import {
  canAccessView,
  getDefaultViewForRole,
  getPlanDisplayName,
  getPlanReservationLimit,
  getPlanUserLimit,
  getSaasPlanConfig,
  normalizePlanId,
  ROLE_LABELS,
} from './utils/permissions';
import { useAuth } from './context/AuthContext';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import {
  auth,
  createMemberAccountWithSecondaryAuth,
  db,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ResilientImage } from './components/ResilientImage';
import { ClientWorld } from './components/ClientWorld';
import { BusinessPanel } from './components/BusinessPanel';
import { BookingWizardModal } from './components/BookingWizardModal';
import { AuthScreen } from './components/AuthScreen';
import { CompleteBusinessScreen } from './components/CompleteBusinessScreen';
import { BusinessSelectorScreen } from './components/BusinessSelectorScreen';
import { MustChangePasswordScreen } from './components/MustChangePasswordScreen';
import { ProfileDropdown } from './components/ProfileDropdown';
import { SmartQRSplashModal } from './components/SmartQRSplashModal';

export default function App() {
  const {
    user,
    loading,
    memberships,
    activeBusiness,
    activeMember,
    userRole,
    needsBusinessSelection,
    mustChangePassword,
    authError,
    selectBusiness,
    refreshSessionData,
    logActivity,
    refreshActiveBusinessDoc,
  } = useAuth();

  type NavigationView = 'inicio' | 'login' | 'completar-negocio' | 'panel';
  const [view, setView] = useState<NavigationView>('inicio');
  const [role, setRole] = useState<AppRole>('client');
  const [teamMembers, setTeamMembers] = useState<BusinessMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const navigateTo = useCallback(
    (newView: NavigationView) => {
      if (view === 'panel' && newView !== 'panel') {
        if (
          !window.confirm(
            '¿Seguro que quieres salir del Panel de Negocio?'
          )
        )
          return;
      }
      setView(newView);
      if (newView === 'panel' || newView === 'completar-negocio')
        setRole('business');
      else setRole('client');
      setMobileMenuOpen(false);
    },
    [view]
  );

  // Navigation within each world
  const [clientView, setClientView] = useState<ClientSubView>('explore');
  const [businessView, setBusinessView] = useState<BusinessSubView>('dashboard');

  // Layout & Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialVenue, setBookingInitialVenue] = useState<Venue | null>(
    null
  );

  // Shared Synchronized Platform State (Hydrated from localStorage for offline continuity)
  const [venues, setVenues] = useState<Venue[]>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.VENUES, INITIAL_VENUES)
  );
  const [services, setServices] = useState<ServiceItem[]>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.SERVICES, INITIAL_SERVICES)
  );
  const [professionals, setProfessionals] = useState<Professional[]>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.PROFESSIONALS, INITIAL_PROFESSIONALS)
  );
  const [workingDays, setWorkingDays] = useState<Record<DayName, WorkingDayConfig>>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.WORKING_DAYS, INITIAL_WORKING_DAYS)
  );
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.BLOCKED_SLOTS, INITIAL_BLOCKED_SLOTS)
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS)
  );
  const [activePlan, setActivePlan] = useState<SaasPlanId>('gratis');
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.WHATSAPP_CONFIG, DEFAULT_WHATSAPP_CONFIG)
  );
  const [smsConfig, setSmsConfig] = useState<SmsConfig>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.SMS_CONFIG, DEFAULT_SMS_CONFIG)
  );
  const [pushConfig, setPushConfig] = useState<PushConfig>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.PUSH_CONFIG, DEFAULT_PUSH_CONFIG)
  );
  const [reviews, setReviews] = useState<Review[]>(() =>
    loadFromStorage(OFFLINE_STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS)
  );

  const [authToken, setAuthToken] = useState<string | null>(null);

  // Online / Offline & Sync Queue State
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    return getOfflineQueue().length;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Client Lookup Phone
  const [lookupPhone, setLookupPhone] = useState('+57 312 456 7890');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.VENUES, venues);
  }, [venues]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.SERVICES, services);
  }, [services]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.PROFESSIONALS, professionals);
  }, [professionals]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.WORKING_DAYS, workingDays);
  }, [workingDays]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.BLOCKED_SLOTS, blockedSlots);
  }, [blockedSlots]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.APPOINTMENTS, appointments);
  }, [appointments]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.WHATSAPP_CONFIG, whatsAppConfig);
  }, [whatsAppConfig]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.SMS_CONFIG, smsConfig);
  }, [smsConfig]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.PUSH_CONFIG, pushConfig);
  }, [pushConfig]);

  useEffect(() => {
    saveToStorage(OFFLINE_STORAGE_KEYS.REVIEWS, reviews);
  }, [reviews]);

  // Automated Queue Synchronization with Backend
  const triggerSync = useCallback(async (manual = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (manual) {
        showToast('Aún no hay conexión a internet. Los cambios se mantienen guardados localmente.');
      }
      return;
    }

    setIsSyncing(true);
    try {
      const { syncedCount, remainingCount } = await flushOfflineQueue(authToken);
      setPendingSyncCount(remainingCount);

      if (syncedCount > 0) {
        showToast(`✨ Conexión recuperada: ${syncedCount} cambio(s) sincronizado(s) con el servidor.`);
      } else if (manual) {
        showToast('Todos los datos están sincronizados con el servidor.');
      }
    } catch (err) {
      console.warn('Sync queue flush error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [authToken]);

  // Network connection monitor & periodic flush
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 Conexión reestablecida. Sincronizando datos...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Modo sin conexión: los cambios se guardan localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Heartbeat check every 25 seconds if unsynced changes exist
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && getOfflineQueue().length > 0) {
        triggerSync();
      }
    }, 25000);

    // Check on initial load
    if (typeof navigator !== 'undefined' && navigator.onLine && getOfflineQueue().length > 0) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync]);

  // Helper to dispatch mutation to server or queue for offline sync
  const dispatchSyncAction = useCallback(
    async (
      endpoint: string,
      method: 'POST' | 'DELETE',
      body?: any,
      description?: string
    ) => {
      const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (!isOnlineNow) {
        const updated = enqueueOfflineAction(endpoint, method, body, description);
        setPendingSyncCount(updated.length);
        return;
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(endpoint, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok && res.status >= 500) {
          const updated = enqueueOfflineAction(endpoint, method, body, description);
          setPendingSyncCount(updated.length);
        }
      } catch {
        const updated = enqueueOfflineAction(endpoint, method, body, description);
        setPendingSyncCount(updated.length);
      }
    },
    [authToken]
  );

  const handleAddReview = (newRev: Omit<Review, 'id' | 'date'>) => {
    const reviewObj: Review = {
      ...newRev,
      id: `rev_${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
    setReviews((prev) => [reviewObj, ...prev]);

    setVenues((prevVenues) =>
      prevVenues.map((v) => {
        if (v.id === newRev.venueId) {
          const venueRevs = [
            ...reviews.filter((r) => r.venueId === v.id),
            reviewObj,
          ];
          const avg =
            venueRevs.reduce((acc, curr) => acc + curr.rating, 0) /
            venueRevs.length;
          return { ...v, rating: Math.round(avg * 10) / 10 };
        }
        return v;
      })
    );
    showToast('¡Gracias por tu opinión! Tu calificación ha sido publicada.');
  };

  const handleSaveSmsConfig = (config: SmsConfig) => {
    setSmsConfig(config);
    showToast('Configuración y plantilla de recordatorios SMS guardadas con éxito.');
  };

  // Synchronize initial data from Cloud SQL PostgreSQL backend
  useEffect(() => {
    const loadCloudSqlData = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return; // Work fully from localStorage while offline
      }
      try {
        const [resServices, resPros, resAppts, resBlocks, resWa, resVenues] = await Promise.allSettled([
          fetch('/api/services').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/professionals').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/appointments').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/blocked-slots').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/whatsapp-config').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/venues').then((r) => (r.ok ? r.json() : null)),
        ]);

        const hasPendingLocalMutations = getOfflineQueue().length > 0;

        // Preserve unsynced offline changes without overwriting from server
        if (!hasPendingLocalMutations) {
          if (resServices.status === 'fulfilled' && Array.isArray(resServices.value) && resServices.value.length > 0) {
            setServices(resServices.value);
          }
          if (resPros.status === 'fulfilled' && Array.isArray(resPros.value) && resPros.value.length > 0) {
            setProfessionals(resPros.value);
          }
          if (resAppts.status === 'fulfilled' && Array.isArray(resAppts.value) && resAppts.value.length > 0) {
            setAppointments(resAppts.value);
          }
          if (resBlocks.status === 'fulfilled' && Array.isArray(resBlocks.value) && resBlocks.value.length > 0) {
            setBlockedSlots(resBlocks.value);
          }
          if (resWa.status === 'fulfilled' && resWa.value && resWa.value.businessPhone) {
            setWhatsAppConfig(resWa.value);
          }
          if (resVenues.status === 'fulfilled' && Array.isArray(resVenues.value) && resVenues.value.length > 0) {
            setVenues(resVenues.value);
          }
        }
      } catch (err) {
        console.warn('Notice loading data from backend:', err);
      }
    };

    loadCloudSqlData();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Deep-link handling for QR codes (?venueId=...)
  const [qrSplashVenue, setQrSplashVenue] = useState<Venue | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('negocio') || params.get('venueId') || params.get('id');
    if (queryParam && venues.length > 0) {
      const decoded = decodeURIComponent(queryParam).toLowerCase().trim();
      const targetVenue = venues.find(
        (v) =>
          v.id.toLowerCase() === decoded ||
          v.name.toLowerCase() === decoded ||
          v.name.toLowerCase().replace(/\s+/g, '-') === decoded ||
          v.name.toLowerCase().replace(/[^a-z0-9]/g, '') === decoded.replace(/[^a-z0-9]/g, '')
      );
      if (targetVenue) {
        setQrSplashVenue(targetVenue);
        // Increment scan stat in local storage
        try {
          const statsKey = `launci_qr_stats_${targetVenue.id}`;
          const current = JSON.parse(
            localStorage.getItem(statsKey) ||
              '{"scans": 0, "uniqueVisits": 0, "profileVisits": 0, "bookingClicks": 0, "completedBookings": 0}'
          );
          current.scans += 1;
          current.uniqueVisits += 1;
          localStorage.setItem(statsKey, JSON.stringify(current));
        } catch (e) {}
      }
    }
  }, [venues]);

  const fetchTeamMembers = useCallback(async (negocioId: string) => {
    setTeamLoading(true);
    try {
      const snap = await getDocs(collection(db, 'negocios', negocioId, 'miembros'));
      const list = snap.docs.map((d) => ({ ...(d.data() as BusinessMember), uid: d.id }));
      setTeamMembers(list);
    } catch (err) {
      console.warn('Error cargando equipo de acceso:', err);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const fetchActivityLogs = useCallback(async (negocioId: string) => {
    setActivityLoading(true);
    try {
      const q = query(
        collection(db, 'negocios', negocioId, 'actividad'),
        orderBy('fecha', 'desc')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        ...(d.data() as Omit<ActivityLogItem, 'id'>),
        id: d.id,
      }));
      setActivityLogs(list);
    } catch (err) {
      console.warn('Error cargando registro de actividad:', err);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Synchronize auth state transitions cleanly
  useEffect(() => {
    if (loading) return;

    if (authError && !user) {
      setView('login');
      setRole('client');
      return;
    }

    if (!user) {
      if (view === 'panel' || view === 'completar-negocio') {
        setView('login');
        setRole('client');
      }
      setTeamMembers([]);
      setActivityLogs([]);
      return;
    }

    if (needsBusinessSelection || mustChangePassword) {
      return;
    }

    if (memberships.length === 0) {
      if (view === 'login' || view === 'panel') {
        setView('completar-negocio');
        setRole('business');
      }
      return;
    }

    if (activeBusiness && activeMember) {
      if (view === 'login' || view === 'completar-negocio') {
        setView('panel');
        setRole('business');
      }
      if (!canAccessView(activeMember.rol, businessView)) {
        setBusinessView(getDefaultViewForRole(activeMember.rol));
      }
    }
  }, [
    loading,
    user,
    authError,
    memberships.length,
    activeBusiness,
    activeMember,
    needsBusinessSelection,
    mustChangePassword,
    view,
    businessView,
  ]);

  // Load business data from Firestore when activeBusiness / activeMember resolves
  useEffect(() => {
    if (!user || !activeBusiness || !activeMember) return;
    const bizId = activeBusiness.id;

    const loadFirestoreBusinessData = async () => {
      try {
        if (activeBusiness.plan) {
          setActivePlan(normalizePlanId(activeBusiness.plan));
        }
        if (activeBusiness.whatsAppConfig) {
          setWhatsAppConfig(activeBusiness.whatsAppConfig);
        }

        // Ensure activeBusiness appears at top of venues list for panel operations
        const activeVenueObj: Venue = {
          id: activeBusiness.id,
          name: activeBusiness.name,
          category: activeBusiness.category,
          categoryLabel: activeBusiness.categoryLabel || 'Negocio',
          subCategory: activeBusiness.subCategory,
          rating: 5.0,
          location: activeBusiness.location || activeBusiness.address || 'Colombia',
          priceLevel: '$$',
          image:
            activeBusiness.image ||
            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
          logo: activeBusiness.logo,
          photos: activeBusiness.photos,
          description: activeBusiness.description,
          phone: activeBusiness.phone,
          address: activeBusiness.address,
        };
        setVenues((prev) => {
          const rest = prev.filter((v) => v.id !== activeVenueObj.id);
          return [activeVenueObj, ...rest];
        });

        // Load horarios
        try {
          const horSnap = await getDoc(doc(db, 'negocios', bizId, 'horarios', 'config'));
          if (horSnap.exists() && horSnap.data()?.workingDays) {
            setWorkingDays(horSnap.data().workingDays);
          } else if (activeBusiness.workingDays) {
            setWorkingDays(activeBusiness.workingDays);
          }
        } catch {}

        // Load servicios
        try {
          const svcSnap = await getDocs(collection(db, 'negocios', bizId, 'servicios'));
          if (!svcSnap.empty) {
            setServices(
              svcSnap.docs.map((d) => ({ ...(d.data() as ServiceItem), id: d.id }))
            );
          }
        } catch {}

        // Load profesionales
        try {
          const proSnap = await getDocs(collection(db, 'negocios', bizId, 'profesionales'));
          if (!proSnap.empty) {
            setProfessionals(
              proSnap.docs.map((d) => ({ ...(d.data() as Professional), id: d.id }))
            );
          }
        } catch {}

        // Load bloqueos
        try {
          const blkSnap = await getDocs(collection(db, 'negocios', bizId, 'bloqueos'));
          if (!blkSnap.empty) {
            setBlockedSlots(
              blkSnap.docs.map((d) => ({ ...(d.data() as BlockedSlot), id: d.id }))
            );
          }
        } catch {}

        // Load citas according to role security rules
        try {
          const citasRef = collection(db, 'negocios', bizId, 'citas');
          const citasQ =
            activeMember.rol === 'trabajador'
              ? query(citasRef, where('profesionalUid', '==', user.uid))
              : citasRef;
          const citasSnap = await getDocs(citasQ);
          if (!citasSnap.empty) {
            const cloudAppts = citasSnap.docs.map((d) => ({
              ...(d.data() as Appointment),
              id: d.id,
            }));
            setAppointments((prev) => {
              const cloudIds = new Set(cloudAppts.map((a) => a.id));
              const localOthers = prev.filter((a) => a.venueId !== bizId && !cloudIds.has(a.id));
              return [...cloudAppts, ...localOthers];
            });
          } else if (activeMember.rol === 'trabajador') {
            // Worker should not see other venues' mock appointments
            setAppointments((prev) =>
              prev.filter((a) => a.profesionalUid === user.uid)
            );
          }
        } catch (err) {
          console.warn('Error cargando citas de Firestore:', err);
        }

        if (activeMember.rol === 'propietario') {
          await Promise.all([fetchTeamMembers(bizId), fetchActivityLogs(bizId)]);
        } else {
          setTeamMembers([]);
          setActivityLogs([]);
        }
      } catch (err) {
        console.error('Error cargando datos del negocio en Firestore:', err);
      }
    };

    loadFirestoreBusinessData();
  }, [user, activeBusiness, activeMember, fetchTeamMembers, fetchActivityLogs]);

  const goToHome = () => {
    if (view === 'panel') {
      if (!window.confirm('¿Seguro que quieres volver al inicio?')) return;
    }
    setView('inicio');
    setRole('client');
    setMobileMenuOpen(false);
  };

  const handleRequestBusinessAccess = () => {
    if (!user) {
      navigateTo('login');
    } else if (memberships.length === 0) {
      navigateTo('completar-negocio');
    } else {
      if (userRole && !canAccessView(userRole, businessView)) {
        setBusinessView(getDefaultViewForRole(userRole));
      }
      navigateTo('panel');
    }
  };

  const handleLogoutBusiness = async () => {
    await signOut(auth);
    setView('inicio');
    setRole('client');
    setMobileMenuOpen(false);
    showToast('Sesión cerrada.');
  };

  const handleCreateTeamMember = async (data: {
    nombre: string;
    email: string;
    password: string;
    rol: UserRole;
    profesionalId?: string | null;
    profesionalNombre?: string | null;
  }) => {
    if (!activeBusiness || userRole !== 'propietario' || !user) {
      throw new Error('Solo el propietario puede crear cuentas.');
    }
    const limit = getPlanUserLimit(activePlan);
    if (teamMembers.length >= limit) {
      throw new Error(
        `Tu plan (${getPlanDisplayName(activePlan)}) permite máximo ${limit} usuario(s).`
      );
    }

    let createdUid = '';
    try {
      const res = await createMemberAccountWithSecondaryAuth({
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        negocioId: activeBusiness.id,
        negocioNombre: activeBusiness.name,
        rol: data.rol,
      });
      createdUid = res.uid;
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error(
          'Este correo ya está registrado en Firebase Auth. Usa un correo distinto para crear una cuenta nueva.'
        );
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error('La contraseña temporal debe tener mínimo 8 caracteres.');
      }
      throw new Error(err?.message || 'Error al crear la cuenta en Firebase.');
    }

    const newMember: BusinessMember = {
      uid: createdUid,
      negocioId: activeBusiness.id,
      negocioNombre: activeBusiness.name,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      activo: true,
      mustChangePassword: true,
      profesionalId: data.rol === 'trabajador' ? data.profesionalId || null : null,
      profesionalNombre:
        data.rol === 'trabajador' ? data.profesionalNombre || null : null,
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    };

    await setDoc(
      doc(db, 'negocios', activeBusiness.id, 'miembros', createdUid),
      newMember
    );

    if (data.rol === 'trabajador' && data.profesionalId) {
      const linkedPro = professionals.find((p) => p.id === data.profesionalId);
      if (linkedPro) {
        const updatedPro: Professional = { ...linkedPro, linkedUid: createdUid };
        setProfessionals((prev) =>
          prev.map((p) => (p.id === linkedPro.id ? updatedPro : p))
        );
        await setDoc(
          doc(db, 'negocios', activeBusiness.id, 'profesionales', linkedPro.id),
          updatedPro,
          { merge: true }
        ).catch(() => {});
      }
    }

    await logActivity({
      accion: 'Usuario creado en Equipo de acceso',
      detalle: `Se creó la cuenta de ${data.nombre} (${data.email}) con rol ${ROLE_LABELS[data.rol]}${
        data.profesionalNombre ? ` · Especialista: ${data.profesionalNombre}` : ''
      }.`,
      categoria: 'equipo',
    });

    await Promise.all([
      fetchTeamMembers(activeBusiness.id),
      fetchActivityLogs(activeBusiness.id),
    ]);
    showToast(`Cuenta creada para ${data.nombre}. Deberá cambiar su clave al ingresar.`);
  };

  const handleToggleMemberActive = async (member: BusinessMember) => {
    if (!activeBusiness || userRole !== 'propietario') return;
    if (member.uid === user?.uid) {
      showToast('No puedes desactivar tu propia cuenta.');
      return;
    }
    const nextActivo = !member.activo;
    await updateDoc(
      doc(db, 'negocios', activeBusiness.id, 'miembros', member.uid),
      { activo: nextActivo }
    );
    await logActivity({
      accion: nextActivo ? 'Usuario activado' : 'Usuario desactivado',
      detalle: `${member.nombre} (${member.email}) fue ${nextActivo ? 'activado' : 'desactivado'}.`,
      categoria: 'equipo',
    });
    await Promise.all([
      fetchTeamMembers(activeBusiness.id),
      fetchActivityLogs(activeBusiness.id),
    ]);
    showToast(
      `Acceso de ${member.nombre} ${nextActivo ? 'activado' : 'desactivado'}.`
    );
  };

  const handleChangeMemberRole = async (
    member: BusinessMember,
    newRole: UserRole,
    profesionalId?: string | null,
    profesionalNombre?: string | null
  ) => {
    if (!activeBusiness || userRole !== 'propietario') return;
    if (member.uid === user?.uid) {
      showToast('No puedes cambiar ni quitar tu propio rol.');
      return;
    }
    await updateDoc(
      doc(db, 'negocios', activeBusiness.id, 'miembros', member.uid),
      {
        rol: newRole,
        profesionalId: newRole === 'trabajador' ? profesionalId || null : null,
        profesionalNombre:
          newRole === 'trabajador' ? profesionalNombre || null : null,
      }
    );

    if (newRole === 'trabajador' && profesionalId) {
      const pro = professionals.find((p) => p.id === profesionalId);
      if (pro) {
        const updatedPro: Professional = { ...pro, linkedUid: member.uid };
        setProfessionals((prev) =>
          prev.map((p) => (p.id === pro.id ? updatedPro : p))
        );
        await setDoc(
          doc(db, 'negocios', activeBusiness.id, 'profesionales', pro.id),
          updatedPro,
          { merge: true }
        ).catch(() => {});
      }
    }

    await logActivity({
      accion: 'Rol de usuario actualizado',
      detalle: `${member.nombre} (${member.email}) cambió de ${ROLE_LABELS[member.rol]} a ${ROLE_LABELS[newRole]}.`,
      categoria: 'equipo',
    });
    await Promise.all([
      fetchTeamMembers(activeBusiness.id),
      fetchActivityLogs(activeBusiness.id),
    ]);
    showToast(`Rol de ${member.nombre} actualizado a ${ROLE_LABELS[newRole]}.`);
  };

  const handleResetMemberPassword = async (member: BusinessMember) => {
    if (!activeBusiness || userRole !== 'propietario') return;
    await sendPasswordResetEmail(auth, member.email);
    await logActivity({
      accion: 'Restablecimiento de contraseña enviado',
      detalle: `Se envió correo de restablecimiento de contraseña a ${member.email}.`,
      categoria: 'equipo',
    });
    await fetchActivityLogs(activeBusiness.id);
    showToast(`Enlace de restablecimiento enviado a ${member.email}.`);
  };




  // Client Booking Handlers (Persisted to Cloud SQL & Firestore without registration)
  const handleOpenBooking = (venue?: Venue) => {
    setBookingInitialVenue(venue || venues[0]);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = (newAppt: Appointment): boolean => {
    if (activeBusiness && newAppt.venueId === activeBusiness.id) {
      const resLimit = getPlanReservationLimit(activePlan);
      if (resLimit !== null) {
        const activeBizCount = appointments.filter(
          (a) => a.venueId === activeBusiness.id && a.status !== 'Cancelada'
        ).length;
        if (activeBizCount >= resLimit) {
          showToast(
            `Límite de ${resLimit} reservas alcanzado en el Plan Gratis. Cambia a Plan Intermedio o Pro para reservas ilimitadas.`
          );
          return false;
        }
      }
    }

    const matchedPro = professionals.find((p) => p.id === newAppt.proId);
    const enrichedAppt: Appointment = {
      ...newAppt,
      profesionalUid: newAppt.profesionalUid || matchedPro?.linkedUid,
    };

    setAppointments((prev) => [enrichedAppt, ...prev]);
    setLookupPhone(enrichedAppt.phone);
    showToast(
      `Cita ${enrichedAppt.code} confirmada para ${enrichedAppt.client}. Comprobante listo para WhatsApp.`
    );

    if (enrichedAppt.venueId) {
      setDoc(
        doc(db, 'negocios', enrichedAppt.venueId, 'citas', enrichedAppt.id),
        enrichedAppt
      ).catch(() => {});
    }

    // Persist to Cloud SQL / Offline Queue
    dispatchSyncAction(
      '/api/appointments',
      'POST',
      enrichedAppt,
      `Cita ${enrichedAppt.code} (${enrichedAppt.client})`
    );
    return true;
  };

  const handleCancelAppointment = (id: string) => {
    const found = appointments.find((a) => a.id === id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelada' } : a))
    );
    showToast('La cita ha sido cancelada y el horario quedó libre.');

    if (activeBusiness) {
      updateDoc(doc(db, 'negocios', activeBusiness.id, 'citas', id), {
        status: 'Cancelada',
      }).catch(() => {});
      logActivity({
        accion: 'Cita cancelada',
        detalle: `Cita ${found?.code || id} de ${found?.client || 'cliente'} cancelada.`,
        categoria: 'citas',
      });
    }
  };

  // Business Management Handlers (Persisted to Firestore & Cloud SQL)
  const handleSaveService = (svc: ServiceItem, isNew: boolean) => {
    const previous = services.find((s) => s.id === svc.id);
    if (isNew) {
      setServices((prev) => [svc, ...prev]);
      showToast(`Servicio "${svc.name}" (${formatCOP(svc.price)}) creado.`);
    } else {
      setServices((prev) => prev.map((s) => (s.id === svc.id ? svc : s)));
      showToast(
        `Servicio "${svc.name}" actualizado (${formatCOP(svc.price)}).`
      );
    }

    if (activeBusiness && userRole !== 'trabajador') {
      setDoc(
        doc(db, 'negocios', activeBusiness.id, 'servicios', svc.id),
        svc
      ).catch(() => {});

      const priceChanged = previous && previous.price !== svc.price;
      logActivity({
        accion: isNew
          ? 'Servicio creado'
          : priceChanged
            ? 'Cambio de precio de servicio'
            : 'Servicio actualizado',
        detalle: priceChanged
          ? `"${svc.name}" cambió de ${formatCOP(previous.price)} a ${formatCOP(svc.price)}.`
          : `"${svc.name}" (${formatCOP(svc.price)}).`,
        categoria: 'servicios',
      });
    }

    dispatchSyncAction(
      '/api/services',
      'POST',
      svc,
      `Servicio "${svc.name}"`
    );
  };

  const handleToggleServiceActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = !s.isActive;
        const updated = { ...s, isActive: next };
        showToast(
          `Servicio "${s.name}" ${next ? 'activado' : 'pausado'} para clientes.`
        );

        if (activeBusiness && userRole !== 'trabajador') {
          setDoc(
            doc(db, 'negocios', activeBusiness.id, 'servicios', updated.id),
            updated,
            { merge: true }
          ).catch(() => {});
          logActivity({
            accion: next ? 'Servicio activado' : 'Servicio pausado',
            detalle: `Servicio "${s.name}" marcado como ${next ? 'activo' : 'pausado'}.`,
            categoria: 'servicios',
          });
        }

        dispatchSyncAction(
          '/api/services',
          'POST',
          updated,
          `Estado servicio "${s.name}"`
        );

        return updated;
      })
    );
  };

  const handleDeleteService = (id: string) => {
    const found = services.find((s) => s.id === id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    if (found) showToast(`Servicio "${found.name}" eliminado.`);

    if (activeBusiness && userRole !== 'trabajador') {
      deleteDoc(doc(db, 'negocios', activeBusiness.id, 'servicios', id)).catch(
        () => {}
      );
      logActivity({
        accion: 'Servicio eliminado',
        detalle: `Se eliminó el servicio "${found?.name || id}".`,
        categoria: 'servicios',
      });
    }

    dispatchSyncAction(
      `/api/services/${id}`,
      'DELETE',
      undefined,
      `Eliminar servicio "${found?.name || id}"`
    );
  };

  const handleSaveProfessional = (pro: Professional, isNew: boolean) => {
    if (isNew) {
      setProfessionals((prev) => [pro, ...prev]);
      showToast(`${pro.name} agregado al equipo.`);
    } else {
      setProfessionals((prev) => prev.map((p) => (p.id === pro.id ? pro : p)));
      showToast(`Perfil de ${pro.name} actualizado.`);
    }

    if (activeBusiness && userRole !== 'trabajador') {
      setDoc(
        doc(db, 'negocios', activeBusiness.id, 'profesionales', pro.id),
        pro
      ).catch(() => {});
      logActivity({
        accion: isNew ? 'Especialista agregado' : 'Especialista actualizado',
        detalle: `${pro.name} (${pro.role})`,
        categoria: 'equipo',
      });
    }

    dispatchSyncAction(
      '/api/professionals',
      'POST',
      pro,
      `Profesional "${pro.name}"`
    );
  };

  const handleDeleteProfessional = (id: string) => {
    const found = professionals.find((p) => p.id === id);
    setProfessionals((prev) => prev.filter((p) => p.id !== id));
    if (found) showToast(`${found.name} eliminado del equipo.`);

    if (activeBusiness && userRole !== 'trabajador') {
      deleteDoc(
        doc(db, 'negocios', activeBusiness.id, 'profesionales', id)
      ).catch(() => {});
      logActivity({
        accion: 'Especialista eliminado',
        detalle: `Se eliminó a ${found?.name || id} del equipo.`,
        categoria: 'equipo',
      });
    }

    dispatchSyncAction(
      `/api/professionals/${id}`,
      'DELETE',
      undefined,
      `Eliminar profesional "${found?.name || id}"`
    );
  };

  const handleToggleWorkingDay = (day: DayName) => {
    setWorkingDays((prev) => {
      const nextOpen = !prev[day].isOpen;
      const updated = {
        ...prev,
        [day]: { ...prev[day], isOpen: nextOpen },
      };
      showToast(
        `${day}: marcado como ${nextOpen ? 'Abierto' : 'Cerrado para clientes'}.`
      );
      if (activeBusiness && userRole !== 'trabajador') {
        setDoc(
          doc(db, 'negocios', activeBusiness.id, 'horarios', 'config'),
          { workingDays: updated },
          { merge: true }
        ).catch(() => {});
        logActivity({
          accion: 'Horario laboral actualizado',
          detalle: `${day} marcado como ${nextOpen ? 'Abierto' : 'Cerrado'}.`,
          categoria: 'configuracion',
        });
      }
      return updated;
    });
  };

  const handleUpdateWorkingHours = (
    day: DayName,
    openTime: string,
    closeTime: string
  ) => {
    setWorkingDays((prev) => {
      const updated = {
        ...prev,
        [day]: { ...prev[day], openTime, closeTime },
      };
      if (activeBusiness && userRole !== 'trabajador') {
        setDoc(
          doc(db, 'negocios', activeBusiness.id, 'horarios', 'config'),
          { workingDays: updated },
          { merge: true }
        ).catch(() => {});
        logActivity({
          accion: 'Horas de atención actualizadas',
          detalle: `${day}: ${openTime} – ${closeTime}.`,
          categoria: 'configuracion',
        });
      }
      return updated;
    });
    showToast(`Horario de ${day} actualizado (${openTime} – ${closeTime}).`);
  };

  const handleAddBlockedSlot = (block: BlockedSlot) => {
    setBlockedSlots((prev) => [block, ...prev]);
    showToast(
      `Bloqueo aplicado: ${block.day} de ${block.startTime} a ${block.endTime}.`
    );

    if (activeBusiness && userRole !== 'trabajador') {
      setDoc(
        doc(db, 'negocios', activeBusiness.id, 'bloqueos', block.id),
        block
      ).catch(() => {});
      logActivity({
        accion: 'Bloqueo de horario creado',
        detalle: `${block.day} ${block.startTime}-${block.endTime} (${block.proName}): ${block.reason}`,
        categoria: 'configuracion',
      });
    }

    dispatchSyncAction(
      '/api/blocked-slots',
      'POST',
      block,
      `Bloqueo horario ${block.day}`
    );
  };

  const handleRemoveBlockedSlot = (id: string) => {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
    showToast('Bloqueo eliminado. Horarios disponibles nuevamente.');

    if (activeBusiness && userRole !== 'trabajador') {
      deleteDoc(doc(db, 'negocios', activeBusiness.id, 'bloqueos', id)).catch(
        () => {}
      );
      logActivity({
        accion: 'Bloqueo de horario eliminado',
        detalle: `Se eliminó el bloqueo ${id}.`,
        categoria: 'configuracion',
      });
    }

    dispatchSyncAction(
      `/api/blocked-slots/${id}`,
      'DELETE',
      undefined,
      `Eliminar bloqueo ${id}`
    );
  };

  const handleSaveWhatsAppConfig = async (cfg: WhatsAppConfig) => {
    if (userRole && userRole !== 'propietario') {
      showToast('Solo el propietario puede guardar la configuración de WhatsApp.');
      return;
    }
    setWhatsAppConfig(cfg);

    if (user && (activeBusiness?.id || venues.length > 0)) {
      try {
        const businessId = activeBusiness?.id || venues[0].id;
        const docRef = doc(db, 'negocios', businessId);
        await setDoc(docRef, { whatsAppConfig: cfg }, { merge: true });
        if (activeBusiness) {
          refreshActiveBusinessDoc({ whatsAppConfig: cfg });
          await logActivity({
            accion: 'Configuración WhatsApp actualizada',
            detalle: `Número oficial: ${cfg.businessPhone}`,
            categoria: 'configuracion',
          });
        }
        showToast('Guardado en la nube.');
      } catch (err) {
        console.error('Error saving config:', err);
        showToast('Error al guardar en la nube.');
      }
    } else {
      showToast('Configuración guardada localmente.');
    }
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    status: Appointment['status']
  ) => {
    const targetAppt = appointments.find((a) => a.id === id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast(`Estado de cita actualizado a ${status}.`);

    if (activeBusiness) {
      updateDoc(doc(db, 'negocios', activeBusiness.id, 'citas', id), {
        status,
      }).catch(() => {});
      logActivity({
        accion: `Cita marcada como ${status}`,
        detalle: `Cita ${targetAppt?.code || id} de ${targetAppt?.client || 'cliente'} pasó a ${status}.`,
        categoria: 'citas',
      });
    }
  };

  const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );

    const appt = appointments.find((a) => a.id === id);
    if (activeBusiness) {
      updateDoc(
        doc(db, 'negocios', activeBusiness.id, 'citas', id),
        updates
      ).catch(() => {});
    }
    if (appt) {
      dispatchSyncAction(
        '/api/appointments',
        'POST',
        { ...appt, ...updates },
        `Actualizar cita ${appt.code}`
      );
    }
  };

  const handleSelectPlan = async (planId: SaasPlanId) => {
    if (userRole && userRole !== 'propietario') {
      showToast('Solo el propietario puede cambiar el plan.');
      return;
    }

    const normalizedId = normalizePlanId(planId);
    const planConfig = getSaasPlanConfig(normalizedId);

    if (!activeBusiness) {
      showToast('No se encontró un negocio activo para actualizar el plan en Firestore.');
      return;
    }

    const planPayload = {
      plan: normalizedId,
      limiteUsuarios: planConfig.userLimit,
      limiteReservas: planConfig.reservationLimit,
      planUpdatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'negocios', activeBusiness.id), planPayload);
      setActivePlan(normalizedId);
      refreshActiveBusinessDoc(planPayload);
      await logActivity({
        accion: 'Cambio de plan SaaS',
        detalle: `Plan actualizado a ${planConfig.name} (${planConfig.userLimit} usuario(s), ${
          planConfig.reservationLimit === null
            ? 'reservas ilimitadas'
            : `hasta ${planConfig.reservationLimit} reservas`
        }).`,
        categoria: 'plan',
      });
      showToast(`Suscripción actualizada al ${planConfig.name}.`);
    } catch (err: any) {
      console.error('Error guardando plan en Firestore:', err);
      showToast(
        err?.code === 'permission-denied'
          ? 'No tienes permisos en Firestore para cambiar el plan de este negocio.'
          : 'No se pudo actualizar el plan en Firestore. Intenta de nuevo.'
      );
      throw err;
    }
  };

  const handleUpdateVenue = (updatedVenue: Venue) => {
    setVenues((prev) => {
      const exists = prev.some((v) => v.id === updatedVenue.id);
      if (exists) {
        return prev.map((v) => (v.id === updatedVenue.id ? updatedVenue : v));
      } else {
        return [updatedVenue, ...prev];
      }
    });
    showToast(`Negocio "${updatedVenue.name}" guardado correctamente.`);

    if (activeBusiness && userRole === 'propietario' && updatedVenue.id === activeBusiness.id) {
      setDoc(
        doc(db, 'negocios', activeBusiness.id),
        {
          name: updatedVenue.name,
          phone: updatedVenue.phone || '',
          address: updatedVenue.address || '',
          location: updatedVenue.location || '',
          description: updatedVenue.description || '',
          image: updatedVenue.image || '',
          logo: updatedVenue.logo || '',
          photos: updatedVenue.photos || [],
        },
        { merge: true }
      ).catch(() => {});
      logActivity({
        accion: 'Información del local actualizada',
        detalle: `Se actualizó el perfil de "${updatedVenue.name}".`,
        categoria: 'configuracion',
      });
    }

    dispatchSyncAction(
      '/api/venues',
      'POST',
      updatedVenue,
      `Negocio "${updatedVenue.name}"`
    );
  };

  const clientNavItems: Array<{
    id: ClientSubView;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'explore',
      label: 'Explorar',
      icon: <Compass className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'my-booking',
      label: 'Reservas',
      icon: <Calendar className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: <HelpCircle className="w-5 h-5 shrink-0" />, 
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User className="w-5 h-5 shrink-0" />,
    },
  ];

  const businessNavItems: Array<{
    id: BusinessSubView;
    label: string;
    icon: React.ReactNode;
    counter?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Resumen y KPIs',
      icon: <PieChart className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'calendar',
      label: 'Agenda General',
      icon: <Calendar className="w-4 h-4 shrink-0" />,
      counter: appointments.filter((a) => a.status !== 'Cancelada').length,
    },
    {
      id: 'services',
      label: 'Servicios y Precios',
      icon: <ListChecks className="w-4 h-4 shrink-0" />,
      counter: services.length,
    },
    {
      id: 'schedule',
      label: 'Horarios y Bloqueos',
      icon: <Clock className="w-4 h-4 shrink-0" />,
      counter: blockedSlots.length,
    },
    {
      id: 'professionals',
      label: 'Equipo y Especialistas',
      icon: <Users className="w-4 h-4 shrink-0" />,
      counter: professionals.length,
    },
    {
      id: 'venue',
      label: 'Mi Local y Fotos',
      icon: <Store className="w-4 h-4 shrink-0 text-champagne-400" />,
      counter: (venues[0]?.photos && venues[0].photos.length) || 1,
    },
    {
      id: 'whatsapp',
      label: 'Integración WhatsApp',
      icon: <MessageCircle className="w-4 h-4 shrink-0 text-emerald-500" />,
    },
    {
      id: 'pricing',
      label: 'Planes SaaS',
      icon: <Crown className="w-4 h-4 shrink-0 text-champagne-500" />,
    },
    {
      id: 'notifications',
      label: 'Recordatorios WA / SMS',
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'qr-code',
      label: 'Código QR de Reserva',
      icon: <QrCode className="w-4 h-4 shrink-0 text-indigo-400" />,
    },
    {
      id: 'access-team',
      label: 'Equipo de acceso',
      icon: <ShieldCheck className="w-4 h-4 shrink-0 text-champagne-500" />,
      counter: teamMembers.length,
    },
    {
      id: 'activity',
      label: 'Actividad',
      icon: <Activity className="w-4 h-4 shrink-0 text-emerald-400" />,
      counter: activityLogs.length,
    },
  ];

  const visibleBusinessNavItems = businessNavItems.filter((item) =>
    canAccessView(userRole || 'propietario', item.id)
  );

  return (
    <div className="min-h-screen flex bg-sand-50 dark:bg-obsidian-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ======================================================== */}
      {/* COLLAPSIBLE DARK SIDEBAR                                 */}
      {/* ======================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-obsidian-900 border-r border-sand-200 dark:border-obsidian-800 flex flex-col justify-between transition-all duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Brand Logo Header (Space for logo.png + Collapse button) */}
          <div className="flex items-center justify-between gap-2 pb-2">
            <button type="button" onClick={goToHome} className="flex items-center gap-3 min-w-0" aria-label="Ir al inicio">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-obsidian-950 border border-champagne-500/40 flex items-center justify-center animate-glow">
                <ResilientImage
                  src="./logo.png"
                  fallbackSrc={BRAND_LOGO_FALLBACK}
                  alt="Launcit Logo"
                  fallbackLabel="L"
                  className="w-full h-full object-cover"
                />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block truncate">
                    Launcit
                  </span>
                  <span className="text-[10px] text-champagne-600 dark:text-champagne-400 font-semibold block truncate">
                    Tu tiempo, tu reserva, tu lugar
                  </span>
                </div>
              )}
            </button>


            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={
                sidebarCollapsed
                  ? 'Expandir barra lateral'
                  : 'Colapsar barra lateral'
              }
              className="hidden md:flex w-8 h-8 rounded-lg border border-sand-200 dark:border-obsidian-750 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-champagne-500 transition-colors shrink-0"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
              className="md:hidden w-8 h-8 rounded-lg border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-500 dark:text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role-Specific Navigation */}
          {role === 'client' ? (
            <div className="space-y-6">
              <nav aria-label="Navegación Cliente" className="space-y-1.5">
                {!sidebarCollapsed && (
                  <p className="px-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    Navegación Libre
                  </p>
                )}

                {clientNavItems.map((item) => {
                  const isActive = clientView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setClientView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                        sidebarCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-obsidian-800 dark:text-champagne-400 border border-transparent dark:border-obsidian-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-sand-100 dark:hover:bg-obsidian-850'
                      }`}
                    >
                      {item.icon}
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Partner Access Box in Sidebar */}
              {!sidebarCollapsed ? (
                <div className="p-4 rounded-2xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Briefcase className="w-4 h-4 text-champagne-500 shrink-0" />
                    <span>¿Eres propietario?</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Accede al panel SaaS para editar servicios, precios COP, equipo y bloqueos de horario.
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestBusinessAccess}
                    className="w-full py-2.5 px-3 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Panel de Negocio</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestBusinessAccess}
                  title="Panel de Negocio / Soy Propietario"
                  className="w-full p-2.5 rounded-xl bg-champagne-500 text-slate-950 flex items-center justify-center"
                >
                  <Store className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <nav aria-label="Navegación Negocio" className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-2.5 pb-1 text-[11px] font-bold text-champagne-600 dark:text-champagne-400">
                    Administración SaaS
                  </p>
                )}

                {visibleBusinessNavItems.map((item) => {
                  const isActive = businessView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBusinessView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                        sidebarCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-obsidian-800 dark:text-champagne-400 border border-transparent dark:border-obsidian-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-sand-100 dark:hover:bg-obsidian-850'
                      }`}
                    >
                      {item.icon}
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left truncate">
                            {item.label}
                          </span>
                          {typeof item.counter === 'number' && (
                            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                              {item.counter}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sand-200 dark:border-obsidian-800">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-champagne-500/15 text-champagne-600 dark:text-champagne-400 flex items-center justify-center shrink-0 font-bold text-xs">
              {user ? (
                (activeMember?.nombre || user.displayName || user.email || 'U')
                  .charAt(0)
                  .toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                {user ? (
                  <>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {activeMember?.nombre || user.displayName || user.email}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                      {activeBusiness?.name || activeMember?.negocioNombre || 'Sin negocio'}
                    </p>
                    <p className="text-[10px] text-champagne-600 dark:text-champagne-400 font-bold truncate">
                      {userRole ? ROLE_LABELS[userRole] : 'Cuenta sin negocio'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Cliente Invitado</p>
                    <button onClick={() => navigateTo('login')} className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate hover:underline">Iniciar sesión</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ======================================================== */}
      {/* MAIN CONTENT SHELL                                       */}
      {/* ======================================================== */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Top Bar (Compact on mobile) */}
        <header className="sticky top-0 z-20 h-14 sm:h-16 bg-white/95 dark:bg-obsidian-900/95 backdrop-blur-md border-b border-sand-200 dark:border-obsidian-800 px-3 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden shrink-0 bg-obsidian-950 border border-champagne-500/40 md:hidden flex items-center justify-center">
              <ResilientImage
                src="./logo.png"
                fallbackSrc={BRAND_LOGO_FALLBACK}
                alt="Launcit Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {role === 'client'
                ? 'Launcit — Reserva Directa'
                : 'Launcit — Panel Socio'}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Offline Mode & Sync Queue Status Badge */}
            {!isOnline ? (
              <div
                title="Modo sin conexión: los cambios de tu negocio se guardan localmente y se sincronizarán al volver a conectar."
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold"
              >
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Offline</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[9px] font-mono font-black tabular-nums">
                    {pendingSyncCount} pend.
                  </span>
                )}
              </div>
            ) : pendingSyncCount > 0 ? (
              <button
                type="button"
                onClick={() => triggerSync(true)}
                title="Hay cambios locales pendientes. Haz clic para sincronizarlos con el servidor."
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-champagne-500/15 border border-champagne-500/30 text-champagne-700 dark:text-champagne-400 text-[10px] font-bold hover:bg-champagne-500/25 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isSyncing ? 'Sincronizando...' : `${pendingSyncCount} por sincronizar`}
                </span>
                <span className="sm:hidden font-mono text-[9px] font-black">
                  {pendingSyncCount}
                </span>
              </button>
            ) : null}

            {role === 'client' && (
              <button
                type="button"
                onClick={handleRequestBusinessAccess}
                className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-champagne-500/50 bg-champagne-500/10 hover:bg-champagne-500 hover:text-slate-950 text-champagne-600 dark:text-champagne-400 text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
              >
                <Store className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden xs:inline">Propietario</span>
              </button>
            )}
            
            {user ? (
              <ProfileDropdown onGoToPanel={handleRequestBusinessAccess} onLogout={handleLogoutBusiness} />
            ) : (
              <button onClick={() => navigateTo('login')} className="text-xs font-bold text-slate-600 dark:text-slate-400">Acceder</button>
            )}

            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label={
                isDarkMode ? 'Modo claro' : 'Modo oscuro'
              }
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-600 dark:text-champagne-400 hover:bg-sand-100 dark:hover:bg-obsidian-850 transition-colors shrink-0"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {role === 'client' && (
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(212, 175, 55, 0.6)"
                }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleOpenBooking()}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-[10px] sm:text-xs transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 relative overflow-hidden"
              >
                <CalendarPlus className="w-3 sm:w-3.5 h-3 sm:h-3.5 relative z-10" />
                <span className="relative z-10">Reservar</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
              </motion.button>
            )}
          </div>
        </header>

        {/* Main Workspace Viewport (Compact padding) */}
        <main className="flex-1 p-3 sm:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20 text-xs font-semibold text-slate-500">
              Cargando...
            </div>
          ) : user && needsBusinessSelection && view !== 'inicio' ? (
            <BusinessSelectorScreen
              onSelect={async (negocioId) => {
                await selectBusiness(negocioId);
                setView('panel');
                setRole('business');
              }}
              onLogout={handleLogoutBusiness}
            />
          ) : user && mustChangePassword && view !== 'inicio' ? (
            <MustChangePasswordScreen
              onSuccess={() => {
                setView('panel');
                setRole('business');
                showToast('Contraseña actualizada. Bienvenido al panel.');
              }}
              onLogout={handleLogoutBusiness}
            />
          ) : (
            <AnimatePresence mode="wait">
              {view === 'inicio' && (
                <motion.div key="inicio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ClientWorld
                    activeView={clientView}
                    venues={venues}
                    services={services}
                    appointments={appointments}
                    reviews={reviews}
                    lookupPhone={lookupPhone}
                    whatsAppConfig={whatsAppConfig}
                    onLookupPhoneChange={setLookupPhone}
                    onOpenBooking={(v) => handleOpenBooking(v)}
                    onCancelAppointment={handleCancelAppointment}
                    onAddReview={handleAddReview}
                    onShowToast={showToast}
                  />
                </motion.div>
              )}
              {view === 'panel' && user && activeBusiness && activeMember && (
                <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <BusinessPanel
                    activeView={businessView}
                    partnerEmail={user.email || 'socio@launcit.com'}
                    venues={venues}
                    onUpdateVenue={handleUpdateVenue}
                    services={services}
                    professionals={professionals}
                    workingDays={workingDays}
                    blockedSlots={blockedSlots}
                    appointments={appointments}
                    reviews={reviews}
                    activePlan={activePlan}
                    whatsAppConfig={whatsAppConfig}
                    onSaveWhatsAppConfig={handleSaveWhatsAppConfig}
                    smsConfig={smsConfig}
                    onSaveSmsConfig={handleSaveSmsConfig}
                    onChangeView={setBusinessView}
                    onSaveService={handleSaveService}
                    onToggleServiceActive={handleToggleServiceActive}
                    onDeleteService={handleDeleteService}
                    onSaveProfessional={handleSaveProfessional}
                    onDeleteProfessional={handleDeleteProfessional}
                    onToggleWorkingDay={handleToggleWorkingDay}
                    onUpdateWorkingHours={handleUpdateWorkingHours}
                    onAddBlockedSlot={handleAddBlockedSlot}
                    onRemoveBlockedSlot={handleRemoveBlockedSlot}
                    onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                    onUpdateAppointment={handleUpdateAppointment}
                    onSelectPlan={handleSelectPlan}
                    onTestQrSplash={(v) => setQrSplashVenue(v)}
                    onShowToast={showToast}
                    userRole={userRole}
                    currentUserUid={user.uid}
                    activeMember={activeMember}
                    teamMembers={teamMembers}
                    teamLoading={teamLoading}
                    activityLogs={activityLogs}
                    activityLoading={activityLoading}
                    onCreateTeamMember={handleCreateTeamMember}
                    onToggleMemberActive={handleToggleMemberActive}
                    onChangeMemberRole={handleChangeMemberRole}
                    onResetMemberPassword={handleResetMemberPassword}
                    onRefreshActivity={() =>
                      activeBusiness && fetchActivityLogs(activeBusiness.id)
                    }
                  />
                </motion.div>
              )}
              {view === 'login' && (
                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AuthScreen
                    onAuthenticated={() => {
                      // AuthContext effect transitions automatically based on Firestore memberships
                    }}
                    onBackToHome={() => {
                      setView('inicio');
                      setRole('client');
                    }}
                  />
                </motion.div>
              )}
              {view === 'completar-negocio' && user && (
                <motion.div key="completar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CompleteBusinessScreen
                    onBusinessCreated={async (_negId, name) => {
                      await refreshSessionData();
                      setView('panel');
                      setRole('business');
                      setBusinessView('dashboard');
                      showToast(`¡Negocio "${name}" creado con éxito!`);
                    }}
                    onLogout={handleLogoutBusiness}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      <SmartQRSplashModal
        venue={qrSplashVenue}
        isOpen={!!qrSplashVenue}
        onEnterVenue={(v) => {
          setBookingInitialVenue(v);
          setIsBookingModalOpen(true);
          setQrSplashVenue(null);
          // Increment profile visit stat
          try {
            const statsKey = `launci_qr_stats_${v.id}`;
            const current = JSON.parse(localStorage.getItem(statsKey) || '{"scans": 0, "uniqueVisits": 0, "profileVisits": 0, "bookingClicks": 0, "completedBookings": 0}');
            current.profileVisits += 1;
            localStorage.setItem(statsKey, JSON.stringify(current));
          } catch (e) {}
        }}
        onClose={() => setQrSplashVenue(null)}
      />

      {/* ======================================================== */}
      {/* 4-STEP ZERO-REGISTRATION CLIENT BOOKING MODAL            */}
      {/* ======================================================== */}
      <BookingWizardModal
        isOpen={isBookingModalOpen}
        initialVenue={bookingInitialVenue}
        venues={venues}
        services={services}
        professionals={professionals}
        workingDays={workingDays}
        blockedSlots={blockedSlots}
        appointments={appointments}
        whatsAppConfig={whatsAppConfig}
        onClose={() => setIsBookingModalOpen(false)}
        onConfirmBooking={handleConfirmBooking}
        onGoToMyBookings={(phone) => {
          setLookupPhone(phone);
          setRole('client');
          setClientView('my-booking');
        }}
        onShowToast={showToast}
      />

      {/* ======================================================== */}
      {/* PROTECTED PARTNER ACCESS MODAL                           */}
      {/* ======================================================== */}


      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION (Client Only)                   */}
      {/* ======================================================== */}
      {role === 'client' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-obsidian-900/95 backdrop-blur-md border-t border-sand-200 dark:border-obsidian-800 px-2 py-2 flex items-center justify-around">
          {clientNavItems.map((item) => {
            const isActive = clientView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setClientView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-slate-900 dark:text-champagne-400 font-bold'
                    : 'text-slate-500 dark:text-slate-500 font-medium'
                }`}
              >
                {item.icon}
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ======================================================== */}
      {/* TOAST FEEDBACK                                           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-20 md:bottom-5 right-5 z-50 bg-obsidian-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-obsidian-700 flex items-center gap-2.5 text-xs font-semibold max-w-sm"
          >
            <CalendarCheck className="w-4 h-4 text-champagne-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
