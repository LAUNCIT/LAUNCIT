import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem, DayName, WorkingDayConfig, BlockedSlot } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, Clock, Info, ShieldCheck, MapPin } from 'lucide-react';
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

export const FacilityFlow: React.FC<FlowProps> = ({
  venue, services, workingDays, blockedSlots, appointments, onConfirm, onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDayName, setSelectedDayName] = useState<DayName>('Lunes');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(1);
  const [numPlayers, setNumPlayers] = useState(10);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  
  // Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const activeServices = services.filter(s => s.isActive && s.category === venue.category);
  const selectedService = activeServices[0]; 

  const totalPrice = (selectedService?.price || 90000) * duration;

  const handleNext = () => {
    if (step === 1 && selectedDate) setStep(2);
    else if (step === 2 && selectedTime) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const confirmBooking = () => {
    if (!clientName || !clientPhone) return;
    const apptData: Partial<Appointment> = {
      engineType: 'facility',
      subCategory: venue.subCategory,
      serviceId: selectedService?.id,
      service: selectedService?.name,
      dateKey: selectedDate,
      dayName: selectedDayName,
      time: selectedTime,
      durationHours: duration,
      price: totalPrice,
      amenities: amenities,
      isRecurring,
      client: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: `${venue.subCategory === 'Canchas' ? `Jugadores: ${numPlayers}` : ''} | ${clientNotes}`,
      responsibleName: clientName,
      responsiblePhone: clientPhone,
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
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Selecciona el día</h3>
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
              <div className="p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800">
                <p className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-500">¿Por cuántas horas?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(h => (
                    <button key={h} onClick={() => setDuration(h)} className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all ${duration === h ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{h} {h === 1 ? 'hora' : 'horas'}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Horario de inicio</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => {
                  const availability = evaluateSlotAvailability({
                    dayName: selectedDayName, dateKey: selectedDate, timeStr: t, proId: 'all',
                    workingDays, blockedSlots, appointments, professionals: []
                  });
                  return (
                    <button key={t} disabled={!availability.available} onClick={() => setSelectedTime(t)} className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${!availability.available ? 'opacity-30 cursor-not-allowed' : selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{t}</button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Extras de la reserva</h3>
              <div className="space-y-4">
                {venue.subCategory === 'Canchas' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider block">Número de jugadores (aprox)</label>
                    <input type="number" value={numPlayers} onChange={e => setNumPlayers(parseInt(e.target.value))} className="w-full bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-champagne-500/20 outline-none min-h-[44px]" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider block">Frecuencia</label>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Reserva recurrente</p>
                      <p className="text-[10px] text-slate-500">Reservar cada semana a la misma hora</p>
                    </div>
                    <button 
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`w-11 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-champagne-500 shadow-sm' : 'bg-sand-300 dark:bg-obsidian-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isRecurring ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider block">Implementos incluidos</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {['Iluminación LED', 'Vestuarios VIP', 'Balones Pro', 'Petos / Chalecos', 'Hidratación'].map(item => (
                      <button key={item} onClick={() => setAmenities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item])} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${amenities.includes(item) ? 'bg-champagne-500 text-slate-950 border-champagne-500 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 text-slate-300'}`}>{item}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Compact Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-obsidian-900 flex items-center justify-center border border-sand-200 dark:border-obsidian-800 shadow-sm shrink-0">
                    <MapPin className="w-5 h-5 text-champagne-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{venue.subCategory || 'Alquiler'}</p>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{venue.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{duration} {duration === 1 ? 'hora' : 'horas'}</p>
                  </div>
                  <span className="text-sm font-black text-champagne-600 shrink-0">
                    {formatCOP(totalPrice)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 dark:border-obsidian-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-champagne-600" />
                    <span>{selectedDate}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">· {selectedTime}</span>
                  </div>
                  {amenities.length > 0 && (
                    <div className="text-[10px] font-semibold text-emerald-400 truncate max-w-[150px]">
                      {amenities.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <ContactFields name={clientName} setName={setClientName} phone={clientPhone} setPhone={setClientPhone} email={clientEmail} setEmail={setClientEmail} notes={clientNotes} setNotes={setClientNotes} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Footer */}
      <div className="px-5 sm:px-6 py-3.5 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/95 dark:bg-obsidian-900/95 flex justify-between items-center gap-3 shrink-0 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))] z-10">
        <button onClick={step === 1 ? onCancel : handleBack} className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-1.5 min-h-[44px]"><ArrowLeft className="w-4 h-4" /><span>{step === 1 ? 'Cancelar' : 'Anterior'}</span></button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && !selectedDate) || (step === 2 && !selectedTime) || (step === 4 && (!clientName || !clientPhone))} className="flex-1 max-w-xs px-5 py-3.5 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 min-h-[44px]"><span>{step === 4 ? 'Confirmar Alquiler' : 'Continuar'}</span>{step < 4 && <ArrowRight className="w-4 h-4" opacity-90 />}</button>
      </div>
    </div>
  );
};
