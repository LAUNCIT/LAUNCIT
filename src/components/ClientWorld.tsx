import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Map } from '@vis.gl/react-google-maps';
import {
  CalendarCheck,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  HelpCircle,
  ListChecks,
  MapPin,
  Scissors,
  HeartPulse,
  Trophy,
  Home,
  Waves,
  PartyPopper,
  Mic,
  Car,
  Utensils,
  Search,
  Star,
  Ticket,
  User,
  X,
  XCircle,
  CreditCard,
  Clock,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import {
  Appointment,
  ClientSubView,
  Review,
  ServiceCategory,
  ServiceItem,
  Venue,
  WhatsAppConfig,
} from '../types';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS } from '../data/initialData';
import { formatCOP } from '../utils/scheduleUtils';
import {
  compileWhatsAppMessage,
  generateWhatsAppUrl,
} from '../utils/whatsappUtils';
import { ResilientImage } from './ResilientImage';
import { VenuePhotoGalleryModal } from './VenuePhotoGalleryModal';
import { VenueMapModal } from './VenueMapModal';

interface ClientWorldProps {
  activeView: ClientSubView;
  venues: Venue[];
  services: ServiceItem[];
  appointments: Appointment[];
  reviews?: Review[];
  lookupPhone: string;
  whatsAppConfig?: WhatsAppConfig;
  onLookupPhoneChange: (phone: string) => void;
  onOpenBooking: (venue: Venue) => void;
  onCancelAppointment: (id: string) => void;
  onAddReview?: (review: Omit<Review, 'id' | 'date'>) => void;
  onShowToast: (msg: string) => void;
}

const VenueCardPhotoCarousel: React.FC<{
  venue: Venue;
  onOpenGallery: () => void;
}> = ({ venue, onOpenGallery }) => {
  const photos = useMemo(() => {
    const list = venue.photos && venue.photos.length > 0 ? venue.photos : [venue.image];
    return list.slice(0, 5); // Up to 5 photos max
  }, [venue.photos, venue.image]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="aspect-[2.2/1] sm:aspect-[4/3] w-full overflow-hidden bg-obsidian-950 relative group">
      <ResilientImage
        src={photos[currentIndex] || venue.image}
        alt={`${venue.name} foto ${currentIndex + 1}`}
        fallbackLabel={venue.name}
        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
      />

      {/* Prev / Next Buttons */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-slate-950 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-slate-950/50 backdrop-blur-xs px-2 py-1 rounded-full">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === idx
                    ? 'bg-champagne-400 w-3'
                    : 'bg-white/50 hover:bg-white w-1.5'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Badge button to open full gallery */}
      <button
        type="button"
        onClick={onOpenGallery}
        className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-950 backdrop-blur-sm border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md z-10"
        title="Ver fotos publicadas del local"
      >
        <Camera className="w-3.5 h-3.5 text-champagne-400" />
        <span>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
      </button>
    </div>
  );
};

export const ClientWorld: React.FC<ClientWorldProps> = ({
  activeView,
  venues,
  services,
  appointments,
  reviews = [],
  lookupPhone,
  whatsAppConfig,
  onLookupPhoneChange,
  onOpenBooking,
  onCancelAppointment,
  onAddReview,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | ServiceCategory
  >('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [exploreFaqIndex, setExploreFaqIndex] = useState<number | null>(0);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [galleryVenue, setGalleryVenue] = useState<Venue | null>(null);
  const [mapModalVenue, setMapModalVenue] = useState<Venue | null>(null);
  const [reviewsModalVenue, setReviewsModalVenue] = useState<Venue | null>(null);
  const [newReviewModalVenue, setNewReviewModalVenue] = useState<{
    venue: Venue;
    serviceName?: string;
  } | null>(null);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewClientName, setNewReviewClientName] = useState<string>('');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sports & Synthetic Courts Quick Filters State
  const [sportPriceFilter, setSportPriceFilter] = useState<'all' | '$$' | '$$$'>('all');
  const [sportLocationFilter, setSportLocationFilter] = useState<string>('all');
  const [nightLightingOnly, setNightLightingOnly] = useState<boolean>(false);
  
  // Map Filters
  const [mapFilter, setMapFilter] = useState<'all' | 'deportes' | 'alojamiento' | 'estetica'>('all');

  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter((v) => {
      const matchCat =
        selectedCategory === 'all' || v.category === selectedCategory;
      if (!matchCat) return false;

      const matchSubCat = 
        selectedSubCategory === 'all' || v.subCategory === selectedSubCategory;
      if (!matchSubCat) return false;

      // Sports specific filters
      if (selectedCategory === 'deportes') {
        if (sportPriceFilter !== 'all' && v.priceLevel !== sportPriceFilter) {
          return false;
        }
        if (
          sportLocationFilter !== 'all' &&
          !v.location.toLowerCase().includes(sportLocationFilter.toLowerCase())
        ) {
          return false;
        }
        if (nightLightingOnly) {
          const text = (v.description || '' + v.name).toLowerCase();
          if (
            !text.includes('iluminación') &&
            !text.includes('led') &&
            !text.includes('nocturna') &&
            v.id !== 'v_sport_1'
          ) {
            return false;
          }
        }
      }

      if (!q) return true;
      const venueServices = services.filter(
        (s) => s.isActive && s.category === v.category
      );
      return (
        v.name.toLowerCase().includes(q) ||
        v.categoryLabel.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(q)) ||
        venueServices.some((s) => s.name.toLowerCase().includes(q))
      );
    });
  }, [venues, services, selectedCategory, selectedSubCategory, searchQuery, sportPriceFilter, sportLocationFilter, nightLightingOnly]);

  const matchedAppointments = useMemo(() => {
    const cleanTarget = (lookupPhone || '').replace(/[\s+\-()]/g, '').toLowerCase();
    if (!cleanTarget) return [];
    return appointments.filter((a) => {
      const cleanApptPhone = (a.phone || '').replace(/[\s+\-()]/g, '').toLowerCase();
      const codeMatches = (a.code || '').toLowerCase() === lookupPhone.trim().toLowerCase();
      return (
        cleanApptPhone.includes(cleanTarget) ||
        cleanTarget.includes(cleanApptPhone) ||
        codeMatches
      );
    });
  }, [appointments, lookupPhone]);

  const categoryTabs: Array<{ id: 'all' | ServiceCategory; label: string; icon: React.ReactNode }> = [
    { id: 'belleza', label: 'Belleza', icon: <Scissors className="w-5 h-5" /> },
    { id: 'bienestar', label: 'Bienestar', icon: <HeartPulse className="w-5 h-5" /> },
    { id: 'deportes', label: 'Deportes', icon: <Trophy className="w-5 h-5" /> },
    { id: 'lugares', label: 'Lugares', icon: <Home className="w-5 h-5" /> },
    { id: 'vehiculos', label: 'Vehículos', icon: <Car className="w-5 h-5" /> },
    { id: 'restaurantes', label: 'Restaurantes', icon: <Utensils className="w-5 h-5" /> },
  ];

  const faqs = [
    {
      id: 'faq-pagos',
      q: '¿Cuáles son los métodos de pago aceptados?',
      a: 'Pagas directamente en el establecimiento al momento de tu cita o servicio. La gran mayoría de comercios aceptan efectivo, transferencias digitales inmediatas (Nequi, Daviplata, Dale!), tarjetas débito/crédito físicas y códigos QR / PSE. Para servicios con tarifa alta o reservas especiales (como canchas deportivas completas o eventos privados), el establecimiento puede solicitar un anticipo o seña que coordinarás directamente por WhatsApp.',
      category: 'pagos',
      categoryLabel: 'Métodos de Pago',
      highlight: true,
    },
    {
      id: 'faq-cancelacion',
      q: '¿Cuál es la política de cancelación o modificación de citas?',
      a: '¡Total libertad y sin penalizaciones! Puedes consultar o cancelar tu reserva en cualquier momento ingresando tu número o código de cita (ej. GLW-4091) en la pestaña "Consultar mi Reserva". Para reprogramar o en caso de imprevistos, te sugerimos avisar con al menos 2 a 4 horas de anticipación para que el comercio pueda reasignar el horario a otro cliente.',
      category: 'cancelacion',
      categoryLabel: 'Políticas de Cancelación',
      highlight: true,
    },
    {
      id: 'faq-registro',
      q: '¿Debo crear una cuenta o registrar una contraseña para reservar?',
      a: 'No. En Launcit reservas de forma ágil, libre y sin contraseñas. Solo eliges el servicio, fecha y hora disponible, e ingresas tu nombre y WhatsApp en el paso final para recibir tu confirmación inmediata.',
      category: 'reserva',
      categoryLabel: 'Reserva Directa',
    },
    {
      id: 'faq-notificaciones',
      q: '¿Cómo recibo la confirmación y recordatorio de mi cita?',
      a: 'Al completar la reserva, el sistema genera al instante tu código único (ej. GLW-4091) con un comprobante oficial listo para compartir o verificar en WhatsApp. El establecimiento lo recibe en tiempo real en su panel de administración.',
      category: 'reserva',
      categoryLabel: 'Confirmación & WhatsApp',
    },
    {
      id: 'faq-disponibilidad',
      q: '¿Por qué algunos días u horarios aparecen cerrados o bloqueados?',
      a: 'Cada establecimiento administra su calendario en vivo. Si un especialista ya tiene turno ocupado, si el local cierra por descanso dominical/festivo o si hay un bloqueo temporal de instalaciones, el sistema inhabilita esos horarios automáticamente para evitar colisiones.',
      category: 'horarios',
      categoryLabel: 'Disponibilidad en Vivo',
    },
    {
      id: 'faq-precios',
      q: '¿Los precios mostrados en COP son finales?',
      a: 'Sí. Todos los precios en pesos colombianos (COP) son 100% transparentes y corresponden al tarifario oficial vigente fijado por el establecimiento, sin comisiones sorpresa ni cargos ocultos.',
      category: 'pagos',
      categoryLabel: 'Tarifas Transparentes',
    },
  ];

  if (activeView === 'my-booking') {
    return (
      <section className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Consultar mi Reserva
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ingresa tu número de WhatsApp o código de reserva para verificar tu cita sin iniciar sesión.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="client-lookup-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Número de WhatsApp o Código de Cita
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="client-lookup-input"
                  type="text"
                  value={lookupPhone}
                  onChange={(e) => onLookupPhoneChange(e.target.value)}
                  placeholder="Ej. +57 312 456 7890 o GLW-4091"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
                />
              </div>
              <button
                type="button"
                onClick={() => onLookupPhoneChange('+57 312 456 7890')}
                className="px-4 py-2.5 rounded-xl border border-sand-200 dark:border-obsidian-750 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-champagne-500 transition-colors whitespace-nowrap shrink-0"
              >
                Usar Demo (+57 312...)
              </button>
            </div>
          </div>

          <div className="divide-y divide-sand-200 dark:divide-obsidian-800">
            {matchedAppointments.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Ticket className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No se encontraron reservas asociadas a{' '}
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {lookupPhone || 'esta búsqueda'}
                  </span>
                  .
                </p>
              </div>
            ) : (
              matchedAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-bold text-champagne-600 dark:text-champagne-400 tabular-nums">
                        {appt.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{appt.venueName}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          appt.status === 'Cancelada'
                            ? 'text-rose-500'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {appt.service}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {appt.dateKey} · {appt.time} · Con {appt.pro} ·{' '}
                      {formatCOP(appt.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const template =
                          whatsAppConfig?.confirmationTemplate ||
                          `✨ *Reserva {establecimiento}* ✨\nCódigo: #{codigo}\nServicio: {servicio} con {profesional}\nFecha: {fecha} a las {hora}\nTotal: {precio}`;
                        const msg = compileWhatsAppMessage(template, appt);
                        navigator.clipboard?.writeText(msg).catch(() => {});
                        onShowToast('Comprobante oficial copiado para WhatsApp');
                      }}
                      className="px-3 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-champagne-500 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Ticket</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetVenue =
                          venues.find((v) => v.name === appt.venueName) ||
                          venues[0];
                        setNewReviewModalVenue({
                          venue: targetVenue,
                          serviceName: appt.service,
                        });
                        setNewReviewClientName(appt.client || '');
                        setNewReviewRating(5);
                        setNewReviewComment('');
                      }}
                      className="px-3 py-2 rounded-xl bg-champagne-500/15 text-champagne-700 dark:text-champagne-400 hover:bg-champagne-500 hover:text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Star className="w-3.5 h-3.5 fill-champagne-500 text-champagne-500" />
                      <span>Calificar Cita</span>
                    </button>

                    {appt.status !== 'Cancelada' &&
                      (confirmCancelId === appt.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            onCancelAppointment(appt.id);
                            setConfirmCancelId(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold whitespace-nowrap"
                        >
                          Confirmar Cancelación
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(appt.id)}
                          className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  if (activeView === 'faq') {
    const displayedFaqs =
      faqCategoryFilter === 'all'
        ? faqs
        : faqs.filter((f) => f.category === faqCategoryFilter);

    const faqFilters = [
      { id: 'all', label: 'Todas' },
      { id: 'pagos', label: 'Métodos de Pago' },
      { id: 'cancelacion', label: 'Cancelación & Reprogramación' },
      { id: 'reserva', label: 'Reservas' },
      { id: 'horarios', label: 'Horarios' },
    ];

    return (
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-champagne-500/10 border border-champagne-500/20 text-champagne-600 dark:text-champagne-400 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Centro de Ayuda al Cliente</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Resuelve todas tus dudas sobre métodos de pago aceptados, políticas de cancelación sin penalización y reservas directas sin registro.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {faqFilters.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFaqCategoryFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                faqCategoryFilter === tab.id
                  ? 'bg-slate-900 text-white border-transparent dark:bg-champagne-500 dark:text-slate-950'
                  : 'bg-white dark:bg-obsidian-900 border-sand-200 dark:border-obsidian-800 text-slate-600 dark:text-slate-400 hover:border-champagne-500/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 divide-y divide-sand-200 dark:divide-obsidian-800 overflow-hidden shadow-xs">
          {displayedFaqs.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={item.id || `faq-${idx}`} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left hover:bg-sand-50 dark:hover:bg-obsidian-850/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 p-2 rounded-xl bg-sand-100 dark:bg-obsidian-800 text-slate-600 dark:text-champagne-400 shrink-0">
                      {item.category === 'pagos' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : item.category === 'cancelacion' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : item.category === 'horarios' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </span>
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sand-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300">
                        {item.categoryLabel}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.q}
                      </h4>
                    </div>
                  </div>
                  <div className="shrink-0 pt-1">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-champagne-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 pl-14 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-sand-100 dark:border-obsidian-850 bg-sand-50/50 dark:bg-obsidian-950/30">
                    <p className="pt-2">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-sand-100 dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-champagne-500" />
              <span>¿Tienes una consulta específica sobre tu reserva?</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Usa la pestaña &quot;Consultar mi Reserva&quot; con tu número de WhatsApp para ver detalles o cancelar sin complicaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onLookupPhoneChange('+57 312 456 7890')}
            className="px-4 py-2 rounded-xl bg-champagne-500 text-slate-950 text-xs font-bold hover:bg-champagne-400 transition-colors whitespace-nowrap shrink-0"
          >
            Ver Mi Cita
          </button>
        </div>
      </section>
    );
  }

  if (activeView === 'favorites') {
    return (
      <section className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sand-100 dark:bg-obsidian-850 flex items-center justify-center mx-auto border border-sand-200 dark:border-obsidian-800">
          <Star className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mis Favoritos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aquí aparecerán los establecimientos que marques con una estrella para acceso rápido.
          </p>
        </div>
      </section>
    );
  }

  if (activeView === 'profile') {
    return (
      <section className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-sand-100 dark:bg-obsidian-850 flex items-center justify-center mx-auto border border-sand-200 dark:border-obsidian-800">
          <User className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mi Perfil</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Como cliente invitado, no necesitas una cuenta. <br/> Tus reservas se vinculan directamente a tu número de WhatsApp.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Minimalist Grid Hero (As per new design) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Launci</h2>
          <div className="w-9 h-9 rounded-full bg-sand-100 dark:bg-obsidian-850 flex items-center justify-center border border-sand-200 dark:border-obsidian-800">
            <User className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        {/* Search Input Card */}
        <div className="p-6 rounded-3xl bg-sand-100 dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 space-y-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">¿Qué quieres reservar hoy?</h3>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca servicios, lugares y experiencias..."
              className="w-full px-0 py-1 bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white px-1">Explora categorías</h3>
          <div className="grid grid-cols-3 gap-3">
            {categoryTabs.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory('all');
                      setSelectedSubCategory('all');
                    } else {
                      setSelectedCategory(cat.id);
                      setSelectedSubCategory('all');
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white border-transparent dark:bg-champagne-500 dark:text-slate-950'
                      : 'bg-sand-100 dark:bg-obsidian-850 border-sand-200 dark:border-obsidian-800 text-slate-600 dark:text-slate-300 hover:border-champagne-500/50'
                  }`}
                >
                  <div className="mb-2">
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subcategory Filter (Interactive Segmented Control) */}
          {selectedCategory !== 'all' && SUBCATEGORY_LABELS[selectedCategory] && (
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 px-1">
              <button
                onClick={() => setSelectedSubCategory('all')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap border ${
                  selectedSubCategory === 'all'
                    ? 'bg-slate-900 text-white border-transparent dark:bg-champagne-500 dark:text-slate-950'
                    : 'bg-sand-100 dark:bg-obsidian-850 border-sand-200 dark:border-obsidian-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                Todos
              </button>
              {SUBCATEGORY_LABELS[selectedCategory].map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap border ${
                    selectedSubCategory === sub
                      ? 'bg-slate-900 text-white border-transparent dark:bg-champagne-500 dark:text-slate-950'
                      : 'bg-sand-100 dark:bg-obsidian-850 border-sand-200 dark:border-obsidian-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sports Filters (Contextual) */}
        {selectedCategory === 'deportes' && (
          <div className="flex flex-wrap gap-2 animate-fadeIn pt-2 px-1">
            <select 
              value={sportPriceFilter} 
              onChange={(e) => setSportPriceFilter(e.target.value as any)} 
              className="px-2.5 py-1.5 rounded-lg bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-[10px] font-bold outline-none"
            >
              <option value="all">Presupuesto: Todos</option>
              <option value="$$">Económico ($$)</option>
              <option value="$$$">Premium ($$$)</option>
            </select>
            <select 
              value={sportLocationFilter} 
              onChange={(e) => setSportLocationFilter(e.target.value)} 
              className="px-2.5 py-1.5 rounded-lg bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-[10px] font-bold outline-none"
            >
              <option value="all">Ubicación: Todas</option>
              <option value="El Poblado">El Poblado</option>
            </select>
            <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-[10px] font-bold cursor-pointer hover:border-champagne-500 transition-colors">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-champagne-500 focus:ring-champagne-500"
                checked={nightLightingOnly} 
                onChange={(e) => setNightLightingOnly(e.target.checked)} 
              />
              <span>💡 Iluminación LED</span>
            </label>
          </div>
        )}
      </section>


      {/* Catalog Grid */}
      <section className="space-y-4">
        
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Establecimientos Disponibles
          </h3>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {filteredVenues.length}{' '}
            {filteredVenues.length === 1 ? 'centro abierto' : 'centros abiertos'}
          </span>
        </div>

        {filteredVenues.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No encontramos centros que coincidan con tu búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSportPriceFilter('all');
                setSportLocationFilter('all');
                setNightLightingOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-champagne-500 text-slate-950 text-xs font-bold"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVenues.map((venue) => {
              const catServices = services.filter(
                (s) => s.isActive && s.category === venue.category
              );
              const minPrice =
                catServices.length > 0
                  ? Math.min(...catServices.map((s) => s.price))
                  : 35000;

              const venueReviewsCount = reviews.filter((r) => r.venueId === venue.id).length;

              return (
                <article
                  key={venue.id}
                  className="bg-white dark:bg-obsidian-900 rounded-2xl border border-sand-200 dark:border-obsidian-800 overflow-hidden flex flex-col justify-between transition-colors hover:border-champagne-500/50 group"
                >
                  <div>
                    {/* Integrated Photo Carousel inside Venue Card */}
                    <VenueCardPhotoCarousel
                      venue={venue}
                      onOpenGallery={() => setGalleryVenue(venue)}
                    />

                    <div className="p-3.5 sm:p-5 space-y-2 sm:space-y-3">
                      {/* Clean unboxed typographic metadata (Zero-Pill Discipline) */}
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-medium text-champagne-600 dark:text-champagne-400">
                          {CATEGORY_LABELS[venue.category]}
                          {venue.subCategory && ` · ${venue.subCategory}`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {venue.location}
                        </span>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => setReviewsModalVenue(venue)}
                          className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-200 hover:text-champagne-500 transition-colors"
                          title="Ver opiniones y reseñas del público"
                        >
                          <Star className="w-3 h-3 text-champagne-500 fill-champagne-500" />
                          <span>{venue.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400 underline">
                            ({venueReviewsCount} {venueReviewsCount === 1 ? 'opinión' : 'opiniones'})
                          </span>
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {venue.name}
                      </h4>

                      {/* Live synced services list as clean typographic rows */}
                      <div className="space-y-1 sm:space-y-1.5 pt-0.5 sm:pt-1">
                        {catServices.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-300"
                          >
                            <span className="truncate pr-2">{s.name}</span>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                              {formatCOP(s.price)}
                            </span>
                          </div>
                        ))}
                        {catServices.length === 0 && (
                          <p className="text-[10px] sm:text-xs text-slate-400">
                            Servicios bajo reserva directa
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                    <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 pt-2 sm:pt-3 border-t border-sand-200 dark:border-obsidian-800 flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: "0 0 12px rgba(212, 175, 55, 0.3)" }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setMapModalVenue(venue)}
                          className="px-2.5 h-8 sm:h-9 rounded-xl border border-sand-200 dark:border-obsidian-750 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-champagne-500 transition-colors"
                          title="Ver en el mapa"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold hidden xs:inline">Cómo llegar</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: "0 0 12px rgba(212, 175, 55, 0.3)" }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setReviewsModalVenue(venue)}
                          className="px-2.5 h-8 sm:h-9 rounded-xl border border-sand-200 dark:border-obsidian-750 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-champagne-500 transition-colors"
                          title="Ver opiniones"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold hidden xs:inline">Opiniones</span>
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: "0 0 18px rgba(212, 175, 55, 0.6)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => onOpenBooking(venue)}
                        className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-950 dark:bg-champagne-500 dark:text-slate-950 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 relative overflow-hidden animate-glow"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Agendar</span>
                      </motion.button>
                    </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Sección Desplegable de Preguntas Frecuentes (FAQ Accordion) */}
      <section className="pt-4 pb-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 dark:border-obsidian-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-champagne-500/10 text-champagne-600 dark:text-champagne-400">
                <HelpCircle className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Preguntas Frecuentes
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Consulta dudas rápidas sobre métodos de pago en el local, políticas de cancelación y reservas sin registro.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            {faqs.length} consultas frecuentes
          </span>
        </div>

        <div className="rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 divide-y divide-sand-200 dark:divide-obsidian-800 overflow-hidden shadow-xs">
          {faqs.map((item, idx) => {
            const isOpen = exploreFaqIndex === idx;
            return (
              <div key={item.id || `explore-faq-${idx}`} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setExploreFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left hover:bg-sand-50 dark:hover:bg-obsidian-850/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 p-1.5 rounded-lg bg-sand-100 dark:bg-obsidian-800 text-slate-600 dark:text-champagne-400 shrink-0">
                      {item.category === 'pagos' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : item.category === 'cancelacion' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : item.category === 'horarios' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sand-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300">
                          {item.categoryLabel}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                        {item.q}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 pt-1">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-champagne-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 pl-12 sm:pl-14 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-sand-100 dark:border-obsidian-850 bg-sand-50/50 dark:bg-obsidian-950/30">
                    <p className="pt-2.5">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal de Galería de Fotos del Local */}
      <VenuePhotoGalleryModal
        isOpen={!!galleryVenue}
        venue={galleryVenue}
        onClose={() => setGalleryVenue(null)}
        onBookVenue={(v) => {
          setGalleryVenue(null);
          onOpenBooking(v);
        }}
      />

      {/* Modal de Reseñas y Opiniones del Local */}
      {reviewsModalVenue && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-lg w-full p-6 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3.5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Reseñas: {reviewsModalVenue.name}</span>
                  <span className="flex items-center gap-1 font-mono text-champagne-500 text-sm">
                    <Star className="w-4 h-4 fill-champagne-500 text-champagne-500" />
                    {reviewsModalVenue.rating.toFixed(1)}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Opiniones de clientes que han reservado en este establecimiento
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewsModalVenue(null)}
                className="w-8 h-8 rounded-lg border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {reviews.filter((r) => r.venueId === reviewsModalVenue.id).length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aún no hay reseñas registradas para este establecimiento. ¡Sé el primero en opinar al completar tu reserva!
                  </p>
                </div>
              ) : (
                reviews
                  .filter((r) => r.venueId === reviewsModalVenue.id)
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {rev.clientName}
                        </span>
                        <div className="flex items-center gap-1">
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
                          <span className="font-mono text-[11px] text-slate-400 ml-1">
                            {rev.date}
                          </span>
                        </div>
                      </div>
                      {rev.serviceName && (
                        <span className="text-[10px] font-mono font-semibold text-champagne-600 dark:text-champagne-400 block">
                          Servicio: {rev.serviceName}
                        </span>
                      )}
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-sand-200 dark:border-obsidian-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const v = reviewsModalVenue;
                  setReviewsModalVenue(null);
                  setNewReviewModalVenue({ venue: v });
                  setNewReviewClientName('');
                  setNewReviewRating(5);
                  setNewReviewComment('');
                }}
                className="px-4 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                <span>Escribir una Opinión</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewsModalVenue(null)}
                className="px-4 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calificar / Dejar Opinión */}
      {newReviewModalVenue && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newReviewClientName.trim() || !newReviewComment.trim()) return;
              if (onAddReview) {
                onAddReview({
                  venueId: newReviewModalVenue.venue.id,
                  clientName: newReviewClientName.trim(),
                  rating: newReviewRating,
                  comment: newReviewComment.trim(),
                  serviceName: newReviewModalVenue.serviceName,
                });
              }
              setNewReviewModalVenue(null);
            }}
            className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-md w-full p-6 border border-sand-200 dark:border-obsidian-800 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-sand-200 dark:border-obsidian-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Calificar Cita &amp; Servicio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {newReviewModalVenue.venue.name}
                  {newReviewModalVenue.serviceName ? ` — ${newReviewModalVenue.serviceName}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewReviewModalVenue(null)}
                className="w-8 h-8 rounded-lg border border-sand-200 dark:border-obsidian-750 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-center py-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                ¿Cómo estuvo tu experiencia? (Puntuación)
              </label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewReviewRating(s)}
                    className="p-1 focus:outline-none transform hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        s <= newReviewRating
                          ? 'text-champagne-500 fill-champagne-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tu Nombre *
              </label>
              <input
                type="text"
                required
                value={newReviewClientName}
                onChange={(e) => setNewReviewClientName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-champagne-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tu Opinión / Comentario *
              </label>
              <textarea
                required
                rows={3}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                placeholder="Cuenta qué tal fue la atención, las instalaciones, puntualidad..."
                className="w-full px-3.5 py-2 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-750 text-slate-900 dark:text-white focus:outline-none focus:border-champagne-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-sand-200 dark:border-obsidian-800">
              <button
                type="button"
                onClick={() => setNewReviewModalVenue(null)}
                className="px-4 py-2 rounded-xl border border-sand-200 dark:border-obsidian-750 text-slate-600 dark:text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-extrabold"
              >
                Publicar Opinión
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Modal de Mapa */}
      <VenueMapModal
        venue={mapModalVenue}
        onClose={() => setMapModalVenue(null)}
      />
    </div>
  );
};
