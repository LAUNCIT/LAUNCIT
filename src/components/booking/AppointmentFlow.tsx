import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem, Professional, DayName, WorkingDayConfig, BlockedSlot } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, CalendarCheck2, Clock, Users, UserCheck } from 'lucide-react';
import { formatCOP } from '../../utils/scheduleUtils';
import { UPCOMING_DATES, TIME_SLOTS, SPECIALIST_AVATAR_FALLBACK } from '../../data/initialData';
import { evaluateSlotAvailability } from '../../utils/scheduleUtils';
import { ResilientImage } from '../ResilientImage';
import { ContactFields } from './ContactFields';

interface FlowProps {
  venue: Venue;
  services: ServiceItem[];
  professionals: Professional[];
  workingDays: Record<DayName, WorkingDayConfig>;
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  onConfirm: (appt: Partial<Appointment>) => void;
  onCancel: () => void;
}

export const AppointmentFlow: React.FC<FlowProps> = ({
  venue, services, professionals, workingDays, blockedSlots, appointments, onConfirm, onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | 'any' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDayName, setSelectedDayName] = useState<DayName>('Lunes');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);

  // Custom fields
  const [hairLength, setHairLength] = useState('');
  const [hairType, setHairType] = useState('');
  const [dentalReason, setReason] = useState('');

  const activeServices = services.filter(s => s.isActive && s.category === venue.category);
  const availablePros = professionals.filter(p => p.status !== 'Descanso');

  const handleNext = () => {
    if (step === 1 && selectedService) setStep(2);
    else if (step === 2 && selectedPro) setStep(3);
    else if (step === 3 && selectedTime) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const confirmBooking = () => {
    if (!selectedService || !selectedPro || !selectedTime || !clientName || !clientPhone || !consentWhatsApp) return;
    
    const apptData: Partial<Appointment> = {
      engineType: 'appointment',
      subCategory: venue.subCategory,
      venueId: venue.id,
      serviceId: selectedService.id,
      service: selectedService.name,
      proId: selectedPro === 'any' ? 'any' : selectedPro.id,
      pro: selectedPro === 'any' ? 'Primer disponible' : selectedPro.name,
      dateKey: selectedDate,
      dayName: selectedDayName,
      time: selectedTime,
      price: selectedService.price,
      client: clientName,
      phone: clientPhone,
      email: clientEmail,
      consentWhatsApp: true,
      notes: `${venue.subCategory === 'Peluquería' ? `Largo: ${hairLength}, Tipo: ${hairType}` : dentalReason} | ${clientNotes}`,
    };
    onConfirm(apptData);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-sand-200 dark:border-obsidian-800 bg-white/95 dark:bg-obsidian-900/95 backdrop-blur-md shrink-0 pr-14 relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-champagne-600 uppercase tracking-widest">Paso {step} de 4</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{venue.name}</span>
        </div>
        <div className="h-1 bg-sand-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-champagne-500" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pb-12 sm:pb-16 min-h-0">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Selecciona el servicio</h3>
              <div className="grid gap-2.5">
                {activeServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${selectedService?.id === s.id ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{s.desc}</p>
                        <p className="text-[10px] font-mono text-champagne-600 mt-1.5 bg-champagne-500/5 px-2 py-0.5 rounded-full w-fit">{s.duration}</p>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">{formatCOP(s.price)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {venue.subCategory === 'Peluquería' && selectedService && (
                <div className="p-3.5 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Detalles de tu cabello:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={hairLength} 
                      onChange={e => setHairLength(e.target.value)}
                      className="bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Largo del cabello</option>
                      <option value="Corto">Corto</option>
                      <option value="Medio">Medio</option>
                      <option value="Largo">Largo</option>
                    </select>
                    <select 
                      value={hairType} 
                      onChange={e => setHairType(e.target.value)}
                      className="bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Tipo de cabello</option>
                      <option value="Liso">Liso</option>
                      <option value="Ondulado">Ondulado</option>
                      <option value="Rizado">Rizado</option>
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">¿Con quién prefieres reservar?</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setSelectedPro('any')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${selectedPro === 'any' ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}
                >
                  <div className="w-10 h-10 bg-champagne-500/20 rounded-full flex items-center justify-center mx-auto mb-1.5">
                    <Users className="w-5 h-5 text-champagne-600" />
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Primer disponible</p>
                </button>
                {availablePros.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPro(p)}
                    className={`p-3 rounded-2xl border text-center transition-all ${selectedPro !== 'any' && selectedPro?.id === p.id ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1.5 border-2 border-champagne-500/20 shadow-sm">
                      <ResilientImage src={p.avatar} alt={p.name} fallbackSrc={SPECIALIST_AVATAR_FALLBACK} />
                    </div>
                    <p className="font-bold text-xs truncate text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.role}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Selecciona la fecha</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {UPCOMING_DATES.map(d => {
                    const isOpen = workingDays?.[d.dayName]?.isOpen ?? true;
                    return (
                      <button
                        key={d.dateKey}
                        disabled={!isOpen}
                        onClick={() => { setSelectedDate(d.dateKey); setSelectedDayName(d.dayName); }}
                        className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${!isOpen ? 'opacity-30 cursor-not-allowed bg-sand-100' : selectedDate === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-md' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                      >
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
                      const availability = evaluateSlotAvailability({
                        dayName: selectedDayName, dateKey: selectedDate, timeStr: t, proId: selectedPro === 'any' ? 'any' : selectedPro?.id || 'any',
                        workingDays, blockedSlots, appointments, professionals
                      });
                      return (
                        <button
                          key={t}
                          disabled={!availability.available}
                          onClick={() => setSelectedTime(t)}
                          className={`p-2.5 rounded-xl border text-xs font-bold font-mono transition-all ${!availability.available ? 'opacity-30 cursor-not-allowed' : selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Compact Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-obsidian-900 flex items-center justify-center border border-sand-200 dark:border-obsidian-800 shadow-sm shrink-0">
                    <CalendarCheck2 className="w-5 h-5 text-champagne-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{venue.subCategory || 'Cita'}</p>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{venue.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{selectedService?.name}</p>
                  </div>
                  <span className="text-sm font-black text-champagne-600 shrink-0">
                    {formatCOP(selectedService?.price || 0)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 dark:border-obsidian-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-champagne-600" />
                    <span>{selectedDate}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">· {selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-champagne-600" />
                    <span className="truncate max-w-[130px]">{selectedPro === 'any' ? 'Primer disponible' : selectedPro?.name}</span>
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

      {/* Fixed Footer */}
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
          disabled={
            (step === 1 && !selectedService) || (step === 2 && !selectedPro) || (step === 3 && !selectedTime) || (step === 4 && (!clientName || !clientPhone || !consentWhatsApp))
          }
          className="flex-1 max-w-xs px-5 py-3.5 rounded-2xl bg-champagne-500 hover:bg-champagne-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span>{step === 4 ? 'Confirmar Reserva' : 'Continuar'}</span>
          {step < 4 && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
