import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem, DayName, WorkingDayConfig, BlockedSlot } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, Users, MapPin, UtensilsCrossed, Info } from 'lucide-react';
import { formatCOP } from '../../utils/scheduleUtils';
import { UPCOMING_DATES, TIME_SLOTS } from '../../data/initialData';
import { evaluateSlotAvailability } from '../../utils/scheduleUtils';
import { ContactFields } from './ContactFields';

interface FlowProps {
  venue: Venue;
  services: ServiceItem[];
  workingDays: Record<DayName, WorkingDayConfig>;
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  onConfirm: (appt: Partial<Appointment>) => void;
  onCancel: () => void;
}

const ZONES = ['Terraza', 'Salón Principal', 'Bar / Barra', 'Zona VIP', 'Exterior / Jardín'];

export const RestaurantFlow: React.FC<FlowProps> = ({
  venue, services, workingDays, blockedSlots, appointments, onConfirm, onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDayName, setSelectedDayName] = useState<DayName>('Lunes');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guests, setGuests] = useState(2);
  
  // Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);

  const handleNext = () => {
    if (step === 1 && selectedZone) setStep(2);
    else if (step === 2 && selectedTime) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const confirmBooking = () => {
    if (!clientName || !clientPhone) return;
    const apptData: Partial<Appointment> = {
      engineType: 'restaurant',
      subCategory: venue.subCategory,
      zone: selectedZone,
      dateKey: selectedDate,
      dayName: selectedDayName,
      time: selectedTime,
      guestsCount: guests,
      client: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: clientNotes,
      venueId: venue.id,
      consentWhatsApp,
      service: `Reserva de Mesa - ${guests} pers.`,
      price: 0,
    };
    onConfirm(apptData);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 1. Encabezado Fijo (Fixed Header with pr-14 to avoid X overlap) */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-sand-200 dark:border-obsidian-800 bg-white/95 dark:bg-obsidian-900/95 backdrop-blur-md shrink-0 pr-14 relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-champagne-600 uppercase tracking-widest">Paso {step} de 4</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{venue.name}</span>
        </div>
        <div className="h-1 bg-sand-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-champagne-500" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      {/* 2. Cuerpo con Scroll (Scrollable Body) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-12 sm:pb-16 min-h-0">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">¿Dónde prefieres tu mesa?</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {ZONES.map(zone => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-4 rounded-2xl border text-center transition-all ${selectedZone === zone ? 'border-champagne-500 bg-champagne-500/10 shadow-md scale-[0.98]' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900 hover:border-champagne-500/50'}`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center transition-colors ${selectedZone === zone ? 'bg-champagne-500 text-slate-950' : 'bg-sand-100 dark:bg-obsidian-800 text-slate-400'}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{zone}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Fecha de reserva</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {UPCOMING_DATES.map(d => {
                    const isOpen = workingDays?.[d.dayName]?.isOpen ?? true;
                    return (
                      <button key={d.dateKey} disabled={!isOpen} onClick={() => { setSelectedDate(d.dateKey); setSelectedDayName(d.dayName); }} className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${!isOpen ? 'opacity-30 cursor-not-allowed bg-sand-100' : selectedDate === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-md' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                        <span className="text-[10px] uppercase font-bold opacity-60">{d.shortDay}</span>
                        <span className="text-base font-black">{d.shortDate.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedDate && (
                <div className="space-y-2">
                  <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider ml-1">Horarios disponibles</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map(t => {
                      const availability = evaluateSlotAvailability({ dayName: selectedDayName, dateKey: selectedDate, timeStr: t, proId: 'all', workingDays, blockedSlots, appointments, professionals: [] });
                      return (
                        <button key={t} disabled={!availability.available} onClick={() => setSelectedTime(t)} className={`p-2.5 rounded-xl border text-xs font-bold font-mono transition-all ${!availability.available ? 'opacity-30 cursor-not-allowed' : selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{t}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Número de personas</h3>
              <div className="flex items-center justify-center gap-8 py-6 bg-sand-50 dark:bg-obsidian-850 rounded-3xl border border-sand-200 dark:border-obsidian-800">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-12 h-12 rounded-full border border-sand-300 dark:border-obsidian-700 flex items-center justify-center text-xl font-bold bg-white dark:bg-obsidian-800 hover:bg-champagne-500/10 transition-all shadow-sm">-</button>
                <div className="text-center">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{guests}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Comensales</p>
                </div>
                <button onClick={() => setGuests(Math.min(20, guests + 1))} className="w-12 h-12 rounded-full border border-sand-300 dark:border-obsidian-700 flex items-center justify-center text-xl font-bold bg-white dark:bg-obsidian-800 hover:bg-champagne-500/10 transition-all shadow-sm">+</button>
              </div>
              <div className="p-3 rounded-xl bg-sand-100 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-tight">Para reservas de más de 20 personas, contacta al negocio por WhatsApp.</p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Compact Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-obsidian-900 flex items-center justify-center border border-sand-200 dark:border-obsidian-800 shadow-sm shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-champagne-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reserva de Mesa</p>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{venue.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{selectedZone}</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md shrink-0">
                    Gratuito
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 dark:border-obsidian-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-champagne-600" />
                    <span>{selectedDate}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">· {selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Users className="w-3.5 h-3.5 text-champagne-600" />
                    <span>{guests} {guests === 1 ? 'persona' : 'personas'}</span>
                  </div>
                </div>
              </div>

              <ContactFields 
                name={clientName} setName={setClientName} 
                phone={clientPhone} setPhone={setClientPhone} 
                email={clientEmail} setEmail={setClientEmail} 
                notes={clientNotes} setNotes={setClientNotes}
                consent={consentWhatsApp} setConsent={setConsentWhatsApp}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Pie Fijo (Fixed Footer respecting safe-area-inset-bottom) */}
      <div className="px-5 sm:px-6 py-3.5 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/95 dark:bg-obsidian-900/95 flex justify-between items-center gap-3 shrink-0 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))] z-10">
        <button 
          onClick={step === 1 ? onCancel : handleBack} 
          className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-1.5 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancelar' : 'Anterior'}</span>
        </button>
        <button 
          onClick={step === 4 ? confirmBooking : handleNext} 
          disabled={(step === 1 && !selectedZone) || (step === 2 && !selectedTime) || (step === 4 && (!clientName || !clientPhone || !consentWhatsApp))} 
          className="flex-1 max-w-xs px-5 py-3.5 rounded-2xl bg-champagne-500 hover:bg-champagne-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span>{step === 4 ? 'Confirmar Reserva' : 'Continuar'}</span>
          {step < 4 && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
