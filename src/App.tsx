import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
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
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  PieChart,
  SearchCheck,
  Store,
  Sun,
  User,
  Users,
  X,
  QrCode,
} from 'lucide-react';
import {
  Appointment,
  AppRole,
  BlockedSlot,
  BusinessSubView,
  ClientSubView,
  DayName,
  Professional,
  Review,
  SaasPlanId,
  ServiceItem,
  SmsConfig,
  Venue,
  WhatsAppConfig,
  WorkingDayConfig,
} from './types';
import {
  BRAND_LOGO_FALLBACK,
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
import { ResilientImage } from './components/ResilientImage';
import { ClientWorld } from './components/ClientWorld';
import { BusinessPanel } from './components/BusinessPanel';
import { BookingWizardModal } from './components/BookingWizardModal';
import { BusinessAuthModal } from './components/BusinessAuthModal';
import { SmartQRSplashModal } from './components/SmartQRSplashModal';

export default function App() {
  // Two independent roles: 'client' (default, zero-registration) | 'business' (protected partner admin)
  const [role, setRole] = useState<AppRole>('client');
  const [isBusinessAuthenticated, setIsBusinessAuthenticated] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('admin@launcit.com');

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

  // Modals State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingInitialVenue, setBookingInitialVenue] = useState<Venue | null>(
    null
  );
  const [isBusinessAuthOpen, setIsBusinessAuthOpen] = useState(false);

  // Shared Synchronized Platform State
  const [venues, setVenues] = useState<Venue[]>(INITIAL_VENUES);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [professionals, setProfessionals] = useState<Professional[]>(
    INITIAL_PROFESSIONALS
  );
  const [workingDays, setWorkingDays] =
    useState<Record<DayName, WorkingDayConfig>>(INITIAL_WORKING_DAYS);
  const [blockedSlots, setBlockedSlots] =
    useState<BlockedSlot[]>(INITIAL_BLOCKED_SLOTS);
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activePlan, setActivePlan] = useState<SaasPlanId>('pro');
  const [whatsAppConfig, setWhatsAppConfig] =
    useState<WhatsAppConfig>(DEFAULT_WHATSAPP_CONFIG);
  const [smsConfig, setSmsConfig] = useState<SmsConfig>(DEFAULT_SMS_CONFIG);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  const [authToken, setAuthToken] = useState<string | null>(null);

  // Client Lookup Phone
  const [lookupPhone, setLookupPhone] = useState('+57 312 456 7890');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

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
      try {
        const [resServices, resPros, resAppts, resBlocks, resWa, resVenues] = await Promise.allSettled([
          fetch('/api/services').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/professionals').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/appointments').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/blocked-slots').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/whatsapp-config').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/venues').then((r) => (r.ok ? r.json() : null)),
        ]);

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

  // Role Transition Handlers
  const handleRequestBusinessAccess = () => {
    setMobileMenuOpen(false);
    if (isBusinessAuthenticated) {
      setRole('business');
    } else {
      setIsBusinessAuthOpen(true);
    }
  };

  const handleBusinessAuthenticated = (email: string, idToken?: string) => {
    setPartnerEmail(email);
    if (idToken) setAuthToken(idToken);
    setIsBusinessAuthenticated(true);
    setIsBusinessAuthOpen(false);
    setRole('business');
    setBusinessView('dashboard');
    showToast('Sesión de Socio iniciada en el Panel de Negocio.');
  };

  const handleExitBusinessToClient = () => {
    setMobileMenuOpen(false);
    setRole('client');
    setClientView('explore');
    showToast('Regresaste a la Vista de Cliente (navegación libre).');
  };

  const handleLogoutBusiness = () => {
    setIsBusinessAuthenticated(false);
    setAuthToken(null);
    setMobileMenuOpen(false);
    setRole('client');
    setClientView('explore');
    showToast('Sesión de socio cerrada.');
  };

  // Client Booking Handlers (Persisted to Cloud SQL without registration)
  const handleOpenBooking = (venue?: Venue) => {
    setBookingInitialVenue(venue || venues[0]);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = (newAppt: Appointment) => {
    setAppointments((prev) => [newAppt, ...prev]);
    setLookupPhone(newAppt.phone);
    showToast(
      `Cita ${newAppt.code} confirmada para ${newAppt.client}. Comprobante listo para WhatsApp.`
    );

    // Persist to Cloud SQL
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAppt),
    }).catch((err) => console.warn('Appointment persist notice:', err));
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Cancelada' } : a))
    );
    showToast('La cita ha sido cancelada y el horario quedó libre.');
  };

  // Business Management Handlers (Persisted to Cloud SQL)
  const handleSaveService = (svc: ServiceItem, isNew: boolean) => {
    if (isNew) {
      setServices((prev) => [svc, ...prev]);
      showToast(`Servicio "${svc.name}" (${formatCOP(svc.price)}) creado.`);
    } else {
      setServices((prev) => prev.map((s) => (s.id === svc.id ? svc : s)));
      showToast(
        `Servicio "${svc.name}" actualizado (${formatCOP(svc.price)}).`
      );
    }

    fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(svc),
    }).catch((err) => console.warn('Service persist notice:', err));
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

        fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(updated),
        }).catch((err) => console.warn('Toggle service persist notice:', err));

        return updated;
      })
    );
  };

  const handleDeleteService = (id: string) => {
    const found = services.find((s) => s.id === id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    if (found) showToast(`Servicio "${found.name}" eliminado.`);

    fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    }).catch((err) => console.warn('Delete service notice:', err));
  };

  const handleSaveProfessional = (pro: Professional, isNew: boolean) => {
    if (isNew) {
      setProfessionals((prev) => [pro, ...prev]);
      showToast(`${pro.name} agregado al equipo.`);
    } else {
      setProfessionals((prev) => prev.map((p) => (p.id === pro.id ? pro : p)));
      showToast(`Perfil de ${pro.name} actualizado.`);
    }

    fetch('/api/professionals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(pro),
    }).catch((err) => console.warn('Professional persist notice:', err));
  };

  const handleDeleteProfessional = (id: string) => {
    const found = professionals.find((p) => p.id === id);
    setProfessionals((prev) => prev.filter((p) => p.id !== id));
    if (found) showToast(`${found.name} eliminado del equipo.`);

    fetch(`/api/professionals/${id}`, {
      method: 'DELETE',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    }).catch((err) => console.warn('Delete professional notice:', err));
  };

  const handleToggleWorkingDay = (day: DayName) => {
    setWorkingDays((prev) => {
      const nextOpen = !prev[day].isOpen;
      showToast(
        `${day}: marcado como ${nextOpen ? 'Abierto' : 'Cerrado para clientes'}.`
      );
      return {
        ...prev,
        [day]: { ...prev[day], isOpen: nextOpen },
      };
    });
  };

  const handleUpdateWorkingHours = (
    day: DayName,
    openTime: string,
    closeTime: string
  ) => {
    setWorkingDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], openTime, closeTime },
    }));
    showToast(`Horario de ${day} actualizado (${openTime} – ${closeTime}).`);
  };

  const handleAddBlockedSlot = (block: BlockedSlot) => {
    setBlockedSlots((prev) => [block, ...prev]);
    showToast(
      `Bloqueo aplicado: ${block.day} de ${block.startTime} a ${block.endTime}.`
    );

    fetch('/api/blocked-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(block),
    }).catch((err) => console.warn('Blocked slot persist notice:', err));
  };

  const handleRemoveBlockedSlot = (id: string) => {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
    showToast('Bloqueo eliminado. Horarios disponibles nuevamente.');

    fetch(`/api/blocked-slots/${id}`, {
      method: 'DELETE',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    }).catch((err) => console.warn('Delete blocked slot notice:', err));
  };

  const handleSaveWhatsAppConfig = (cfg: WhatsAppConfig) => {
    setWhatsAppConfig(cfg);
    showToast('Configuración y plantilla de WhatsApp guardadas.');

    fetch('/api/whatsapp-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(cfg),
    }).catch((err) => console.warn('WhatsApp config persist notice:', err));
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    status: Appointment['status']
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast(`Estado de cita actualizado a ${status}.`);
  };

  const handleSelectPlan = (planId: SaasPlanId) => {
    setActivePlan(planId);
    showToast(`Suscripción actualizada al Plan ${planId.toUpperCase()}.`);
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

    fetch('/api/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVenue),
    }).catch((err) => console.warn('Venue persist notice:', err));
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
  ];

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
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-obsidian-950 border border-champagne-500/40 flex items-center justify-center animate-glow">
                <ResilientImage
                  src="/logo.png"
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
            </div>

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

                {businessNavItems.map((item) => {
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
          {role === 'client' ? (
            <div
              className={`flex items-center gap-2.5 p-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-champagne-500/15 text-champagne-600 dark:text-champagne-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Cliente Invitado
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    Sin registro requerido
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`flex items-center justify-between gap-2 p-2 rounded-xl bg-champagne-500/10 border border-champagne-500/20 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-champagne-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Glow Flagship
                    </p>
                    <p className="text-[11px] text-champagne-600 dark:text-champagne-400 font-semibold uppercase truncate">
                      Plan {activePlan}
                    </p>
                  </div>
                )}
              </div>

              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={handleLogoutBusiness}
                  title="Cerrar sesión de negocio"
                  aria-label="Cerrar sesión de negocio"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
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
                src="/logo.png"
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
            {role === 'client' ? (
              <button
                type="button"
                onClick={handleRequestBusinessAccess}
                className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-champagne-500/50 bg-champagne-500/10 hover:bg-champagne-500 hover:text-slate-950 text-champagne-600 dark:text-champagne-400 text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
              >
                <Store className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden xs:inline">Propietario</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExitBusinessToClient}
                className="px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-sand-300 dark:border-obsidian-700 bg-sand-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-200 hover:border-champagne-500 text-[10px] sm:text-xs font-bold transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden xs:inline">Volver</span>
              </button>
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
          <AnimatePresence mode="wait">
            {role === 'client' ? (
              <motion.div
                key={`client-${clientView}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
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
            ) : (
              <motion.div
                key={`business-${businessView}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              >
                <BusinessPanel
                  activeView={businessView}
                  partnerEmail={partnerEmail}
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
                  onSelectPlan={handleSelectPlan}
                  onTestQrSplash={(v) => setQrSplashVenue(v)}
                  onShowToast={showToast}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
      <BusinessAuthModal
        isOpen={isBusinessAuthOpen}
        onClose={() => setIsBusinessAuthOpen(false)}
        onAuthenticated={handleBusinessAuthenticated}
      />

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
