import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  Link2,
  Lock,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  Unlock,
  Upload,
  UserPlus,
  Wallet,
  X,
  Camera,
  Image as ImageIcon,
  MapPin,
  Phone,
  Eye,
  CheckCheck,
  Star,
  MessageSquare,
  QrCode,
  Download,
  Share2,
  Box,
} from 'lucide-react';
import { QRCodeGenerator } from './QRCodeGenerator';
import {
  Appointment,
  BlockedSlot,
  BusinessSubView,
  DayName,
  Professional,
  Review,
  SaasPlanId,
  ServiceCategory,
  ServiceItem,
  SmsConfig,
  SpecialistStatus,
  Venue,
  WhatsAppConfig,
  WorkingDayConfig,
} from '../types';
import {
  ALL_DAY_HOURS,
  BRAND_LOGO_FALLBACK,
  CATEGORY_LABELS,
  DAYS_ORDER,
  DEFAULT_SMS_CONFIG,
  DEFAULT_WHATSAPP_CONFIG,
  SPECIALIST_AVATAR_FALLBACK,
  SPECIALIST_PHOTO_PRESETS,
  SUBCATEGORY_LABELS,
  TIME_SLOTS,
  VENUE_PHOTO_PRESETS,
} from '../data/initialData';
import { formatCOP, parseTimeToMinutes } from '../utils/scheduleUtils';
import {
  AVAILABLE_VARIABLES,
  compileWhatsAppMessage,
  generateWhatsAppUrl,
  WHATSAPP_PRESETS,
  WhatsAppPreset,
  WhatsAppVariable,
} from '../utils/whatsappUtils';
import {
  getGlobalGlbUrl,
  setGlobalGlbUrl,
  DEFAULT_GLOBAL_GLB,
  FALLBACK_DEMO_GLB,
} from '../config/arConfig';
import { ResilientImage } from './ResilientImage';
import { DailyRevenueTrendChart } from './DailyRevenueTrendChart';

interface BusinessPanelProps {
  activeView: BusinessSubView;
  partnerEmail: string;
  venues?: Venue[];
  onUpdateVenue?: (venue: Venue) => void;
  services: ServiceItem[];
  professionals: Professional[];
  workingDays: Record<DayName, WorkingDayConfig>;
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  reviews?: Review[];
  activePlan: SaasPlanId;
  whatsAppConfig?: WhatsAppConfig;
  onSaveWhatsAppConfig?: (config: WhatsAppConfig) => void;
  smsConfig?: SmsConfig;
  onSaveSmsConfig?: (config: SmsConfig) => void;
  onChangeView: (view: BusinessSubView) => void;
  onSaveService: (service: ServiceItem, isNew: boolean) => void;
  onToggleServiceActive: (id: string) => void;
  onDeleteService: (id: string) => void;
  onSaveProfessional: (pro: Professional, isNew: boolean) => void;
  onDeleteProfessional: (id: string) => void;
  onToggleWorkingDay: (day: DayName) => void;
  onUpdateWorkingHours: (
    day: DayName,
    openTime: string,
    closeTime: string
  ) => void;
  onAddBlockedSlot: (block: BlockedSlot) => void;
  onRemoveBlockedSlot: (id: string) => void;
  onUpdateAppointmentStatus: (
    id: string,
    status: Appointment['status']
  ) => void;
  onSelectPlan: (planId: SaasPlanId) => void;
  onTestQrSplash?: (venue: Venue) => void;
  onShowToast: (msg: string) => void;
}

export const BusinessPanel: React.FC<BusinessPanelProps> = ({
  activeView,
  partnerEmail,
  venues = [],
  onUpdateVenue,
  services,
  professionals,
  workingDays,
  blockedSlots,
  appointments,
  reviews = [],
  activePlan,
  whatsAppConfig,
  onSaveWhatsAppConfig,
  smsConfig,
  onSaveSmsConfig,
  onChangeView,
  onSaveService,
  onToggleServiceActive,
  onDeleteService,
  onSaveProfessional,
  onDeleteProfessional,
  onToggleWorkingDay,
  onUpdateWorkingHours,
  onAddBlockedSlot,
  onRemoveBlockedSlot,
  onUpdateAppointmentStatus,
  onSelectPlan,
  onTestQrSplash,
  onShowToast,
}) => {
  // Services Filter & Modal State
  const [svcSearch, setSvcSearch] = useState('');
  const [svcCatFilter, setSvcCatFilter] = useState<'all' | ServiceCategory>(
    'all'
  );
  const [isSvcModalOpen, setIsSvcModalOpen] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [svcName, setSvcName] = useState('');
  const [svcCategory, setSvcCategory] = useState<ServiceCategory>('belleza');
  const [svcSubCategory, setSvcSubCategory] = useState<string>('Barbería');
  const [svcPrice, setSvcPrice] = useState('45000');
  const [svcDuration, setSvcDuration] = useState('45 min');
  const [svcIsActive, setSvcIsActive] = useState(true);
  const [svcDesc, setSvcDesc] = useState('');
  const [confirmDeleteSvcId, setConfirmDeleteSvcId] = useState<string | null>(
    null
  );
  // Inline Price Editing State
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<string>('');

  // Team / Professionals Form State
  const [isProFormOpen, setIsProFormOpen] = useState(false);
  const [editingProId, setEditingProId] = useState<string | null>(null);
  const [proName, setProName] = useState('');
  const [proRole, setProRole] = useState('');
  const [proExp, setProExp] = useState('4 años exp.');
  const [proStatus, setProStatus] = useState<SpecialistStatus>('Disponible');
  const [proAvatar, setProAvatar] = useState<string>(SPECIALIST_AVATAR_FALLBACK);
  const [proAvatarUrlInput, setProAvatarUrlInput] = useState<string>('');
  const [confirmDeleteProId, setConfirmDeleteProId] = useState<string | null>(
    null
  );

  // Business Local & Venue Gallery State
  const currentVenue = venues && venues.length > 0 ? venues[0] : null;
  const [selectedQrVenueId, setSelectedQrVenueId] = useState<string>(currentVenue?.id || '');
  const activeQrVenue = useMemo(() => 
    venues.find(v => v.id === selectedQrVenueId) || currentVenue, 
    [venues, selectedQrVenueId, currentVenue]
  );

  const [venueCustomPhotoUrl, setVenueCustomPhotoUrl] = useState<string>('');
  const [glbUrlInput, setGlbUrlInput] = useState<string>(() => {
    try {
      return localStorage.getItem(`launci_glb_url_${activeQrVenue?.id || 'default'}`) || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
    } catch (e) {
      return 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
    }
  });

  useEffect(() => {
    if (activeQrVenue) {
      try {
        const saved = localStorage.getItem(`launci_glb_url_${activeQrVenue.id}`) || activeQrVenue.glbUrl;
        setGlbUrlInput(saved || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb');
      } catch (e) {}
    }
  }, [selectedQrVenueId, activeQrVenue]);

  // Register New Client AR Business State
  const [isNewBusinessFormOpen, setIsNewBusinessFormOpen] = useState(true);
  const [newBizName, setNewBizName] = useState('');
  const [newBizCategory, setNewBizCategory] = useState<ServiceCategory>('belleza');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [newBizImage, setNewBizImage] = useState<string>('');
  const [globalGlbUrlInput, setGlobalGlbUrlInput] = useState<string>(getGlobalGlbUrl());
  const [venueEditingDesc, setVenueEditingDesc] = useState<string>(
    currentVenue?.description || ''
  );
  const [venueEditingPhone, setVenueEditingPhone] = useState<string>(
    currentVenue?.phone || ''
  );
  const [venueEditingAddress, setVenueEditingAddress] = useState<string>(
    currentVenue?.address || ''
  );

  // Smart Calendar Block Form State
  const [blockDay, setBlockDay] = useState<DayName>('Martes');
  const [blockStart, setBlockStart] = useState('04:00 PM');
  const [blockEnd, setBlockEnd] = useState('06:00 PM');
  const [blockProId, setBlockProId] = useState('all');
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState('');

  // Agenda Filter & Inspected Appointment State
  const [agendaProFilter, setAgendaProFilter] = useState<string>('all');
  const [inspectedAppt, setInspectedAppt] = useState<Appointment | null>(null);

  // SaaS Billing Cadence & Notifications State
  const [annualBilling, setAnnualBilling] = useState(false);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifySms24h, setNotifySms24h] = useState(true);
  const [notifySms2h, setNotifySms2h] = useState(true);
  const [waTemplate, setWaTemplate] = useState(
    'Hola {cliente}, te recordamos tu cita de {servicio} con {especialista} el {fecha} a las {hora} en Glow Flagship Studio.'
  );

  // Dedicated WhatsApp Integration State
  const [waConfig, setWaConfig] = useState<WhatsAppConfig>(() => {
    return whatsAppConfig || DEFAULT_WHATSAPP_CONFIG;
  });
  const [waActiveTab, setWaActiveTab] = useState<'confirmation' | 'reminder24h'>(
    'confirmation'
  );
  const [waTestPhone, setWaTestPhone] = useState('+57 312 456 7890');
  const [waSampleIndex, setWaSampleIndex] = useState(0);
  const waTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (whatsAppConfig) {
      setWaConfig(whatsAppConfig);
    }
  }, [whatsAppConfig]);

  // Dedicated SMS Integration State
  const [localSmsConfig, setLocalSmsConfig] = useState<SmsConfig>(() => {
    return smsConfig || DEFAULT_SMS_CONFIG;
  });
  const smsTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (smsConfig) {
      setLocalSmsConfig(smsConfig);
    }
  }, [smsConfig]);

  const handleInsertVariable = (tag: string) => {
    const textarea = waTextareaRef.current;
    const currentTemplate =
      waActiveTab === 'confirmation'
        ? waConfig.confirmationTemplate
        : waConfig.reminder24hTemplate;

    if (!textarea) {
      const next = currentTemplate + ' ' + tag;
      if (waActiveTab === 'confirmation') {
        setWaConfig((prev) => ({ ...prev, confirmationTemplate: next }));
      } else {
        setWaConfig((prev) => ({ ...prev, reminder24hTemplate: next }));
      }
      return;
    }

    const start = textarea.selectionStart ?? currentTemplate.length;
    const end = textarea.selectionEnd ?? currentTemplate.length;
    const newText =
      currentTemplate.substring(0, start) +
      tag +
      currentTemplate.substring(end);

    if (waActiveTab === 'confirmation') {
      setWaConfig((prev) => ({ ...prev, confirmationTemplate: newText }));
    } else {
      setWaConfig((prev) => ({ ...prev, reminder24hTemplate: newText }));
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const handleApplyPreset = (preset: WhatsAppPreset) => {
    setWaConfig((prev) => ({
      ...prev,
      confirmationTemplate: preset.template,
    }));
    onShowToast(`Plantilla "${preset.name}" cargada.`);
  };

  const handleSaveWhatsAppConfig = () => {
    if (onSaveWhatsAppConfig) {
      onSaveWhatsAppConfig(waConfig);
    }
    onShowToast(
      'Plantilla y configuración de WhatsApp Business guardadas con éxito.'
    );
  };

  const samplePreviewAppointments = useMemo(() => {
    const valid = appointments.filter((a) => a.status !== 'Cancelada');
    if (valid.length > 0) return valid;
    return [
      {
        id: 'sample_1',
        code: 'GLW-4091',
        venueName: 'The Barber Club Flagship',
        client: 'Carlos Mendoza',
        phone: '+57 312 456 7890',
        serviceId: 's1',
        service: 'Corte Fade Pro & Asesoría',
        proId: 'p1',
        pro: 'Mateo Silva',
        dateKey: 'Mar, 10 Nov',
        dayName: 'Martes' as DayName,
        time: '10:00 AM',
        price: 35000,
        status: 'Confirmada' as const,
      },
    ];
  }, [appointments]);

  const activeSampleAppt =
    samplePreviewAppointments[
      waSampleIndex % samplePreviewAppointments.length
    ] || samplePreviewAppointments[0];

  const currentPreviewMessage = useMemo(() => {
    const template =
      waActiveTab === 'confirmation'
        ? waConfig.confirmationTemplate
        : waConfig.reminder24hTemplate;
    return compileWhatsAppMessage(template, activeSampleAppt);
  }, [waActiveTab, waConfig, activeSampleAppt]);

  // WhatsApp Formatted Text Renderer (handles *bold*, _italic_, ~strike~, line breaks)
  const renderWhatsAppFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, lineIdx) => {
      const parts: React.ReactNode[] = [];
      const regex = /(\*([^*]+)\*|_([^_]+)_|~([^~]+)~)/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let keyIdx = 0;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }

        if (match[2]) {
          parts.push(
            <strong
              key={`b-${lineIdx}-${keyIdx++}`}
              className="font-bold text-white"
            >
              {match[2]}
            </strong>
          );
        } else if (match[3]) {
          parts.push(
            <em key={`i-${lineIdx}-${keyIdx++}`} className="italic">
              {match[3]}
            </em>
          );
        } else if (match[4]) {
          parts.push(
            <del
              key={`s-${lineIdx}-${keyIdx++}`}
              className="line-through opacity-75"
            >
              {match[4]}
            </del>
          );
        }

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <span key={`line-${lineIdx}`} className="block min-h-[1.25em]">
          {parts.length > 0 ? parts : '\u00A0'}
        </span>
      );
    });
  };

  // Metrics
  const activeAppointments = useMemo(
    () => appointments.filter((a) => a.status !== 'Cancelada'),
    [appointments]
  );

  // Confirmed monthly revenue metrics (accumulated from confirmed appointments)
  const confirmedAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'Confirmada'),
    [appointments]
  );

  const monthlyConfirmedRevenue = useMemo(
    () => confirmedAppointments.reduce((acc, item) => acc + item.price, 0),
    [confirmedAppointments]
  );

  const averageTicket = useMemo(
    () =>
      confirmedAppointments.length > 0
        ? Math.round(monthlyConfirmedRevenue / confirmedAppointments.length)
        : 0,
    [confirmedAppointments.length, monthlyConfirmedRevenue]
  );

  const topServicesByRevenue = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    confirmedAppointments.forEach((a) => {
      const cur = map.get(a.service) || { name: a.service, count: 0, total: 0 };
      cur.count += 1;
      cur.total += a.price;
      map.set(a.service, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [confirmedAppointments]);

  const monthlyRevenueGoal = 1000000; // Goal: 1.000.000 COP
  const goalProgressPercent = Math.min(
    100,
    Math.round((monthlyConfirmedRevenue / monthlyRevenueGoal) * 100)
  );

  const projectedRevenue = useMemo(
    () => activeAppointments.reduce((acc, item) => acc + item.price, 0),
    [activeAppointments]
  );

  const activeServicesCount = useMemo(
    () => services.filter((s) => s.isActive).length,
    [services]
  );

  const filteredServices = useMemo(() => {
    const q = svcSearch.trim().toLowerCase();
    return services.filter((s) => {
      const matchCat = svcCatFilter === 'all' || s.category === svcCatFilter;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [services, svcCatFilter, svcSearch]);

  // Service CRUD Handlers
  const openCreateService = () => {
    setEditingSvcId(null);
    setSvcName('');
    setSvcCategory('belleza');
    setSvcSubCategory(SUBCATEGORY_LABELS['belleza'][0]);
    setSvcPrice('45000');
    setSvcDuration('45 min');
    setSvcIsActive(true);
    setSvcDesc('');
    setIsSvcModalOpen(true);
  };

  const openEditService = (svc: ServiceItem) => {
    setEditingSvcId(svc.id);
    setSvcName(svc.name);
    setSvcCategory(svc.category);
    setSvcSubCategory(svc.subCategory || (SUBCATEGORY_LABELS[svc.category]?.[0] || ''));
    setSvcPrice(String(svc.price));
    setSvcDuration(svc.duration);
    setSvcIsActive(svc.isActive);
    setSvcDesc(svc.desc);
    setIsSvcModalOpen(true);
  };

  const handleServiceFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = svcName.trim();
    if (!cleanName) return;
    const numericPrice = Math.max(5000, parseInt(svcPrice, 10) || 30000);

    const item: ServiceItem = {
      id: editingSvcId || `s_${Date.now()}`,
      name: cleanName,
      category: svcCategory,
      subCategory: svcSubCategory,
      price: numericPrice,
      duration: svcDuration,
      isActive: svcIsActive,
      desc: svcDesc.trim() || 'Servicio profesional personalizado',
    };

    onSaveService(item, !editingSvcId);
    setIsSvcModalOpen(false);
  };

  // Professional CRUD Handlers & Photo Upload
  const openCreatePro = () => {
    setEditingProId(null);
    setProName('');
    setProRole('');
    setProExp('4 años exp.');
    setProStatus('Disponible');
    setProAvatar(SPECIALIST_PHOTO_PRESETS[0]?.url || SPECIALIST_AVATAR_FALLBACK);
    setProAvatarUrlInput('');
    setIsProFormOpen(true);
  };

  const openEditPro = (pro: Professional) => {
    setEditingProId(pro.id);
    setProName(pro.name);
    setProRole(pro.role);
    setProExp(pro.exp);
    setProStatus(pro.status);
    setProAvatar(pro.avatar || SPECIALIST_AVATAR_FALLBACK);
    setProAvatarUrlInput(pro.avatar || '');
    setIsProFormOpen(true);
  };

  const handleProPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === 'string') {
        setProAvatar(loadEvent.target.result);
        onShowToast('Foto del especialista adjuntada con éxito.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = proName.trim();
    const cleanRole = proRole.trim();
    if (!cleanName || !cleanRole) return;

    const existing = editingProId
      ? professionals.find((p) => p.id === editingProId)
      : null;

    const item: Professional = {
      id: editingProId || `p_${Date.now()}`,
      name: cleanName,
      role: cleanRole,
      exp: proExp.trim() || '3 años exp.',
      rating: existing?.rating || '5.0',
      status: proStatus,
      avatar: proAvatar || existing?.avatar || SPECIALIST_AVATAR_FALLBACK,
    };

    onSaveProfessional(item, !editingProId);
    setIsProFormOpen(false);
  };

  // Venue Profile & Published Photos Handlers
  const handleSaveVenueProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVenue || !onUpdateVenue) return;
    onUpdateVenue({
      ...currentVenue,
      description: venueEditingDesc.trim() || currentVenue.description,
      phone: venueEditingPhone.trim() || currentVenue.phone,
      address: venueEditingAddress.trim() || currentVenue.address,
    });
    onShowToast('Información y perfil del local actualizados.');
  };

  const handleVenuePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentVenue || !onUpdateVenue) return;
    const existing = currentVenue.photos || [currentVenue.image];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (typeof loadEvent.target?.result === 'string') {
          const newPhoto = loadEvent.target.result;
          onUpdateVenue({
            ...currentVenue,
            photos: [newPhoto, ...existing],
          });
        }
      };
      reader.readAsDataURL(file);
    });
    onShowToast('Foto(s) del local agregada(s) con éxito.');
  };

  const handleAddCustomVenuePhoto = () => {
    const url = venueCustomPhotoUrl.trim();
    if (!url || !currentVenue || !onUpdateVenue) return;
    const existing = currentVenue.photos || [currentVenue.image];
    if (existing.includes(url)) {
      onShowToast('Esta foto ya se encuentra en la galería.');
      return;
    }
    onUpdateVenue({
      ...currentVenue,
      photos: [...existing, url],
    });
    setVenueCustomPhotoUrl('');
    onShowToast('Foto agregada a la galería del local.');
  };

  const handleAddPresetVenuePhoto = (url: string) => {
    if (!currentVenue || !onUpdateVenue) return;
    const existing = currentVenue.photos || [currentVenue.image];
    if (existing.includes(url)) {
      onShowToast('Esta foto ya está agregada en la galería.');
      return;
    }
    onUpdateVenue({
      ...currentVenue,
      photos: [...existing, url],
    });
    onShowToast('Foto del local agregada a la galería.');
  };

  const handleSetCoverPhoto = (photoUrl: string) => {
    if (!currentVenue || !onUpdateVenue) return;
    onUpdateVenue({
      ...currentVenue,
      image: photoUrl,
    });
    onShowToast('Foto principal de portada actualizada.');
  };

  const handleRemoveVenuePhoto = (photoUrl: string) => {
    if (!currentVenue || !onUpdateVenue) return;
    const filtered = (currentVenue.photos || []).filter((p) => p !== photoUrl);
    const newCover =
      currentVenue.image === photoUrl
        ? filtered[0] || BRAND_LOGO_FALLBACK
        : currentVenue.image;
    onUpdateVenue({
      ...currentVenue,
      image: newCover,
      photos: filtered.length > 0 ? filtered : [newCover],
    });
    onShowToast('Foto eliminada de la galería.');
  };

  // Smart Calendar Block Handler
  const handleCreateBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startMin = parseTimeToMinutes(blockStart);
    const endMin = parseTimeToMinutes(blockEnd);

    if (endMin <= startMin) {
      setBlockError(
        'La hora de finalización debe ser posterior a la hora de inicio.'
      );
      return;
    }

    setBlockError('');
    const targetPro =
      blockProId === 'all'
        ? null
        : professionals.find((p) => p.id === blockProId);

    const newBlock: BlockedSlot = {
      id: `blk_${Date.now()}`,
      day: blockDay,
      startTime: blockStart,
      endTime: blockEnd,
      proId: blockProId,
      proName: targetPro ? targetPro.name : 'Todo el Establecimiento',
      reason: blockReason.trim() || 'Bloqueo operativo del establecimiento',
    };

    onAddBlockedSlot(newBlock);
    setBlockReason('');
  };

  return (
    <div className="space-y-8">
      {/* 1. DASHBOARD / RESUMEN */}
      {activeView === 'dashboard' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Resumen Operativo del Negocio
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Sesión de socio: <span className="font-mono">{partnerEmail}</span> · Plan{' '}
                <span className="uppercase font-semibold text-champagne-600 dark:text-champagne-400">
                  {activePlan}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onChangeView('services')}
                className="px-4 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 bg-white dark:bg-obsidian-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-champagne-500 transition-colors whitespace-nowrap"
              >
                Gestionar Servicios
              </button>
              <button
                type="button"
                onClick={() => onChangeView('schedule')}
                className="px-4 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Configurar Bloqueos</span>
              </button>
            </div>
          </div>

          {/* 4-Column KPI Strip (Tabular Numerals) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Reservas Activas
              </p>
              <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {activeAppointments.length}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Sincronizadas desde portal cliente
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ingresos Confirmados (Mes)
              </p>
              <p className="text-2xl font-extrabold font-mono text-champagne-600 dark:text-champagne-400 tabular-nums">
                {formatCOP(monthlyConfirmedRevenue)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {confirmedAppointments.length} citas confirmadas acumuladas
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Servicios Publicados
              </p>
              <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {activeServicesCount} / {services.length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visibles para reserva inmediata
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Reglas de Calendario
              </p>
              <p className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {blockedSlots.length}{' '}
                {blockedSlots.length === 1 ? 'Bloqueo' : 'Bloqueos'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {
                  DAYS_ORDER.filter((d) => !workingDays[d].isOpen).length
                }{' '}
                día(s) cerrado(s) por semana
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* WIDGET: TOTAL DE INGRESOS MENSUALES ACUMULADOS           */}
          {/* (Calculado en tiempo real a partir de citas confirmadas) */}
          {/* ======================================================== */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-obsidian-900 via-obsidian-900 to-obsidian-850 border border-champagne-500/30 shadow-xl relative overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-champagne-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-200/10 dark:border-obsidian-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-champagne-500/20 to-emerald-500/10 border border-champagne-500/30 flex items-center justify-center text-champagne-400 shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        Total de Ingresos Mensuales Acumulados
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                        Citas Confirmadas
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Recaudación calculada en tiempo real a partir de todas las citas confirmadas del mes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto bg-obsidian-850 px-3 py-1.5 rounded-xl border border-obsidian-750">
                  <span className="text-[11px] text-slate-300 font-mono">
                    Período Actual: Noviembre 2026
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Central Revenue Display & Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Big Number & Progress (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recaudación Acumulada
                    </span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-champagne-300 via-champagne-400 to-amber-200 tabular-nums">
                        {formatCOP(monthlyConfirmedRevenue)}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <TrendingUp className="w-3 h-3" />
                        <span>Confirmado</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Suma exacta del valor de los servicios agendados con confirmación directa
                    </p>
                  </div>

                  {/* Goal Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        Meta Mensual del Negocio ({formatCOP(monthlyRevenueGoal)})
                      </span>
                      <span className="font-mono font-bold text-champagne-400">
                        {goalProgressPercent}% alcanzado
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-obsidian-800 border border-obsidian-750 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-champagne-500 to-amber-300 transition-all duration-500"
                        style={{ width: `${goalProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Stat badges */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-obsidian-850/80 border border-obsidian-750/80 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                        Citas Confirmadas
                      </span>
                      <span className="text-base sm:text-lg font-extrabold font-mono text-white tabular-nums">
                        {confirmedAppointments.length}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-obsidian-850/80 border border-obsidian-750/80 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                        Ticket Promedio
                      </span>
                      <span className="text-base sm:text-lg font-extrabold font-mono text-champagne-300 tabular-nums truncate block">
                        {formatCOP(averageTicket)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-obsidian-850/80 border border-obsidian-750/80 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                        Tasa Conversión
                      </span>
                      <span className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 tabular-nums">
                        {appointments.length > 0
                          ? Math.round((confirmedAppointments.length / appointments.length) * 100)
                          : 100}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Contributing Services breakdown (5 cols) */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-obsidian-850/60 border border-obsidian-750 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-champagne-400" />
                      <span>Servicios Más Rentables (Mes)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Subtotal
                    </span>
                  </div>

                  {topServicesByRevenue.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      No hay citas confirmadas registradas aún.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topServicesByRevenue.map((svc) => {
                        const percentOfTotal =
                          monthlyConfirmedRevenue > 0
                            ? Math.round((svc.total / monthlyConfirmedRevenue) * 100)
                            : 0;
                        return (
                          <div
                            key={svc.name}
                            className="p-2.5 rounded-xl bg-obsidian-900/80 border border-obsidian-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-200 truncate">
                                {svc.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {svc.count} {svc.count === 1 ? 'cita' : 'citas'} · {percentOfTotal}% del acumulado
                              </p>
                            </div>
                            <span className="font-bold font-mono text-champagne-400 tabular-nums shrink-0">
                              {formatCOP(svc.total)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Tendencia Diaria de Ingresos (Recharts) */}
          <DailyRevenueTrendChart
            appointments={appointments}
            monthlyGoal={monthlyRevenueGoal}
          />

          {/* Live Appointments Table */}
          <div className="rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200 dark:border-obsidian-800 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Citas Agendadas por Clientes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cualquier reserva creada desde la Vista de Cliente aparece aquí al instante.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChangeView('calendar')}
                className="text-xs font-bold text-champagne-600 dark:text-champagne-400 hover:underline whitespace-nowrap"
              >
                Abrir Matriz Semanal
              </button>
            </div>

            <div className="divide-y divide-sand-200 dark:divide-obsidian-800">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sand-50/70 dark:hover:bg-obsidian-850/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-bold text-champagne-600 dark:text-champagne-400 tabular-nums">
                        {appt.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {appt.client}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{appt.phone}</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {appt.service} {appt.pro !== 'Primer disponible' && `— Con ${appt.pro}`}
                    </p>
                    
                    {/* Specialized Info Badge/Text */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums bg-sand-100 dark:bg-obsidian-800 px-2 py-0.5 rounded">
                        {appt.dateKey} {appt.time && `· ${appt.time}`}
                      </p>
                      {appt.engineType === 'accommodation' && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                          {appt.checkInDate} ↔ {appt.checkOutDate} · {appt.guestsCount} pers.
                        </span>
                      )}
                      {appt.engineType === 'rental' && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                          {appt.pickupLocation} · {appt.pickupTime}
                        </span>
                      )}
                      {appt.engineType === 'restaurant' && (
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">
                          Zona: {appt.zone} · {appt.guestsCount} pers.
                        </span>
                      )}
                      {appt.engineType === 'facility' && (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">
                          Duración: {appt.durationHours}h · {appt.amenities?.length || 0} extras
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg ${
                        appt.status === 'Confirmada'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : appt.status === 'Completada'
                            ? 'bg-champagne-500/15 text-champagne-600 dark:text-champagne-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {appt.status}
                    </span>

                    {appt.status === 'Confirmada' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAppointmentStatus(appt.id, 'Completada')
                          }
                          className="px-3 py-1.5 rounded-lg border border-sand-200 dark:border-obsidian-750 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors whitespace-nowrap"
                        >
                          Completar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAppointmentStatus(appt.id, 'Cancelada')
                          }
                          className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors whitespace-nowrap"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. AGENDA GENERAL DEL NEGOCIO CON BLOQUEOS APLICADOS */}
      {activeView === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Agenda General del Negocio
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Visualiza días cerrados, bloqueos aplicados y citas activas que limitan automáticamente las opciones del cliente.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <select
                aria-label="Filtrar agenda por especialista"
                value={agendaProFilter}
                onChange={(e) => setAgendaProFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-champagne-500"
              >
                <option value="all">Todo el Equipo</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onChangeView('schedule')}
                className="px-3.5 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors whitespace-nowrap"
              >
                Editar Horarios / Bloqueos
              </button>
            </div>
          </div>

          {inspectedAppt && (
            <div className="p-5 rounded-[24px] bg-white dark:bg-obsidian-900 border border-champagne-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-champagne-500/5">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="bg-champagne-500/10 text-champagne-600 px-2 py-0.5 rounded text-[10px] font-mono">#{inspectedAppt.code}</span>
                  {inspectedAppt.client} ({inspectedAppt.phone})
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{inspectedAppt.service}</span>
                  <span>·</span>
                  <span>{inspectedAppt.dateKey} {inspectedAppt.time}</span>
                  <span>·</span>
                  <span className="font-mono text-champagne-600 font-bold">{formatCOP(inspectedAppt.price)}</span>
                </div>
                {/* Specialized details in inspector */}
                {(inspectedAppt.engineType === 'accommodation' || inspectedAppt.engineType === 'rental' || inspectedAppt.engineType === 'restaurant') && (
                  <p className="text-[11px] font-medium text-slate-400 bg-sand-50 dark:bg-obsidian-850 p-2 rounded-xl border border-sand-200 dark:border-obsidian-800 inline-block mt-2">
                    {inspectedAppt.engineType === 'accommodation' && `Noches: ${inspectedAppt.checkInDate} a ${inspectedAppt.checkOutDate} · ${inspectedAppt.guestsCount} pers.`}
                    {inspectedAppt.engineType === 'rental' && `Entrega: ${inspectedAppt.pickupLocation} · Regreso: ${inspectedAppt.returnLocation || 'Sede'}`}
                    {inspectedAppt.engineType === 'restaurant' && `Zona: ${inspectedAppt.zone} · Comensales: ${inspectedAppt.guestsCount}`}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectedAppt(null)}
                className="px-4 py-2 rounded-xl border border-sand-300 dark:border-obsidian-750 text-xs font-bold self-start sm:self-center hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-colors shrink-0"
              >
                Cerrar detalle
              </button>
            </div>
          )}

          {/* Weekly Matrix */}
          <div className="bg-white dark:bg-obsidian-900 rounded-2xl border border-sand-200 dark:border-obsidian-800 overflow-x-auto">
            <div className="min-w-[780px]">
              {/* Column Headers */}
              <div className="grid grid-cols-8 border-b border-sand-200 dark:border-obsidian-800 text-center text-xs font-bold bg-sand-50 dark:bg-obsidian-850/70">
                <div className="p-3 font-mono text-slate-500 dark:text-slate-400 border-r border-sand-200 dark:border-obsidian-800">
                  Hora
                </div>
                {DAYS_ORDER.map((day) => {
                  const cfg = workingDays[day];
                  return (
                    <div
                      key={day}
                      className={`p-3 border-r last:border-r-0 border-sand-200 dark:border-obsidian-800 ${
                        !cfg.isOpen
                          ? 'bg-rose-500/5 text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      <p className="font-bold">{day.slice(0, 3)}</p>
                      <p className="text-[10px] font-mono font-normal opacity-80 mt-0.5 tabular-nums">
                        {cfg.isOpen ? `${cfg.openTime.replace(' ', '')}` : 'Cerrado'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Time Rows */}
              <div className="divide-y divide-sand-200 dark:divide-obsidian-800 max-h-[540px] overflow-y-auto">
                {TIME_SLOTS.map((slot) => {
                  const slotMin = parseTimeToMinutes(slot);
                  return (
                    <div key={slot} className="grid grid-cols-8 min-h-[60px]">
                      <div className="p-2.5 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 border-r border-sand-200 dark:border-obsidian-800 tabular-nums">
                        {slot}
                      </div>

                      {DAYS_ORDER.map((day) => {
                        const cfg = workingDays[day];
                        const openMin = parseTimeToMinutes(cfg.openTime);
                        const closeMin = parseTimeToMinutes(cfg.closeTime);
                        const isClosed =
                          !cfg.isOpen || slotMin < openMin || slotMin >= closeMin;

                        if (isClosed) {
                          return (
                            <div
                              key={`${day}-${slot}`}
                              className="p-1.5 border-r last:border-r-0 border-sand-200 dark:border-obsidian-800 bg-rose-500/5 flex items-center justify-center text-[10px] font-semibold text-rose-500/80"
                            >
                              Cerrado
                            </div>
                          );
                        }

                        const matchingBlock = blockedSlots.find((b) => {
                          if (b.day !== day) return false;
                          if (
                            agendaProFilter !== 'all' &&
                            b.proId !== 'all' &&
                            b.proId !== agendaProFilter
                          ) {
                            return false;
                          }
                          const sMin = parseTimeToMinutes(b.startTime);
                          const eMin = parseTimeToMinutes(b.endTime);
                          return slotMin >= sMin && slotMin < eMin;
                        });

                        if (matchingBlock) {
                          return (
                            <div
                              key={`${day}-${slot}`}
                              className="p-1 border-r last:border-r-0 border-sand-200 dark:border-obsidian-800"
                            >
                              <div className="h-full p-1.5 rounded-lg bg-rose-500/10 border border-dashed border-rose-500/40 text-[10px] flex flex-col justify-between">
                                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 shrink-0" />
                                  Bloqueado
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 truncate">
                                  {matchingBlock.reason}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        const matchingAppt = activeAppointments.find(
                          (a) =>
                            a.dayName === day &&
                            a.time === slot &&
                            (agendaProFilter === 'all' ||
                              a.proId === agendaProFilter)
                        );

                        if (matchingAppt) {
                          return (
                            <div
                              key={`${day}-${slot}`}
                              className="p-1 border-r last:border-r-0 border-sand-200 dark:border-obsidian-800"
                            >
                              <button
                                type="button"
                                onClick={() => setInspectedAppt(matchingAppt)}
                                className="w-full h-full text-left p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 text-[10px] flex flex-col justify-between transition-colors"
                              >
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
                                  {matchingAppt.client}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 truncate">
                                  {matchingAppt.pro}
                                </span>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${day}-${slot}`}
                            className="p-1.5 border-r last:border-r-0 border-sand-200 dark:border-obsidian-800 text-[10px] text-slate-400/60 flex items-center justify-center"
                          >
                            Libre
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GESTIÓN DE SERVICIOS Y PRECIOS EN COP */}
      {activeView === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Servicios &amp; Tarifas (COP)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Crea, edita precios en pesos colombianos o pausa servicios. Los cambios se reflejan al instante en la Vista de Cliente.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateService}
              className="px-4 py-2.5 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Servicio</span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar p-1 rounded-xl bg-sand-100 dark:bg-obsidian-850">
              {(['all', 'belleza', 'bienestar', 'deportes', 'lugares', 'vehiculos', 'restaurantes'] as const).map(
                (cat) => {
                  const isActive = svcCatFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSvcCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : (CATEGORY_LABELS[cat as ServiceCategory] || cat)}
                    </button>
                  );
                }
              )}
            </div>

            <div className="relative lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={svcSearch}
                onChange={(e) => setSvcSearch(e.target.value)}
                placeholder="Buscar servicio..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
              />
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No hay servicios en esta categoría o búsqueda.
              </p>
              <button
                type="button"
                onClick={openCreateService}
                className="px-4 py-2 rounded-xl bg-champagne-500 text-slate-950 text-xs font-bold"
              >
                Agregar Servicio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-obsidian-900 border flex flex-col justify-between space-y-4 ${
                    svc.isActive
                      ? 'border-sand-200 dark:border-obsidian-800'
                      : 'border-dashed border-sand-300 dark:border-obsidian-750 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {CATEGORY_LABELS[svc.category]} ·{' '}
                        <span className="font-mono tabular-nums">{svc.duration}</span>
                      </span>

                      {inlinePriceId === svc.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-mono font-bold text-champagne-400">$</span>
                          <input
                            type="number"
                            min={5000}
                            step={1000}
                            autoFocus
                            value={inlinePriceVal}
                            onChange={(e) => setInlinePriceVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const num = parseInt(inlinePriceVal, 10);
                                if (num && num >= 5000) {
                                  onSaveService({ ...svc, price: num }, false);
                                  onShowToast(`Precio de "${svc.name}" actualizado a ${formatCOP(num)}.`);
                                }
                                setInlinePriceId(null);
                              } else if (e.key === 'Escape') {
                                setInlinePriceId(null);
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 rounded-lg bg-sand-100 dark:bg-obsidian-850 border border-champagne-500 text-xs font-mono font-black text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseInt(inlinePriceVal, 10);
                              if (num && num >= 5000) {
                                onSaveService({ ...svc, price: num }, false);
                                onShowToast(`Precio de "${svc.name}" actualizado a ${formatCOP(num)}.`);
                              }
                              setInlinePriceId(null);
                            }}
                            className="p-1 rounded bg-champagne-500 text-slate-950 hover:bg-champagne-400 transition-colors"
                            title="Guardar precio"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlinePriceId(null)}
                            className="p-1 rounded bg-sand-200 dark:bg-obsidian-750 text-slate-400 hover:text-white transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setInlinePriceId(svc.id);
                            setInlinePriceVal(String(svc.price));
                          }}
                          className="font-mono font-bold text-sm text-champagne-600 dark:text-champagne-400 hover:text-champagne-300 hover:underline tabular-nums shrink-0 flex items-center gap-1 group/p cursor-pointer"
                          title="Clic para modificar precio en COP rápidamente"
                        >
                          <span>{formatCOP(svc.price)}</span>
                          <Edit3 className="w-3 h-3 opacity-60 group-hover/p:opacity-100 text-slate-400" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {svc.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-sand-200 dark:border-obsidian-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleServiceActive(svc.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        svc.isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-sand-100 dark:bg-obsidian-850 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {svc.isActive ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Pausado</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditService(svc)}
                        aria-label={`Editar ${svc.name}`}
                        className="px-2.5 py-1.5 rounded-lg border border-sand-200 dark:border-obsidian-750 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-champagne-500 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {confirmDeleteSvcId === svc.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteService(svc.id);
                            setConfirmDeleteSvcId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSvcId(svc.id)}
                          aria-label={`Eliminar ${svc.name}`}
                          className="p-1.5 rounded-lg border border-sand-200 dark:border-obsidian-750 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. CALENDARIO INTELIGENTE: DÍAS CERRADOS Y BLOQUEOS DE HORAS */}
      {activeView === 'schedule' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Calendario Inteligente &amp; Bloqueos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Habilita o deshabilita días completos (ej. domingos cerrados) y bloquea rangos de horas específicas (ej. martes de 4 a 6 PM).
            </p>
          </div>

          {/* 1. Working Days Configuration */}
          <div className="p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 dark:border-obsidian-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Días Laborables y Horarios de Atención
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Los días marcados como "Cerrado" se deshabilitan automáticamente en el selector del cliente.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Sincronización inmediata
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {DAYS_ORDER.map((day) => {
                const cfg = workingDays[day];
                return (
                  <div
                    key={day}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                      cfg.isOpen
                        ? 'bg-sand-50 dark:bg-obsidian-850 border-sand-200 dark:border-obsidian-750'
                        : 'bg-rose-500/5 border-rose-500/25'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {day}
                        </span>
                        <span
                          className={`text-[11px] font-bold ${
                            cfg.isOpen
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {cfg.isOpen ? 'Abierto' : 'Cerrado'}
                        </span>
                      </div>

                      {cfg.isOpen ? (
                        <div className="space-y-1.5 pt-1 text-[11px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-400">Abre:</span>
                            <select
                              aria-label={`Hora apertura ${day}`}
                              value={cfg.openTime}
                              onChange={(e) =>
                                onUpdateWorkingHours(
                                  day,
                                  e.target.value,
                                  cfg.closeTime
                                )
                              }
                              className="px-1.5 py-1 rounded bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-700 font-mono text-[11px] text-slate-800 dark:text-slate-200"
                            >
                              {ALL_DAY_HOURS.slice(0, 6).map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-400">Cierra:</span>
                            <select
                              aria-label={`Hora cierre ${day}`}
                              value={cfg.closeTime}
                              onChange={(e) =>
                                onUpdateWorkingHours(
                                  day,
                                  cfg.openTime,
                                  e.target.value
                                )
                              }
                              className="px-1.5 py-1 rounded bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-700 font-mono text-[11px] text-slate-800 dark:text-slate-200"
                            >
                              {ALL_DAY_HOURS.slice(5).map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          Sin atención al público
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleWorkingDay(day)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                        cfg.isOpen
                          ? 'border border-sand-300 dark:border-obsidian-700 text-slate-700 dark:text-slate-200 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {cfg.isOpen ? 'Marcar Cerrado' : 'Habilitar Día'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Specific Time-Range Blocks */}
          <div className="p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-6">
            <div className="border-b border-sand-200 dark:border-obsidian-800 pb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bloquear Rangos de Horas Específicas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ejemplo: bloquear los martes de 4:00 PM a 6:00 PM por capacitación. Los clientes verán esos turnos bloqueados al intentar agendar.
              </p>
            </div>

            <form
              onSubmit={handleCreateBlockSubmit}
              className="p-4 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label
                    htmlFor="block-day-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Día de la semana *
                  </label>
                  <select
                    id="block-day-select"
                    value={blockDay}
                    onChange={(e) => setBlockDay(e.target.value as DayName)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    {DAYS_ORDER.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="block-start-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Hora Inicio *
                  </label>
                  <select
                    id="block-start-select"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    {ALL_DAY_HOURS.slice(0, -1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="block-end-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Hora Fin *
                  </label>
                  <select
                    id="block-end-select"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    {ALL_DAY_HOURS.slice(1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="block-pro-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Aplica a *
                  </label>
                  <select
                    id="block-pro-select"
                    value={blockProId}
                    onChange={(e) => setBlockProId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    <option value="all">Todo el Establecimiento</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  aria-label="Motivo del bloqueo"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Motivo del bloqueo (ej. Capacitación técnica, mantenimiento, descanso)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Aplicar Bloqueo</span>
                </button>
              </div>

              {blockError && (
                <p
                  role="alert"
                  className="text-rose-600 dark:text-rose-400 font-semibold"
                >
                  {blockError}
                </p>
              )}
            </form>

            {/* Active Blocks List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bloqueos Horarios Activos ({blockedSlots.length})
              </h4>

              {blockedSlots.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
                  No hay bloqueos de rango horario configurados actualmente.
                </p>
              ) : (
                <div className="divide-y divide-sand-200 dark:divide-obsidian-800 border border-sand-200 dark:border-obsidian-800 rounded-xl">
                  {blockedSlots.map((blk) => (
                    <div
                      key={blk.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {blk.day}
                            </span>
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                              {blk.startTime} – {blk.endTime}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">
                            {blk.proName} · {blk.reason}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveBlockedSlot(blk.id)}
                        className="px-3.5 py-2 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Desbloquear</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. EQUIPO & ESPECIALISTAS */}
      {activeView === 'professionals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Equipo &amp; Especialistas
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Agrega, edita o elimina miembros del equipo. Los especialistas activos aparecen disponibles en el Paso 2 de reserva.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreatePro}
              className="px-4 py-2.5 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Agregar Especialista</span>
            </button>
          </div>

          {isProFormOpen && (
            <form
              onSubmit={handleProFormSubmit}
              className="p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-champagne-500/50 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingProId
                    ? 'Editar Miembro del Equipo'
                    : 'Nuevo Miembro del Equipo'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProFormOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label
                    htmlFor="pro-name-input"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nombre Completo *
                  </label>
                  <input
                    id="pro-name-input"
                    type="text"
                    required
                    value={proName}
                    onChange={(e) => setProName(e.target.value)}
                    placeholder="Ej. Sebastián Duarte"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pro-role-input"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Especialidad / Cargo *
                  </label>
                  <input
                    id="pro-role-input"
                    type="text"
                    required
                    value={proRole}
                    onChange={(e) => setProRole(e.target.value)}
                    placeholder="Ej. Master Barber, Colorista..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pro-exp-input"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Experiencia
                  </label>
                  <input
                    id="pro-exp-input"
                    type="text"
                    value={proExp}
                    onChange={(e) => setProExp(e.target.value)}
                    placeholder="Ej. 5 años exp."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pro-status-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Estado Operativo
                  </label>
                  <select
                    id="pro-status-select"
                    value={proStatus}
                    onChange={(e) =>
                      setProStatus(e.target.value as SpecialistStatus)
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="En Servicio">En Servicio</option>
                    <option value="Descanso">Descanso (No recibe citas)</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN ADJUNTAR FOTO DEL ESPECIALISTA */}
              <div className="p-4 rounded-xl bg-sand-50/70 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-champagne-500" />
                    <span>Fotografía del Especialista</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Visible en el catálogo y en el selector de citas para clientes
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Vista Previa de la Foto */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-obsidian-950 border-2 border-champagne-500/40 shrink-0 shadow-md">
                    <ResilientImage
                      src={proAvatar}
                      fallbackSrc={SPECIALIST_AVATAR_FALLBACK}
                      alt="Vista previa especialista"
                      fallbackLabel={proName || 'Especialista'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-0.5">
                      <span className="text-[8px] font-bold text-white uppercase tracking-wider">
                        Foto
                      </span>
                    </div>
                  </div>

                  {/* Acciones de carga de Foto */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="pro-file-input"
                        className="cursor-pointer px-3 py-1.5 rounded-xl bg-sand-200 dark:bg-obsidian-750 hover:bg-champagne-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir desde dispositivo</span>
                      </label>
                      <input
                        id="pro-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleProPhotoUpload}
                        className="hidden"
                      />

                      <div className="flex-1 min-w-[200px] flex items-center gap-1.5">
                        <input
                          type="url"
                          placeholder="O pega URL de foto (https://...)"
                          value={proAvatarUrlInput}
                          onChange={(e) => {
                            setProAvatarUrlInput(e.target.value);
                            if (e.target.value.trim().startsWith('http')) {
                              setProAvatar(e.target.value.trim());
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-sand-100 dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-750 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                        />
                      </div>
                    </div>

                    {/* Presets Rápidos de Avatar */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        O selecciona un avatar sugerido según especialidad:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {SPECIALIST_PHOTO_PRESETS.map((preset) => {
                          const isSel = proAvatar === preset.url;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setProAvatar(preset.url);
                                setProAvatarUrlInput(preset.url);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                                isSel
                                  ? 'bg-champagne-500 text-slate-950 shadow-sm'
                                  : 'bg-sand-200/60 dark:bg-obsidian-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span>{preset.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-champagne-500 text-slate-950 font-extrabold"
                >
                  {editingProId ? 'Guardar Cambios' : 'Agregar al Equipo'}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {professionals.map((pro) => (
              <div
                key={pro.id}
                className="bg-white dark:bg-obsidian-900 p-5 rounded-2xl border border-sand-200 dark:border-obsidian-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-obsidian-950">
                    <ResilientImage
                      src={pro.avatar}
                      fallbackSrc={SPECIALIST_AVATAR_FALLBACK}
                      alt={pro.name}
                      fallbackLabel={pro.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <span>{pro.exp}</span>
                      <span className="text-champagne-600 dark:text-champagne-400 font-bold">
                        ★ {pro.rating}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {pro.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {pro.role}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-sand-200 dark:border-obsidian-800 flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold ${
                      pro.status === 'Descanso'
                        ? 'text-rose-500'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {pro.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditPro(pro)}
                      aria-label={`Editar a ${pro.name}`}
                      className="px-2.5 py-1.5 rounded-lg border border-sand-200 dark:border-obsidian-750 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-champagne-500 transition-colors"
                    >
                      Editar
                    </button>

                    {confirmDeleteProId === pro.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProfessional(pro.id);
                          setConfirmDeleteProId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteProId(pro.id)}
                        aria-label={`Eliminar a ${pro.name}`}
                        className="p-1.5 rounded-lg border border-sand-200 dark:border-obsidian-750 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5B. MI LOCAL & PUBLICACIÓN DE FOTOS DEL ESTABLECIMIENTO */}
      {activeView === 'venue' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Mi Local &amp; Fotos del Establecimiento
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-champagne-500/15 text-champagne-400 border border-champagne-500/30">
                  Galería para Clientes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Publica las fotografías de tu local (fachada, estaciones, cabinas, sala VIP) para que los visitantes las vean antes de reservar.
              </p>
            </div>

            {currentVenue && (
              <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-xs">
                <span className="text-slate-400">Fotos publicadas:</span>
                <span className="font-mono font-bold text-champagne-400">
                  {(currentVenue.photos && currentVenue.photos.length) || 1} fotos
                </span>
              </div>
            )}
          </div>

          {currentVenue ? (
            <div className="space-y-6">
              {/* Información General del Local */}
              <form
                onSubmit={handleSaveVenueProfile}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-champagne-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Información del Establecimiento ({currentVenue.name})
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {CATEGORY_LABELS[currentVenue.category]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label
                      htmlFor="venue-address-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Dirección y Sede
                    </label>
                    <input
                      id="venue-address-input"
                      type="text"
                      value={venueEditingAddress}
                      onChange={(e) => setVenueEditingAddress(e.target.value)}
                      placeholder="Ej. Cra 13 #82-45, Zona Rosa, Bogotá"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="venue-phone-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Teléfono / WhatsApp Local
                    </label>
                    <input
                      id="venue-phone-input"
                      type="text"
                      value={venueEditingPhone}
                      onChange={(e) => setVenueEditingPhone(e.target.value)}
                      placeholder="Ej. +57 312 456 7890"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-champagne-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="venue-desc-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Descripción y Ambiente para Clientes
                    </label>
                    <input
                      id="venue-desc-input"
                      type="text"
                      value={venueEditingDesc}
                      onChange={(e) => setVenueEditingDesc(e.target.value)}
                      placeholder="Ej. Espacio contemporáneo de lujo con sillones japoneses y café de especialidad..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors"
                  >
                    Guardar Datos del Local
                  </button>
                </div>
              </form>

              {/* Zona de Publicación y Carga de Fotos */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-200 dark:border-obsidian-800 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-champagne-500/15 border border-champagne-500/30 flex items-center justify-center text-champagne-400">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        Publicar Nuevas Fotos del Local
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sube imágenes reales de tus instalaciones o agrega enlaces de alta resolución
                      </p>
                    </div>
                  </div>

                  <label
                    htmlFor="venue-photos-upload-input"
                    className="cursor-pointer px-4 py-2.5 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto shadow-gold-subtle"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir Fotos desde mi PC / Teléfono</span>
                  </label>
                  <input
                    id="venue-photos-upload-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleVenuePhotoUpload}
                    className="hidden"
                  />
                </div>

                {/* Entrada por URL directa */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={venueCustomPhotoUrl}
                      onChange={(e) => setVenueCustomPhotoUrl(e.target.value)}
                      placeholder="Pegar URL de foto del local (ej. https://images.unsplash.com/...)"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomVenuePhoto}
                    className="px-4 py-2.5 rounded-xl bg-sand-200 dark:bg-obsidian-750 hover:bg-champagne-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 font-bold transition-colors whitespace-nowrap"
                  >
                    Publicar por Enlace
                  </button>
                </div>

                {/* Sugerencias de Fotos de Alta Definición */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Fotografías sugeridas para tu tipo de establecimiento ({CATEGORY_LABELS[currentVenue.category]}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {VENUE_PHOTO_PRESETS.map((preset) => {
                      const isAlreadyAdded = (currentVenue.photos || []).includes(preset.url);
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAddPresetVenuePhoto(preset.url)}
                          disabled={isAlreadyAdded}
                          className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                            isAlreadyAdded
                              ? 'opacity-40 border-slate-700 bg-obsidian-950 cursor-not-allowed'
                              : 'bg-sand-50 dark:bg-obsidian-850 border-sand-200 dark:border-obsidian-750 hover:border-champagne-500'
                          }`}
                        >
                          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-obsidian-950">
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 truncate block">
                            {preset.label}
                          </span>
                          <span className="text-[8px] font-mono text-champagne-400">
                            {isAlreadyAdded ? '✓ Publicada' : '+ Agregar'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Galería Actual Publicada */}
                <div className="space-y-3 pt-4 border-t border-sand-200 dark:border-obsidian-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-champagne-400" />
                      <span>Galería Activa del Local</span>
                      <span className="text-xs font-mono font-normal text-slate-400">
                        ({(currentVenue.photos && currentVenue.photos.length) || 1} fotos)
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Cualquier visitante puede ver estas fotos en pantalla completa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {((currentVenue.photos && currentVenue.photos.length > 0)
                      ? currentVenue.photos
                      : [currentVenue.image]
                    ).map((photoUrl, pIdx) => {
                      const isCover = currentVenue.image === photoUrl;
                      return (
                        <div
                          key={`${photoUrl}-${pIdx}`}
                          className={`rounded-2xl border overflow-hidden bg-white dark:bg-obsidian-850 p-2.5 space-y-2.5 transition-all ${
                            isCover
                              ? 'border-champagne-500 ring-2 ring-champagne-500/20'
                              : 'border-sand-200 dark:border-obsidian-750'
                          }`}
                        >
                          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-obsidian-950">
                            <ResilientImage
                              src={photoUrl}
                              alt={`${currentVenue.name} foto ${pIdx + 1}`}
                              fallbackLabel={currentVenue.name}
                              className="w-full h-full object-cover"
                            />
                            {isCover && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-champagne-500 text-slate-950 font-mono text-[9px] font-black uppercase shadow-md">
                                Portada Principal
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 text-white font-mono text-[9px] font-bold">
                              #{pIdx + 1}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => handleSetCoverPhoto(photoUrl)}
                                className="px-2 py-1 rounded-lg border border-sand-200 dark:border-obsidian-700 hover:border-champagne-500 text-[10px] font-bold text-slate-300 hover:text-champagne-400 transition-colors"
                              >
                                Fijar Portada
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-champagne-400">
                                Portada Activa
                              </span>
                            )}

                            {(currentVenue.photos && currentVenue.photos.length > 1) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveVenuePhoto(photoUrl)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Eliminar foto de la galería"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reseñas de Clientes Recibidas */}
                <div className="space-y-4 pt-4 border-t border-sand-200 dark:border-obsidian-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Star className="w-4 h-4 text-champagne-400 fill-champagne-400" />
                        <span>Reseñas de Clientes ({currentVenue.rating.toFixed(1)} ★)</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Opiniones enviadas por los clientes que agendan en tu establecimiento
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-champagne-400">
                      {reviews.filter((r) => r.venueId === currentVenue.id).length} opiniones
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reviews.filter((r) => r.venueId === currentVenue.id).length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 col-span-2">
                        No hay opiniones registradas aún para este establecimiento.
                      </p>
                    ) : (
                      reviews
                        .filter((r) => r.venueId === currentVenue.id)
                        .map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3.5 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {rev.clientName}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= rev.rating
                                        ? 'text-champagne-500 fill-champagne-500'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 italic">
                              "{rev.comment}"
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                              {rev.date} {rev.serviceName ? `· ${rev.serviceName}` : ''}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-center">
              <p className="text-sm text-slate-400">
                No hay información de local vinculada a este perfil.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. PLANES DE SUSCRIPCIÓN SAAS */}
      {activeView === 'pricing' && (
        <div className="space-y-8 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-champagne-600 dark:text-champagne-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Suscripción SaaS para Socios</span>
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Planes de Suscripción para tu Establecimiento
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tarifas fijas en pesos colombianos (COP) sin comisiones por cita agendada.
              </p>
            </div>

            <div className="inline-flex items-center p-1 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 self-start">
              <button
                type="button"
                onClick={() => setAnnualBilling(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  !annualBilling
                    ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Facturación Mensual
              </button>
              <button
                type="button"
                onClick={() => setAnnualBilling(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  annualBilling
                    ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Anual (-20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 'basico' as SaasPlanId,
                name: 'Plan Básico',
                audience: 'Para profesionales independientes',
                monthlyPrice: 0,
                features: [
                  '1 especialista activo',
                  'Hasta 40 reservas mensuales',
                  'Reserva cliente sin registro en 4 pasos',
                ],
              },
              {
                id: 'pro' as SaasPlanId,
                name: 'Plan Pro',
                audience: 'Para barberías, spas y salones en crecimiento',
                monthlyPrice: 49000,
                features: [
                  'Reservas y clientes ilimitados',
                  'Hasta 10 especialistas en equipo',
                  'Calendario inteligente con bloqueos horarios',
                  'Confirmaciones automáticas por WhatsApp',
                ],
              },
              {
                id: 'elite' as SaasPlanId,
                name: 'Plan Élite',
                audience: 'Para clínicas estéticas y múltiples sedes',
                monthlyPrice: 99000,
                features: [
                  'Especialistas y sedes ilimitadas',
                  'Recordatorios SMS + WhatsApp bidireccional',
                  'Reportes financieros y soporte prioritario',
                ],
              },
            ].map((plan) => {
              const isCurrent = activePlan === plan.id;
              const finalPrice = annualBilling
                ? Math.round(plan.monthlyPrice * 0.8)
                : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`p-6 sm:p-7 rounded-2xl bg-white dark:bg-obsidian-900 border flex flex-col justify-between space-y-6 ${
                    isCurrent
                      ? 'border-2 border-champagne-500'
                      : 'border-sand-200 dark:border-obsidian-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span className="text-xs font-bold text-champagne-600 dark:text-champagne-400">
                          Plan Actual
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {plan.audience}
                    </p>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                        {formatCOP(finalPrice)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        / mes
                      </span>
                    </div>

                    <ul className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-slate-300">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-champagne-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-colors ${
                      isCurrent
                        ? 'bg-champagne-500 text-slate-950 cursor-default'
                        : 'border border-sand-300 dark:border-obsidian-700 text-slate-800 dark:text-white hover:bg-champagne-500 hover:text-slate-950 hover:border-champagne-500'
                    }`}
                  >
                    {isCurrent ? 'Suscripción Activa' : `Cambiar a ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. INTEGRACIÓN DEDICADA DE WHATSAPP BUSINESS */}
      {activeView === 'whatsapp' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-obsidian-900 to-obsidian-900 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Canal de Notificaciones Directas
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Integración de WhatsApp Business &amp; Plantillas
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Personaliza la plantilla de auto-respuesta para confirmaciones de reservas sin registro. Las variables dinámicas como{' '}
                <span className="font-mono text-champagne-500 font-bold">{'{{cliente_nombre}}'}</span>,{' '}
                <span className="font-mono text-champagne-500 font-bold">{'{{servicio}}'}</span>,{' '}
                <span className="font-mono text-champagne-500 font-bold">{'{{fecha}}'}</span> y{' '}
                <span className="font-mono text-champagne-500 font-bold">{'{{hora}}'}</span> se compilan automáticamente para generar el enlace de confirmación por WhatsApp en tiempo real.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-sand-100 dark:bg-obsidian-850 p-2.5 rounded-xl border border-sand-200 dark:border-obsidian-750">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Estado Integración:
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !waConfig.enabled;
                  setWaConfig((prev) => ({ ...prev, enabled: next }));
                  onShowToast(
                    next
                      ? 'Integración de WhatsApp activada.'
                      : 'Integración de WhatsApp pausada temporalmente.'
                  );
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5 ${
                  waConfig.enabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-300 dark:bg-obsidian-700 text-slate-700 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    waConfig.enabled ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>{waConfig.enabled ? 'Activo' : 'Pausado'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets Ribbon */}
          <div className="p-4 rounded-xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-champagne-500" />
                <span>Cargar Plantilla Prediseñada:</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                Reemplaza la plantilla actual con una estructura optimizada
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {WHATSAPP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 text-left rounded-xl border border-sand-200 dark:border-obsidian-800 bg-sand-50/60 dark:bg-obsidian-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sand-200 dark:bg-obsidian-750 text-slate-600 dark:text-slate-300">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Main 2-Column Workspace: Left Configurator / Right Live Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Template Editor & Dynamic Tokens (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 shadow-sm space-y-4">
                {/* Subtabs for Confirmation vs 24h Reminder */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750">
                  <button
                    type="button"
                    onClick={() => setWaActiveTab('confirmation')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors text-center ${
                      waActiveTab === 'confirmation'
                        ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Confirmación Inmediata (Paso 4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaActiveTab('reminder24h')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors text-center ${
                      waActiveTab === 'reminder24h'
                        ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Recordatorio 24 Horas Antes
                  </button>
                </div>

                {/* Dynamic Variables Chips Toolbar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Variables Dinámicas Disponibles</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        (Haz clic para insertar en el texto)
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750">
                    {AVAILABLE_VARIABLES.map((v) => (
                      <button
                        key={v.tag}
                        type="button"
                        onClick={() => handleInsertVariable(v.tag)}
                        title={`${v.label} - Ejemplo: ${v.example}`}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-obsidian-800 border border-sand-200 dark:border-obsidian-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold transition-colors flex items-center gap-1 group"
                      >
                        <span className="text-emerald-500 group-hover:scale-110 transition-transform">
                          +
                        </span>
                        <span>{v.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="wa-main-template-textarea"
                      className="font-bold text-slate-800 dark:text-slate-200"
                    >
                      {waActiveTab === 'confirmation'
                        ? 'Contenido de la Plantilla de Confirmación'
                        : 'Contenido de la Plantilla de Recordatorio'}
                    </label>
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {waActiveTab === 'confirmation'
                        ? waConfig.confirmationTemplate.length
                        : waConfig.reminder24hTemplate.length}{' '}
                      caracteres
                    </span>
                  </div>

                  <textarea
                    id="wa-main-template-textarea"
                    ref={waTextareaRef}
                    rows={10}
                    value={
                      waActiveTab === 'confirmation'
                        ? waConfig.confirmationTemplate
                        : waConfig.reminder24hTemplate
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (waActiveTab === 'confirmation') {
                        setWaConfig((prev) => ({
                          ...prev,
                          confirmationTemplate: val,
                        }));
                      } else {
                        setWaConfig((prev) => ({
                          ...prev,
                          reminder24hTemplate: val,
                        }));
                      }
                    }}
                    placeholder="Escribe el mensaje usando variables como {{cliente_nombre}}, {{servicio}}, {{fecha}}, {{hora}}..."
                    className="w-full p-3.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500 resize-y"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>💡 Tip de formato WhatsApp:</span>
                    <span className="font-bold">*negrita*</span> ·{' '}
                    <span className="italic">_cursiva_</span> ·{' '}
                    <span className="line-through">~tachado~</span>
                  </p>
                </div>

                {/* Additional Settings Form */}
                <div className="pt-3 border-t border-sand-200 dark:border-obsidian-800 space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="wa-biz-phone-input"
                        className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                      >
                        WhatsApp Oficial del Negocio
                      </label>
                      <input
                        id="wa-biz-phone-input"
                        type="text"
                        value={waConfig.businessPhone}
                        onChange={(e) =>
                          setWaConfig((prev) => ({
                            ...prev,
                            businessPhone: e.target.value,
                          }))
                        }
                        placeholder="+57 312 456 7890"
                        className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2.5 p-2 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waConfig.autoOpenChat}
                          onChange={(e) =>
                            setWaConfig((prev) => ({
                              ...prev,
                              autoOpenChat: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 accent-emerald-500 shrink-0"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          Abrir WhatsApp al confirmar
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save and Reset Bar */}
                <div className="pt-4 border-t border-sand-200 dark:border-obsidian-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWaConfig(DEFAULT_WHATSAPP_CONFIG);
                      onShowToast('Plantilla restablecida a valores por defecto.');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-sand-300 dark:border-obsidian-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restablecer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveWhatsAppConfig}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors flex items-center gap-2 shadow-sm shadow-emerald-950/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Real-Time WhatsApp Phone Simulator & Test Dispatch (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* WhatsApp Smartphone Frame */}
              <div className="rounded-2xl border-2 border-sand-300 dark:border-obsidian-750 bg-[#efeae2] dark:bg-[#0b141a] shadow-xl overflow-hidden text-slate-900 dark:text-slate-100">
                {/* Phone Top Header (WhatsApp brand bar) */}
                <div className="bg-[#075E54] dark:bg-[#1f2c34] text-white px-3.5 py-3 flex items-center justify-between gap-2 border-b border-black/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-champagne-500/20 border border-champagne-400/40 text-champagne-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      <ResilientImage
                        src={BRAND_LOGO_FALLBACK}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs truncate">
                          {activeSampleAppt.venueName}
                        </span>
                        <span className="w-3 h-3 rounded-full bg-emerald-400 text-slate-950 text-[9px] flex items-center justify-center font-bold shrink-0">
                          ✓
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-200 dark:text-emerald-400 truncate">
                        en línea · Empresa verificada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white/80 shrink-0">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                      VISTA PREVIA
                    </span>
                  </div>
                </div>

                {/* Sample Appointment Selector for testing variables */}
                <div className="px-3.5 py-2 bg-black/5 dark:bg-black/30 border-b border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Datos de Prueba:
                  </span>
                  <select
                    aria-label="Cita de muestra"
                    value={waSampleIndex}
                    onChange={(e) => setWaSampleIndex(parseInt(e.target.value, 10))}
                    className="text-[11px] font-semibold bg-white dark:bg-obsidian-850 px-2 py-1 rounded-lg border border-sand-300 dark:border-obsidian-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {samplePreviewAppointments.map((appt, idx) => (
                      <option key={appt.id} value={idx}>
                        {appt.client} · {appt.service}
                      </option>
                    ))}
                  </select>
                </div>

                {/* WhatsApp Chat Body */}
                <div
                  className="p-4 space-y-3 min-h-[300px] max-h-[460px] overflow-y-auto"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at center, rgba(16, 185, 129, 0.03) 0%, transparent 70%)',
                  }}
                >
                  {/* Date badge */}
                  <div className="text-center">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-white/80 dark:bg-obsidian-850/90 text-slate-600 dark:text-slate-400 text-[10px] font-semibold shadow-xs">
                      HOY
                    </span>
                  </div>

                  {/* Outgoing Message Speech Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[88%] rounded-2xl rounded-tr-xs bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-3 shadow-md border border-emerald-600/20 dark:border-emerald-400/10 text-xs font-sans leading-relaxed relative space-y-1">
                      {/* Formatted body */}
                      <div className="text-xs break-words">
                        {renderWhatsAppFormattedText(currentPreviewMessage)}
                      </div>

                      {/* Timestamp & double blue checkmark */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-emerald-200/70 pt-1">
                        <span>10:30 AM</span>
                        <span className="text-sky-500 dark:text-sky-300 font-bold tracking-tighter">
                          ✓✓
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Smartphone Bottom Input Bar (visual touch) */}
                <div className="p-2.5 bg-[#f0f2f5] dark:bg-[#1f2c34] border-t border-black/10 dark:border-white/5 flex items-center gap-2 text-xs">
                  <div className="flex-1 px-3 py-1.5 rounded-full bg-white dark:bg-obsidian-850 text-slate-400 text-[11px] truncate">
                    Mensaje configurado por {activeSampleAppt.venueName}...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Generated Confirmation Link (wa.me) Widget */}
              <div className="p-4 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-500" />
                    <span>Enlace Dinámico de Confirmación Generado</span>
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                    wa.me Direct
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  El sistema compila las variables <span className="font-mono text-champagne-500 font-bold">{'{{cliente_nombre}}'}</span>, <span className="font-mono text-champagne-500 font-bold">{'{{servicio}}'}</span>, <span className="font-mono text-champagne-500 font-bold">{'{{fecha}}'}</span> y <span className="font-mono text-champagne-500 font-bold">{'{{hora}}'}</span> para producir esta URL instantánea:
                </p>

                {/* Live URL Display Box */}
                <div className="p-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-950 border border-sand-200 dark:border-obsidian-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 break-all select-all leading-normal">
                  {generateWhatsAppUrl(waTestPhone, currentPreviewMessage)}
                </div>

                {/* Variable Resolution Map preview */}
                <div className="p-2 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 text-[11px] space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Mapeo en Tiempo Real (Cita de Prueba #{activeSampleAppt.code}):
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500">{'{{cliente_nombre}}'} → </span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeSampleAppt.client}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{'{{servicio}}'} → </span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeSampleAppt.service}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{'{{fecha}}'} → </span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeSampleAppt.dateKey}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{'{{hora}}'} → </span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{activeSampleAppt.time}</span>
                    </div>
                  </div>
                </div>

                {/* Actions for Generated Confirmation Link */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateWhatsAppUrl(
                        waTestPhone,
                        currentPreviewMessage
                      );
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(url).catch(() => {});
                      }
                      onShowToast('¡Enlace de confirmación de WhatsApp copiado!');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 dark:bg-obsidian-800 hover:bg-slate-800 dark:hover:bg-obsidian-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-sand-300 dark:border-obsidian-700"
                  >
                    <Copy className="w-3.5 h-3.5 text-champagne-400" />
                    <span>Copiar Enlace (URL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = generateWhatsAppUrl(
                        waTestPhone,
                        currentPreviewMessage
                      );
                      window.open(url, '_blank', 'noopener,noreferrer');
                      onShowToast('Abriendo enlace de confirmación en WhatsApp Web...');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Enlace Web</span>
                  </button>
                </div>
              </div>

              {/* Live Test Dispatch Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Prueba de Envío Rápido a Cliente</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Teléfono Destino
                  </span>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="wa-test-phone-input"
                    className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Número de WhatsApp para la prueba:
                  </label>
                  <input
                    id="wa-test-phone-input"
                    type="text"
                    value={waTestPhone}
                    onChange={(e) => setWaTestPhone(e.target.value)}
                    placeholder="+57 312 456 7890"
                    className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = generateWhatsAppUrl(
                        waTestPhone,
                        currentPreviewMessage
                      );
                      window.open(url, '_blank', 'noopener,noreferrer');
                      onShowToast('Abriendo WhatsApp Web con el mensaje compilado...');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enviar a WhatsApp</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard
                          .writeText(currentPreviewMessage)
                          .catch(() => {});
                      }
                      onShowToast('Texto del mensaje copiado al portapapeles.');
                    }}
                    className="py-2 px-3 rounded-xl border border-sand-300 dark:border-obsidian-700 bg-sand-50 dark:bg-obsidian-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. RECORDATORIOS AUTOMÁTICOS SMS & WHATSAPP */}
      {activeView === 'notifications' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-obsidian-900 via-obsidian-900 to-obsidian-850 border border-champagne-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-champagne-500/20 text-champagne-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-champagne-400">
                  Módulo de Notificaciones SMS &amp; Alertas
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Gestor de Recordatorios Automáticos por SMS
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Configura la pasarela SMS (Twilio, AWS SNS o Simulación API Gateway) y edita plantillas dinámicas con variables en tiempo real para reducir el Ausentismo (No-Show).
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto bg-sand-100 dark:bg-obsidian-850 p-2.5 rounded-xl border border-sand-200 dark:border-obsidian-750">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gateway SMS:
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !localSmsConfig.enabled;
                  const updated = { ...localSmsConfig, enabled: next };
                  setLocalSmsConfig(updated);
                  if (onSaveSmsConfig) onSaveSmsConfig(updated);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5 ${
                  localSmsConfig.enabled
                    ? 'bg-champagne-500 text-slate-950'
                    : 'bg-slate-300 dark:bg-obsidian-700 text-slate-700 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    localSmsConfig.enabled ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>{localSmsConfig.enabled ? 'SMS Habilitado' : 'Pausado'}</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column SMS Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Settings & Template Editor (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-sand-200 dark:border-obsidian-800 pb-3">
                  <Smartphone className="w-4 h-4 text-champagne-500" />
                  <span>Configuración del Proveedor SMS &amp; Parámetros</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Proveedor Gateway SMS
                    </label>
                    <select
                      aria-label="Proveedor Gateway SMS"
                      value={localSmsConfig.gatewayProvider}
                      onChange={(e) =>
                        setLocalSmsConfig((prev) => ({
                          ...prev,
                          gatewayProvider: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                    >
                      <option value="twilio">Twilio Messaging API (Global)</option>
                      <option value="aws_sns">AWS SNS SMS (High Volume)</option>
                      <option value="simulated">Simulador Integrado Glow (Demostración)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Encabezado del Remitente (Sender Header)
                    </label>
                    <input
                      type="text"
                      value={localSmsConfig.senderHeader}
                      onChange={(e) =>
                        setLocalSmsConfig((prev) => ({
                          ...prev,
                          senderHeader: e.target.value,
                        }))
                      }
                      placeholder="GlowCitas"
                      className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-champagne-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-sand-200 dark:border-obsidian-800 pt-3 text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    Reglas de Disparo Automático
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSmsConfig.reminder24hEnabled}
                        onChange={(e) =>
                          setLocalSmsConfig((prev) => ({
                            ...prev,
                            reminder24hEnabled: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-champagne-500 shrink-0"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        SMS 24 horas antes de la cita
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSmsConfig.reminder2hEnabled}
                        onChange={(e) =>
                          setLocalSmsConfig((prev) => ({
                            ...prev,
                            reminder2hEnabled: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-champagne-500 shrink-0"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        SMS 2 horas antes (Recordatorio exprés)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Editor de Plantilla SMS */}
                <div className="space-y-3 border-t border-sand-200 dark:border-obsidian-800 pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Editor de Plantilla SMS
                    </label>
                    <span className="font-mono text-[11px] text-champagne-400 font-bold">
                      {localSmsConfig.smsTemplate.length} / 160 caracteres ·{' '}
                      {Math.ceil(localSmsConfig.smsTemplate.length / 160) || 1} segmento SMS
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750">
                    {[
                      { tag: '{{cliente_nombre}}', label: '+ Cliente' },
                      { tag: '{{servicio}}', label: '+ Servicio' },
                      { tag: '{{fecha}}', label: '+ Fecha' },
                      { tag: '{{hora}}', label: '+ Hora' },
                      { tag: '{{codigo}}', label: '+ Código' },
                      { tag: '{{local}}', label: '+ Local' },
                    ].map((btn) => (
                      <button
                        key={btn.tag}
                        type="button"
                        onClick={() => {
                          const textarea = smsTextareaRef.current;
                          const cur = localSmsConfig.smsTemplate;
                          if (!textarea) {
                            setLocalSmsConfig((prev) => ({
                              ...prev,
                              smsTemplate: cur + ' ' + btn.tag,
                            }));
                            return;
                          }
                          const start = textarea.selectionStart ?? cur.length;
                          const end = textarea.selectionEnd ?? cur.length;
                          const next =
                            cur.substring(0, start) +
                            btn.tag +
                            cur.substring(end);
                          setLocalSmsConfig((prev) => ({
                            ...prev,
                            smsTemplate: next,
                          }));
                        }}
                        className="px-2 py-1 rounded bg-white dark:bg-obsidian-800 border border-sand-200 dark:border-obsidian-700 hover:border-champagne-500 font-mono text-[11px] text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={smsTextareaRef}
                    rows={4}
                    value={localSmsConfig.smsTemplate}
                    onChange={(e) =>
                      setLocalSmsConfig((prev) => ({
                        ...prev,
                        smsTemplate: e.target.value,
                      }))
                    }
                    placeholder="Recordatorio: {{cliente_nombre}}, tu cita de {{servicio}} en {{local}} es el {{fecha}} a las {{hora}}. Código: {{codigo}}."
                    className="w-full p-3 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-champagne-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-sand-200 dark:border-obsidian-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSaveSmsConfig) onSaveSmsConfig(localSmsConfig);
                      onShowToast('Simulación de envío SMS realizada con éxito.');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-champagne-500 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-champagne-400" />
                    <span>Probar Envío SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSaveSmsConfig) onSaveSmsConfig(localSmsConfig);
                    }}
                    className="px-5 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Plantilla SMS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Smartphone SMS Live Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="rounded-3xl border-4 border-slate-800 dark:border-obsidian-750 bg-slate-950 shadow-2xl p-4 text-white space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-mono">Mensajes SMS</span>
                  <span className="font-bold text-champagne-400">
                    Remitente: {localSmsConfig.senderHeader || 'GlowCitas'}
                  </span>
                </div>

                <div className="py-4 space-y-3 min-h-[220px]">
                  <div className="p-3.5 rounded-2xl bg-slate-800 text-xs space-y-1 max-w-[90%] font-sans leading-relaxed border border-slate-700 shadow-md">
                    <p className="text-[10px] text-slate-400 font-mono font-bold">
                      SMS · Ahora
                    </p>
                    <p className="text-slate-100">
                      {localSmsConfig.smsTemplate
                        .replace(/\{\{cliente_nombre\}\}/g, 'Carlos Mendoza')
                        .replace(/\{\{servicio\}\}/g, 'Corte Fade Pro & Asesoría')
                        .replace(/\{\{fecha\}\}/g, 'Mar, 10 Nov')
                        .replace(/\{\{hora\}\}/g, '10:00 AM')
                        .replace(/\{\{codigo\}\}/g, 'GLW-4091')
                        .replace(/\{\{local\}\}/g, currentVenue?.name || 'Glow Studio')}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center font-mono">
                  Vista previa interactiva de pantalla SMS para clientes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. PANEL DE ADMINISTRACIÓN DE CÓDIGOS QR */}
      {activeView === 'qr-code' && (
        <div className="w-full max-w-full space-y-5 overflow-hidden">

          {/* GRID RESPONSIVE: FORMULARIO Y TARJETA DEL CÓDIGO QR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full max-w-full items-start">

            {/* 1. FORMULARIO COMPACTO: REGISTRAR NEGOCIO DE CLIENTE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-4 shadow-sm w-full min-w-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-champagne-500 shrink-0" />
                  <span>Registrar Negocio de Cliente</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ingresa los datos para generar automáticamente su enlace y código QR único.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newBizName.trim()) return;
                  const newVenueId = `venue_${Date.now()}`;
                  const cleanName = newBizName.trim();
                  const newVenueObj: Venue = {
                    id: newVenueId,
                    name: cleanName,
                    category: newBizCategory,
                    categoryLabel: CATEGORY_LABELS[newBizCategory] || 'Negocio',
                    subCategory: SUBCATEGORY_LABELS[newBizCategory]?.[0] || 'Servicios',
                    rating: 5.0,
                    location: newBizAddress.trim() || 'Colombia',
                    priceLevel: '$$',
                    image: newBizImage || BRAND_LOGO_FALLBACK,
                    phone: newBizPhone.trim() || undefined,
                    address: newBizAddress.trim() || undefined,
                    glbUrl: DEFAULT_GLOBAL_GLB,
                  };
                  if (onUpdateVenue) {
                    onUpdateVenue(newVenueObj);
                  }
                  setSelectedQrVenueId(newVenueId);
                  setNewBizName('');
                  setNewBizPhone('');
                  setNewBizAddress('');
                  setNewBizImage('');
                  onShowToast(`¡Negocio "${newVenueObj.name}" registrado! Código QR generado con éxito.`);
                }}
                className="space-y-3 pt-1 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      required
                      value={newBizName}
                      onChange={(e) => setNewBizName(e.target.value)}
                      placeholder="Ej. Barbería Central / La Fogata"
                      className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-champagne-500 min-w-0"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
                      Categoría
                    </label>
                    <select
                      value={newBizCategory}
                      onChange={(e) => setNewBizCategory(e.target.value as ServiceCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-champagne-500 min-w-0"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
                      Teléfono / WhatsApp (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newBizPhone}
                      onChange={(e) => setNewBizPhone(e.target.value)}
                      placeholder="+57 312 456 7890"
                      className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-champagne-500 min-w-0"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 truncate">
                      Dirección / Red Social (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newBizAddress}
                      onChange={(e) => setNewBizAddress(e.target.value)}
                      placeholder="Calle 10 #36-24 / @negocio"
                      className="w-full px-3 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-champagne-500 min-w-0"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-sand-200/50 dark:border-obsidian-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (loadEvent) => {
                          if (typeof loadEvent.target?.result === 'string') {
                            setNewBizImage(loadEvent.target.result);
                            onShowToast('Logotipo adjuntado.');
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                      id="new-biz-logo-upload"
                    />
                    <label
                      htmlFor="new-biz-logo-upload"
                      className="px-3 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 bg-sand-50 dark:bg-obsidian-850 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-champagne-500 flex items-center gap-1.5 font-semibold text-[11px] shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-champagne-500" />
                      <span>Subir Logotipo</span>
                    </label>
                    {newBizImage && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-champagne-500/50 shrink-0 bg-white">
                        <img src={newBizImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-champagne-500/20 transition-all shrink-0"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generar QR</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. COMPONENTE QRCODEGENERATOR DEL NEGOCIO ACTIVO */}
            {activeQrVenue ? (
              <QRCodeGenerator
                venue={activeQrVenue}
                allVenues={venues}
                onSelectVenue={(id) => setSelectedQrVenueId(id)}
                onShowToast={onShowToast}
              />
            ) : (
              <div className="p-6 rounded-2xl bg-sand-50 dark:bg-obsidian-900 border border-dashed border-sand-300 dark:border-obsidian-800 flex flex-col items-center justify-center text-center min-h-[300px]">
                <QrCode className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Sin negocio seleccionado</p>
                <p className="text-xs text-slate-500 mt-0.5">Registra un nuevo negocio para generar su código QR automático.</p>
              </div>
            )}
          </div>


          {/* 3. TABLA Y LISTA DE NEGOCIOS CREADOS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-3 shadow-sm w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-champagne-500 shrink-0" />
                <span>Negocios Registrados ({venues.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-sand-200 dark:border-obsidian-800 text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-2 px-2.5">Negocio</th>
                    <th className="py-2 px-2.5">Categoría</th>
                    <th className="py-2 px-2.5">Contacto</th>
                    <th className="py-2 px-2.5">Enlace Único</th>
                    <th className="py-2 px-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 dark:divide-obsidian-800">
                  {venues.map((v) => {
                    const isSelected = v.id === selectedQrVenueId;
                    return (
                      <tr 
                        key={`biz-${v.id}`} 
                        className={`transition-colors ${
                          isSelected 
                            ? 'bg-champagne-500/5 dark:bg-champagne-500/10' 
                            : 'hover:bg-sand-50 dark:hover:bg-obsidian-850/50'
                        }`}
                      >
                        <td className="py-2.5 px-2.5">
                          <span className="font-bold text-slate-900 dark:text-white block">{v.name}</span>
                          {isSelected && (
                            <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-400">
                              Activo
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-sand-100 dark:bg-obsidian-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {v.categoryLabel || v.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-500 dark:text-slate-400">
                          {v.phone || v.address || '—'}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              const url = `${window.location.origin}/ver.html?negocio=${encodeURIComponent(v.name)}`;
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(url);
                                onShowToast(`Enlace WebAR copiado para ${v.name}`);
                              }
                            }}
                            className="font-mono text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
                            title="Haz clic para copiar enlace WebAR"
                          >
                            <span className="truncate max-w-[130px]">/ver.html?negocio={encodeURIComponent(v.name)}</span>
                            <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0" />
                          </button>
                        </td>
                        <td className="py-2.5 px-2.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQrVenueId(v.id);
                              onShowToast(`Mostrando código QR de ${v.name}`);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold text-[10px] uppercase transition-colors"
                          >
                            Ver QR
                          </button>
                          <a
                            href={`${window.location.origin}/ver.html?negocio=${encodeURIComponent(v.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-[10px] uppercase transition-colors inline-flex items-center gap-1"
                            title="Abrir página WebAR del cliente en pestaña nueva"
                          >
                            <span>Abrir AR</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL CREAR / EDITAR SERVICIO */}
      {isSvcModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="svc-crud-modal-title"
        >
          <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-lg w-full p-6 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3.5">
              <h3
                id="svc-crud-modal-title"
                className="font-bold text-base text-slate-900 dark:text-white"
              >
                {editingSvcId ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSvcModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleServiceFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label
                  htmlFor="svc-form-name"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nombre del Servicio *
                </label>
                <input
                  id="svc-form-name"
                  type="text"
                  required
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                  placeholder="Ej. Corte Fade Signature + Ritual Barba"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="svc-form-cat"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Categoría *
                  </label>
                  <select
                    id="svc-form-cat"
                    value={svcCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as ServiceCategory;
                      setSvcCategory(newCat);
                      setSvcSubCategory(SUBCATEGORY_LABELS[newCat]?.[0] || '');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="svc-form-subcat"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Subcategoría *
                  </label>
                  <select
                    id="svc-form-subcat"
                    value={svcSubCategory}
                    onChange={(e) => setSvcSubCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    {(SUBCATEGORY_LABELS[svcCategory] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="svc-form-price"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Precio en COP *
                    </label>
                    <span className="font-mono font-bold text-champagne-400 text-xs">
                      {formatCOP(parseInt(svcPrice, 10) || 0)}
                    </span>
                  </div>
                  <input
                    id="svc-form-price"
                    type="number"
                    required
                    min={5000}
                    step={1000}
                    value={svcPrice}
                    onChange={(e) => setSvcPrice(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-champagne-500"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSvcPrice((prev) =>
                          String(Math.max(5000, (parseInt(prev, 10) || 30000) - 5000))
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-sand-200 dark:bg-obsidian-800 text-[10px] font-mono font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      -5k
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSvcPrice((prev) =>
                          String((parseInt(prev, 10) || 30000) + 5000)
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-sand-200 dark:bg-obsidian-800 text-[10px] font-mono font-bold text-champagne-400 hover:text-champagne-300 transition-colors"
                    >
                      +5k
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSvcPrice((prev) =>
                          String((parseInt(prev, 10) || 30000) + 10000)
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-sand-200 dark:bg-obsidian-800 text-[10px] font-mono font-bold text-champagne-400 hover:text-champagne-300 transition-colors"
                    >
                      +10k
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSvcPrice((prev) =>
                          String((parseInt(prev, 10) || 30000) + 20000)
                        )
                      }
                      className="px-2 py-0.5 rounded-md bg-sand-200 dark:bg-obsidian-800 text-[10px] font-mono font-bold text-champagne-400 hover:text-champagne-300 transition-colors"
                    >
                      +20k
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="svc-form-duration"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Duración Estimada
                  </label>
                  <select
                    id="svc-form-duration"
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    <option value="30 min">30 min</option>
                    <option value="45 min">45 min</option>
                    <option value="50 min">50 min</option>
                    <option value="60 min">60 min (1 hora)</option>
                    <option value="75 min">75 min</option>
                    <option value="90 min">90 min</option>
                    <option value="120 min">120 min (2 horas)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="svc-form-status"
                    className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Disponibilidad
                  </label>
                  <select
                    id="svc-form-status"
                    value={svcIsActive ? 'true' : 'false'}
                    onChange={(e) => setSvcIsActive(e.target.value === 'true')}
                    className="w-full px-3 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
                  >
                    <option value="true">Activo para reservas</option>
                    <option value="false">Pausado / Oculto</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="svc-form-desc"
                  className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Descripción Breve
                </label>
                <textarea
                  id="svc-form-desc"
                  rows={2}
                  value={svcDesc}
                  onChange={(e) => setSvcDesc(e.target.value)}
                  placeholder="Detalle del procedimiento o beneficios incluidos..."
                  className="w-full px-3.5 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sand-200 dark:border-obsidian-800">
                <button
                  type="button"
                  onClick={() => setIsSvcModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
