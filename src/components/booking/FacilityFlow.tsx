import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem, DayName, WorkingDayConfig, BlockedSlot } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, MapPin, Clock, Info } from 'lucide-react';
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
  const [duration, setDuration] = useState(1); // Hours
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
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-sand-200 dark:border-obsidian-800 bg-white/50 dark:bg-obsidian-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-champagne-600 uppercase tracking-widest">Paso {step} de 4</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{venue.subCategory}</span>
        </div>
        <div className="h-1 bg-sand-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-champagne-500" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 sm:pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Selecciona el día</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {UPCOMING_DATES.map(d => {
                  const isOpen = workingDays[d.dayName]?.isOpen;
                  return (
                    <button
                      key={d.dateKey}
                      disabled={!isOpen}
                      onClick={() => { setSelectedDate(d.dateKey); setSelectedDayName(d.dayName); }}
                      className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all glow-up ${!isOpen ? 'opacity-30 cursor-not-allowed' : selectedDate === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-lg shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                    >
                      <span className="text-[10px] uppercase opacity-70">{d.shortDay}</span>
                      <span className="text-sm font-black">{d.shortDate.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
              <div className="p-5 rounded-3xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 shadow-inner">
                <p className="text-xs font-bold mb-4 uppercase tracking-widest text-slate-500">¿Por cuántas horas?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(h => (
                    <button key={h} onClick={() => setDuration(h)} className={`flex-1 p-3 rounded-2xl border text-sm font-bold transition-all glow-up ${duration === h ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-md shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{h} {h === 1 ? 'hora' : 'horas'}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Horario de inicio</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => {
                  const availability = evaluateSlotAvailability({
                    dayName: selectedDayName, dateKey: selectedDate, timeStr: t, proId: 'all',
                    workingDays, blockedSlots, appointments, professionals: []
                  });
                  return (
                    <button key={t} disabled={!availability.available} onClick={() => setSelectedTime(t)} className={`p-3 rounded-2xl border text-[10px] font-bold transition-all glow-up ${!availability.available ? 'opacity-30 cursor-not-allowed' : selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-md shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{t}</button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Extras de la reserva</h3>
              <div className="space-y-6">
                {venue.subCategory === 'Canchas' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Número de jugadores (aprox)</label>
                    <input type="number" value={numPlayers} onChange={e => setNumPlayers(parseInt(e.target.value))} className="w-full bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-champagne-500/20 outline-none" />
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Frecuencia</label>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Reserva recurrente</p>
                      <p className="text-[10px] text-slate-500">Reservar cada semana a la misma hora</p>
                    </div>
                    <button 
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-champagne-500 shadow-md shadow-champagne-500/20' : 'bg-sand-300 dark:bg-obsidian-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isRecurring ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Implementos incluidos</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Iluminación LED', 'Vestuarios VIP', 'Balones Pro', 'Petos / Chalecos', 'Hidratación'].map(item => (
                      <button key={item} onClick={() => setAmenities(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item])} className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all glow-up ${amenities.includes(item) ? 'bg-champagne-500 text-slate-950 border-champagne-500 shadow-md shadow-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 text-slate-50'}`}>{item}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-950 text-white space-y-6 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-champagne-500/10 rounded-full blur-3xl" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-champagne-400 uppercase tracking-widest">Resumen de Reserva</p>
                    <h4 className="text-xl font-bold">{venue.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">{venue.location.split('·')[0]}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Cita</p>
                    <p className="text-sm font-bold text-champagne-400">{selectedDate}</p>
                    <p className="text-xs font-bold">{selectedTime}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Alquiler ({duration} {duration === 1 ? 'hora' : 'horas'})</span>
                    <span className="font-mono text-white">{formatCOP(totalPrice)}</span>
                  </div>
                  {amenities.length > 0 && <div className="flex justify-between text-[10px] text-emerald-400 italic"><span>{amenities.join(', ')}</span><span>Incluido</span></div>}
                  <div className="flex justify-between pt-4 border-t border-white/10 items-center">
                    <span className="font-black uppercase tracking-tighter text-sm">Valor Total</span>
                    <span className="font-black text-champagne-400 text-2xl">{formatCOP(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <ContactFields name={clientName} setName={setClientName} phone={clientPhone} setPhone={setClientPhone} email={clientEmail} setEmail={setClientEmail} notes={clientNotes} setNotes={setClientNotes} />

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600/80 leading-relaxed italic">
                  * Términos y condiciones: En caso de no asistir, deberá pagarse la reserva a menos que se cancele 24 horas antes. Responsable: {clientName || '---'}.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/50 dark:bg-obsidian-900/50 flex justify-between items-center gap-3 sticky bottom-0 z-10 backdrop-blur-md">
        <button onClick={step === 1 ? onCancel : handleBack} className="px-6 py-4 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-2 glow-up"><ArrowLeft className="w-4 h-4" /><span>{step === 1 ? 'Cancelar' : 'Anterior'}</span></button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && !selectedDate) || (step === 2 && !selectedTime) || (step === 4 && (!clientName || !clientPhone))} className="flex-1 px-6 py-4 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 glow-up"><span>{step === 4 ? 'Confirmar Alquiler' : 'Continuar'}</span>{step < 4 && <ArrowRight className="w-4 h-4" />}</button>
      </div>
    </div>
  );
};
