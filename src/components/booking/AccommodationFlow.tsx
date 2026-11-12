import React, { useState, useMemo } from 'react';
import { Appointment, Venue, ServiceItem, DayName } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Home, Info, Plus, Minus } from 'lucide-react';
import { formatCOP } from '../../utils/scheduleUtils';
import { UPCOMING_DATES } from '../../data/initialData';
import { ContactFields } from './ContactFields';

interface FlowProps {
  venue: Venue;
  services: ServiceItem[];
  onConfirm: (appt: Partial<Appointment>) => void;
  onCancel: () => void;
}

export const AccommodationFlow: React.FC<FlowProps> = ({
  venue, services, onConfirm, onCancel
}) => {
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  
  // Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const extraServices = services.filter(s => s.isActive && s.category === venue.category && (s.name.toLowerCase().includes('extra') || s.name.toLowerCase().includes('bbq') || s.name.toLowerCase().includes('piscina')));
  
  const numNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const inIdx = UPCOMING_DATES.findIndex(d => d.dateKey === checkIn);
    const outIdx = UPCOMING_DATES.findIndex(d => d.dateKey === checkOut);
    return Math.max(0, outIdx - inIdx);
  }, [checkIn, checkOut]);

  const basePrice = (venue.priceLevel === '$$$' ? 450000 : 250000) * (numNights || 1);
  const totalExtraPrice = selectedExtras.reduce((acc, name) => {
    const s = extraServices.find(es => es.name === name);
    return acc + (s?.price || 0);
  }, 0);
  const totalPrice = basePrice + totalExtraPrice;

  const handleNext = () => {
    if (step === 1 && checkIn && checkOut && numNights > 0) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const confirmBooking = () => {
    if (!clientName || !clientPhone) return;
    const apptData: Partial<Appointment> = {
      engineType: 'accommodation',
      subCategory: venue.subCategory,
      service: `Estadía en ${venue.name}`,
      dateKey: checkIn,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestsCount: adults + children,
      guestsBreakdown: { adults, children, pets },
      amenities: selectedExtras,
      price: totalPrice,
      client: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: clientNotes,
    };
    onConfirm(apptData);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 sm:px-6 py-3 pr-14 border-b border-sand-200 dark:border-obsidian-800 bg-white/50 dark:bg-obsidian-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-champagne-600 uppercase tracking-widest">Paso {step} de 4</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alojamiento</span>
        </div>
        <div className="h-1 bg-sand-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-champagne-500" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-12 sm:pb-16 min-h-0">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Selecciona tus fechas</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Check-in</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {UPCOMING_DATES.map(d => (
                      <button
                        key={`in-${d.dateKey}`}
                        onClick={() => setCheckIn(d.dateKey)}
                        className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all glow-up min-h-[44px] ${checkIn === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-lg shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                      >
                        <span className="text-[10px] uppercase opacity-70">{d.shortDay}</span>
                        <span className="text-sm font-black">{d.shortDate.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Check-out</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {UPCOMING_DATES.map(d => {
                      const inIdx = UPCOMING_DATES.findIndex(id => id.dateKey === checkIn);
                      const currentIdx = UPCOMING_DATES.findIndex(id => id.dateKey === d.dateKey);
                      const disabled = checkIn && currentIdx <= inIdx;
                      return (
                        <button
                          key={`out-${d.dateKey}`}
                          disabled={!!(checkIn && currentIdx <= inIdx)}
                          onClick={() => setCheckOut(d.dateKey)}
                          className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all glow-up min-h-[44px] ${!!(checkIn && currentIdx <= inIdx) ? 'opacity-20 cursor-not-allowed' : checkOut === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-lg shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                        >
                          <span className="text-[10px] uppercase opacity-70">{d.shortDay}</span>
                          <span className="text-sm font-black">{d.shortDate.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {numNights > 0 && (
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-center text-xs sm:text-sm font-bold shadow-inner">
                  Total: {numNights} {numNights === 1 ? 'noche' : 'noches'} de estadía
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">¿Cuántas personas vienen?</h3>
              <div className="space-y-3">
                {[
                  { label: 'Adultos', state: adults, setter: setAdults, min: 1 },
                  { label: 'Niños', state: children, setter: setChildren, min: 0 },
                  { label: 'Mascotas', state: pets, setter: setPets, min: 0 }
                ].map(counter => (
                  <div key={counter.label} className="flex items-center justify-between p-4 rounded-2xl border border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900 shadow-sm">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{counter.label}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => counter.setter(Math.max(counter.min, counter.state - 1))} className="w-10 h-10 rounded-full border border-sand-200 dark:border-obsidian-800 flex items-center justify-center hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-colors"><Minus className="w-4 h-4" /></button>
                      <span className="font-mono font-bold w-6 text-center text-base">{counter.state}</span>
                      <button onClick={() => counter.setter(counter.state + 1)} className="w-10 h-10 rounded-full border border-sand-200 dark:border-obsidian-800 flex items-center justify-center hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Servicios adicionales</h3>
              <div className="grid gap-2.5">
                {['Limpieza general', 'Zona BBQ Premium', 'Decoración Cumpleaños', 'Piscina Climatizada'].map(extra => (
                  <button
                    key={extra}
                    onClick={() => setSelectedExtras(prev => prev.includes(extra) ? prev.filter(e => e !== extra) : [...prev, extra])}
                    className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all glow-up flex items-center justify-between min-h-[44px] ${selectedExtras.includes(extra) ? 'border-champagne-500 bg-champagne-500/10 shadow-lg shadow-champagne-500/5' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}
                  >
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{extra}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedExtras.includes(extra) ? 'bg-champagne-500 border-champagne-500 text-slate-950' : 'border-sand-300'}`}>
                      {selectedExtras.includes(extra) && <ArrowRight className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 sm:space-y-6">
              <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-900 text-white space-y-3 relative overflow-hidden shadow-xl border border-white/5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-champagne-500/20 rounded-full blur-2xl opacity-50 pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-champagne-500/10 border border-champagne-500/30 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-champagne-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold text-champagne-400 uppercase tracking-widest block">Resumen de Estadía</span>
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">{venue.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{venue.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-y border-white/10 py-2 text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Entrada</p>
                    <p className="font-bold text-champagne-400">{checkIn}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Salida</p>
                    <p className="font-bold text-champagne-400">{checkOut}</p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Noches: {numNights}</span>
                    <span className="font-mono">{formatCOP(basePrice)}</span>
                  </div>
                  {selectedExtras.length > 0 && (
                    <div className="flex justify-between text-champagne-400 italic">
                      <span>Extras ({selectedExtras.length})</span>
                      <span className="font-mono">+{formatCOP(totalExtraPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="font-bold uppercase tracking-tighter text-xs">Total</span>
                    <span className="font-black text-champagne-400 text-lg sm:text-xl">{formatCOP(totalPrice)}</span>
                  </div>
                </div>
              </div>

              <ContactFields name={clientName} setName={setClientName} phone={clientPhone} setPhone={setClientPhone} email={clientEmail} setEmail={setClientEmail} notes={clientNotes} setNotes={setClientNotes} />

              <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600/80 leading-relaxed italic">
                  * Se requiere un anticipo del 20% para confirmar la reserva. El saldo se paga al ingresar al alojamiento. Política de cancelación: 48 horas antes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 sm:p-5 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/90 dark:bg-obsidian-900/90 flex justify-between items-center gap-3 sticky bottom-0 z-10 backdrop-blur-md shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button onClick={step === 1 ? onCancel : handleBack} className="px-5 py-3.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-2 glow-up min-h-[44px]">
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancelar' : 'Anterior'}</span>
        </button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && (!checkIn || !checkOut || numNights === 0)) || (step === 4 && (!clientName || !clientPhone))} className="flex-1 px-5 py-3.5 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 glow-up min-h-[44px]">
          <span>{step === 4 ? 'Reservar Estadía' : 'Continuar'}</span>
          {step < 4 && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
