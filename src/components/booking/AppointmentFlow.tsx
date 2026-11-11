import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem, Professional, DayName, WorkingDayConfig, BlockedSlot } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, Clock, Copy, ExternalLink, Lock, MessageCircle, ShieldCheck, Users, X, CalendarCheck2 } from 'lucide-react';
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
    if (!selectedService || !selectedPro || !selectedTime || !clientName || !clientPhone) return;
    
    const apptData: Partial<Appointment> = {
      engineType: 'appointment',
      subCategory: venue.subCategory,
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
      notes: `${venue.subCategory === 'Peluquería' ? `Largo: ${hairLength}, Tipo: ${hairType}` : dentalReason} | ${clientNotes}`,
    };
    onConfirm(apptData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-sand-200 dark:border-obsidian-800 bg-white/50 dark:bg-obsidian-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-champagne-600 uppercase tracking-widest">Paso {step} de 4</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{venue.subCategory}</span>
        </div>
        <div className="h-1 bg-sand-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-champagne-500" 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 sm:pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Selecciona el servicio</h3>
              <div className="grid gap-3">
                {activeServices.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`p-4 rounded-2xl border text-left transition-all glow-up ${selectedService?.id === s.id ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{s.desc}</p>
                        <p className="text-[10px] font-mono text-champagne-600 mt-2 bg-champagne-500/5 px-2 py-1 rounded-full w-fit">{s.duration}</p>
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white shrink-0">{formatCOP(s.price)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {venue.subCategory === 'Peluquería' && selectedService && (
                <div className="p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Detalles de tu cabello:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={hairLength} 
                      onChange={e => setHairLength(e.target.value)}
                      className="bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-xl p-3 text-xs"
                    >
                      <option value="">Largo del cabello</option>
                      <option value="Corto">Corto</option>
                      <option value="Medio">Medio</option>
                      <option value="Largo">Largo</option>
                    </select>
                    <select 
                      value={hairType} 
                      onChange={e => setHairType(e.target.value)}
                      className="bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-xl p-3 text-xs"
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
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">¿Con quién prefieres reservar?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedPro('any')}
                  className={`p-4 rounded-2xl border text-center transition-all glow-up ${selectedPro === 'any' ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}
                >
                  <div className="w-12 h-12 bg-champagne-500/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner shadow-black/5">
                    <Users className="w-6 h-6 text-champagne-600" />
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Cualquier profesional</p>
                </button>
                {availablePros.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPro(p)}
                    className={`p-3 rounded-2xl border text-center transition-all glow-up ${selectedPro !== 'any' && selectedPro?.id === p.id ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-2 border-2 border-champagne-500/20 shadow-md">
                      <ResilientImage src={p.avatar} alt={p.name} fallbackSrc={SPECIALIST_AVATAR_FALLBACK} />
                    </div>
                    <p className="font-bold text-xs truncate text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.role}</p>
                    <p className="text-[10px] font-bold text-champagne-600 mt-1">★ {p.rating}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Selecciona la fecha</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {UPCOMING_DATES.map(d => {
                    const isOpen = workingDays[d.dayName]?.isOpen;
                    return (
                      <button
                        key={d.dateKey}
                        disabled={!isOpen}
                        onClick={() => { setSelectedDate(d.dateKey); setSelectedDayName(d.dayName); }}
                        className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all glow-up ${!isOpen ? 'opacity-30 cursor-not-allowed bg-sand-100' : selectedDate === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-lg shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                      >
                        <span className="text-[10px] uppercase opacity-70">{d.shortDay}</span>
                        <span className="text-sm font-black">{d.shortDate.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Horarios disponibles</h3>
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
                          className={`p-2.5 rounded-xl border text-[10px] font-bold transition-all glow-up ${!availability.available ? 'opacity-30 cursor-not-allowed' : selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-md shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800'}`}
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
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="p-6 rounded-3xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-4 shadow-inner shadow-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-obsidian-900 flex items-center justify-center border border-sand-200 dark:border-obsidian-800 shadow-sm">
                    <CalendarCheck2 className="w-6 h-6 text-champagne-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen de Reserva</p>
                    <h4 className="font-bold text-slate-900 dark:text-white">{venue.name}</h4>
                  </div>
                </div>

                <div className="space-y-3 border-t border-sand-200 dark:border-obsidian-800 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Servicio</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Profesional</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPro === 'any' ? 'Primer disponible' : selectedPro?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Cita</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedDate} · {selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-sand-200 dark:border-obsidian-800">
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Total</span>
                    <span className="font-black text-champagne-600 text-lg">{formatCOP(selectedService?.price || 0)}</span>
                  </div>
                </div>
              </div>

              <ContactFields 
                name={clientName} setName={setClientName}
                phone={clientPhone} setPhone={setClientPhone}
                email={clientEmail} setEmail={setClientEmail}
                notes={clientNotes} setNotes={setClientNotes}
              />

              {['Odontología', 'Psicología', 'Medicina'].includes(venue.subCategory || '') && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Motivo de consulta:</label>
                  <textarea 
                    value={dentalReason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Cuéntanos brevemente el motivo..."
                    className="w-full bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-2xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-champagne-500/20 outline-none"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/50 dark:bg-obsidian-900/50 flex justify-between items-center gap-3 sticky bottom-0 z-10 backdrop-blur-md">
        <button
          onClick={step === 1 ? onCancel : handleBack}
          className="px-6 py-4 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-2 glow-up"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancelar' : 'Anterior'}</span>
        </button>
        
        <button
          onClick={step === 4 ? confirmBooking : handleNext}
          disabled={
            (step === 1 && !selectedService) || (step === 2 && !selectedPro) || (step === 3 && !selectedTime) || (step === 4 && (!clientName || !clientPhone))
          }
          className="flex-1 px-6 py-4 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 glow-up"
        >
          <span>{step === 4 ? 'Confirmar Reserva' : 'Continuar'}</span>
          {step < 4 && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
