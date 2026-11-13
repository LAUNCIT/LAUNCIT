import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, MessageCircle, ExternalLink, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, BlockedSlot, DayName, Professional, ServiceItem, Venue, WhatsAppConfig, WorkingDayConfig } from '../types';
import { formatCOP } from '../utils/scheduleUtils';
import { compileWhatsAppMessage, generateWhatsAppUrl } from '../utils/whatsappUtils';
import { getBookingEngineType } from '../utils/bookingUtils';

// Specialized Flow Components
import { AppointmentFlow } from './booking/AppointmentFlow';
import { AccommodationFlow } from './booking/AccommodationFlow';
import { FacilityFlow } from './booking/FacilityFlow';
import { SportsFlow } from './booking/SportsFlow';
import { RentalFlow } from './booking/RentalFlow';
import { RestaurantFlow } from './booking/RestaurantFlow';

interface BookingWizardModalProps {
  isOpen: boolean;
  initialVenue: Venue | null;
  venues: Venue[];
  services: ServiceItem[];
  professionals: Professional[];
  workingDays: Record<DayName, WorkingDayConfig>;
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  whatsAppConfig?: WhatsAppConfig;
  onClose: () => void;
  onConfirmBooking: (appointment: Appointment) => boolean | void;
  onGoToMyBookings: (phone: string) => void;
  onShowToast: (msg: string) => void;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen, initialVenue, venues, services, professionals, workingDays, blockedSlots, appointments, whatsAppConfig,
  onClose, onConfirmBooking, onGoToMyBookings, onShowToast,
}) => {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(initialVenue);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmedAppt(null);
      setSelectedVenue(initialVenue || venues[0]);
    }
  }, [isOpen, initialVenue, venues]);

  if (!isOpen || !selectedVenue) return null;

  const engineType = getBookingEngineType(selectedVenue.subCategory);

  const handleFinalConfirm = (apptData: Partial<Appointment>) => {
    const code = `GLW-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullAppt: Appointment = {
      id: `apt_${Date.now()}`,
      code,
      venueName: selectedVenue.name,
      status: 'Confirmada',
      ...apptData
    } as Appointment;

    const accepted = onConfirmBooking(fullAppt);
    if (accepted === false) return;
    setConfirmedAppt(fullAppt);
  };

  const getCompiledWhatsAppMessage = (): string => {
    if (!confirmedAppt) return '';
    const template = whatsAppConfig?.confirmationTemplate || `✨ *¡Hola {{cliente_nombre}}! Tu reserva en {{establecimiento}} está confirmada* ✨\n\n📋 *Detalles:* #{{codigo}} · {{servicio}}\n🗓 {{fecha}} a las {{hora}}\n💰 Total: {{precio}}\n\n🔗 *Enlace de confirmación:* {{enlace_confirmacion}}\n\n¡Te esperamos!`;
    return compileWhatsAppMessage(template, confirmedAppt);
  };

  const handleCopyWhatsAppMessage = () => {
    if (!confirmedAppt) return;
    const text = getCompiledWhatsAppMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    onShowToast('Comprobante de WhatsApp copiado.');
  };

  const handleOpenWhatsAppChat = () => {
    if (!confirmedAppt) return;
    const text = getCompiledWhatsAppMessage();
    const targetPhone = confirmedAppt.phone || whatsAppConfig?.businessPhone || '+573124567890';
    const url = generateWhatsAppUrl(targetPhone, text);
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden" role="dialog" aria-modal="true">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-obsidian-900 w-full sm:max-w-[560px] h-[92dvh] sm:h-auto sm:max-h-[90dvh] rounded-t-3xl sm:rounded-[32px] border border-sand-200 dark:border-obsidian-800 shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Close Button X (Positioned independently without overlapping text) */}
        {!confirmedAppt && (
          <button 
            onClick={onClose} 
            className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-sand-100/80 dark:bg-obsidian-800/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all border border-sand-200 dark:border-obsidian-750 active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {confirmedAppt ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">¡Reserva Confirmada!</h3>
                <p className="text-slate-500 font-medium">Tu turno ha sido reservado exitosamente.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-sand-200 dark:border-obsidian-800 divide-y divide-sand-200 dark:divide-obsidian-800 overflow-hidden shadow-sm">
              {[
                { label: 'Código', value: confirmedAppt.code, mono: true },
                { label: 'Establecimiento', value: confirmedAppt.venueName },
                { label: 'Servicio', value: confirmedAppt.service },
                { label: 'Fecha', value: confirmedAppt.dateKey },
                { label: 'Hora', value: confirmedAppt.time },
                { label: 'Cliente', value: confirmedAppt.client }
              ].map(item => (
                <div key={item.label} className="flex justify-between p-4 bg-sand-50/50 dark:bg-obsidian-850/50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <span className={`text-sm font-bold text-slate-900 dark:text-white ${item.mono ? 'font-mono' : ''}`}>{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between p-5 bg-champagne-500/5 items-center">
                <span className="text-xs font-bold text-champagne-600 uppercase tracking-widest">Total a pagar</span>
                <span className="text-xl font-black text-champagne-600">{formatCOP(confirmedAppt.price)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <button onClick={handleOpenWhatsAppChat} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 glow-up">
                <MessageCircle className="w-5 h-5" />
                <span>Abrir en WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button onClick={handleCopyWhatsAppMessage} className="w-full py-4 rounded-2xl border border-sand-300 dark:border-obsidian-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all glow-up flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />
                <span>Copiar Comprobante</span>
              </button>
              <button onClick={onClose} className="w-full py-4 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all">Regresar al Inicio</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col h-full">
            {engineType === 'appointment' && (
              <AppointmentFlow 
                venue={selectedVenue} services={services} professionals={professionals} 
                workingDays={workingDays} blockedSlots={blockedSlots} appointments={appointments}
                onConfirm={handleFinalConfirm} onCancel={onClose}
              />
            )}
            {engineType === 'accommodation' && (
              <AccommodationFlow 
                venue={selectedVenue} services={services}
                onConfirm={handleFinalConfirm} onCancel={onClose}
              />
            )}
            {engineType === 'facility' && (
              <FacilityFlow 
                venue={selectedVenue} services={services} workingDays={workingDays} 
                blockedSlots={blockedSlots} appointments={appointments}
                onConfirm={handleFinalConfirm} onCancel={onClose}
              />
            )}
            {engineType === 'sports' && (
              <SportsFlow 
                venue={selectedVenue} services={services}
                onConfirm={handleFinalConfirm} onCancel={onClose}
              />
            )}
            {engineType === 'rental' && (
              <RentalFlow 
                venue={selectedVenue} services={services}
                onConfirm={handleFinalConfirm} onCancel={onClose}
              />
            )}
            {engineType === 'restaurant' && (
              <RestaurantFlow 
                venue={selectedVenue} services={services} workingDays={workingDays} 
                blockedSlots={blockedSlots} appointments={appointments}
                onConfirm={handleFinalConfirm} onCancel={onClose}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
