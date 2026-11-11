import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem, DayName } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, HeartPulse, Info, Star } from 'lucide-react';
import { formatCOP } from '../../utils/scheduleUtils';
import { UPCOMING_DATES, TIME_SLOTS } from '../../data/initialData';
import { ContactFields } from './ContactFields';

interface FlowProps {
  venue: Venue;
  services: ServiceItem[];
  onConfirm: (appt: Partial<Appointment>) => void;
  onCancel: () => void;
}

export const SportsFlow: React.FC<FlowProps> = ({
  venue, services, onConfirm, onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<ServiceItem | null>(null);
  const [modality, setModality] = useState<'pase' | 'membresia' | 'clase'>('pase');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const activities = services.filter(s => s.isActive && s.category === venue.category);

  const handleNext = () => {
    if (step === 1 && selectedActivity) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const confirmBooking = () => {
    if (!selectedActivity || !clientName || !clientPhone) return;
    const apptData: Partial<Appointment> = {
      engineType: 'sports',
      subCategory: venue.subCategory,
      service: selectedActivity.name,
      modality,
      dateKey: modality === 'membresia' ? 'Inicia hoy' : selectedDate,
      time: selectedTime,
      price: selectedActivity.price,
      client: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: clientNotes,
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
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">¿Qué actividad deseas realizar?</h3>
              <div className="grid gap-3">
                {activities.map(a => (
                  <button key={a.id} onClick={() => setSelectedActivity(a)} className={`p-5 rounded-2xl border text-left transition-all glow-up ${selectedActivity?.id === a.id ? 'border-champagne-500 bg-champagne-500/10 shadow-lg shadow-champagne-500/5' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}>
                    <div className="flex justify-between items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{a.name}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">{a.desc}</p>
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white shrink-0 bg-sand-100 dark:bg-obsidian-800 px-3 py-1.5 rounded-xl">{formatCOP(a.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Selecciona la modalidad</h3>
              <div className="grid gap-4">
                {[
                  { id: 'pase', label: 'Pase Diario', desc: 'Acceso único para un entrenamiento completo hoy' },
                  { id: 'clase', label: 'Clase / Sesión', desc: 'Reserva tu lugar en una clase grupal o personalizada' },
                  { id: 'membresia', label: 'Plan Mensual', desc: 'Activa tu membresía y disfruta de todos los beneficios' }
                ].map(m => (
                  <button key={m.id} onClick={() => setModality(m.id as any)} className={`p-5 rounded-3xl border text-left transition-all glow-up ${modality === m.id ? 'border-champagne-500 bg-champagne-500/10 shadow-lg shadow-champagne-500/5' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{m.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">{m.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {modality === 'membresia' ? (
                <div className="p-8 rounded-[40px] bg-emerald-500/5 border border-emerald-500/20 text-center space-y-6 shadow-inner">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <Star className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-xl text-slate-900 dark:text-white">Activación Inmediata</h4>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[250px] mx-auto font-medium">Tu plan quedará activo desde el momento de la confirmación. ¡Prepárate para entrenar!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Fecha de entrenamiento</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      {UPCOMING_DATES.map(d => (
                        <button key={d.dateKey} onClick={() => setSelectedDate(d.dateKey)} className={`flex-shrink-0 w-16 p-4 rounded-2xl border flex flex-col items-center gap-1.5 transition-all glow-up ${selectedDate === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-lg shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                          <span className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">{d.shortDay}</span>
                          <span className="text-base font-black">{d.shortDate.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-widest text-slate-500">Horario disponible</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map(t => (
                        <button key={t} onClick={() => setSelectedTime(t)} className={`p-3 rounded-2xl border text-xs font-bold font-mono transition-all glow-up ${selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-md shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-950 text-white space-y-6 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-champagne-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-champagne-500/20 flex items-center justify-center border border-champagne-500/30">
                    <HeartPulse className="w-8 h-8 text-champagne-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-champagne-400 uppercase tracking-widest">Resumen de Actividad</p>
                    <h4 className="text-xl font-bold truncate">{selectedActivity?.name}</h4>
                    <p className="text-xs text-slate-400 uppercase font-mono tracking-tighter mt-0.5">{modality} · {venue.name}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-6 border-t border-white/10 relative z-10">
                  {modality !== 'membresia' && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Fecha y Hora</span>
                      <span className="text-white font-mono font-bold tracking-tighter">{selectedDate} · {selectedTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="font-black uppercase tracking-tighter text-sm">Valor Final</span>
                    <span className="font-black text-champagne-400 text-2xl">{formatCOP(selectedActivity?.price || 0)}</span>
                  </div>
                </div>
              </div>

              <ContactFields name={clientName} setName={setClientName} phone={clientPhone} setPhone={setClientPhone} email={clientEmail} setEmail={setClientEmail} notes={clientNotes} setNotes={setClientNotes} />

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600/80 leading-relaxed font-medium">
                  Recomendación: Llegar 10 min antes para el registro. En clases personalizadas, la inasistencia sin aviso previo de 4h se cobrará como realizada.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/50 dark:bg-obsidian-900/50 flex justify-between items-center gap-3 sticky bottom-0 z-10 backdrop-blur-md">
        <button onClick={step === 1 ? onCancel : handleBack} className="px-6 py-4 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-2 glow-up"><ArrowLeft className="w-4 h-4" /><span>{step === 1 ? 'Cancelar' : 'Anterior'}</span></button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && !selectedActivity) || (step === 3 && modality !== 'membresia' && (!selectedDate || !selectedTime)) || (step === 4 && (!clientName || !clientPhone))} className="flex-1 px-6 py-4 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 glow-up"><span>{step === 4 ? 'Confirmar Reserva' : 'Continuar'}</span>{step < 4 && <ArrowRight className="w-4 h-4" />}</button>
      </div>
    </div>
  );
};
