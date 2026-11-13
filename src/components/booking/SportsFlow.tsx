import React, { useState } from 'react';
import { Appointment, Venue, ServiceItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Calendar, HeartPulse, Info, Star } from 'lucide-react';
import { formatCOP } from '../../utils/scheduleUtils';
import { UPCOMING_DATES } from '../../data/initialData';
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
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);

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
      venueId: venue.id,
      consentWhatsApp,
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
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">¿Qué actividad deseas realizar?</h3>
              <div className="grid gap-2.5">
                {activities.map(a => (
                  <button key={a.id} onClick={() => setSelectedActivity(a)} className={`p-3.5 rounded-2xl border text-left transition-all ${selectedActivity?.id === a.id ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}>
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{a.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.desc}</p>
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white shrink-0 bg-sand-100 dark:bg-obsidian-800 px-2.5 py-1 rounded-xl">{formatCOP(a.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Selecciona la modalidad</h3>
              <div className="grid gap-3">
                {[
                  { id: 'pase', label: 'Pase Diario', desc: 'Acceso único para un entrenamiento completo hoy' },
                  { id: 'clase', label: 'Clase / Sesión', desc: 'Reserva tu lugar en una clase grupal o personalizada' },
                  { id: 'membresia', label: 'Plan Mensual', desc: 'Activa tu membresía y disfruta de todos los beneficios' }
                ].map(m => (
                  <button key={m.id} onClick={() => setModality(m.id as any)} className={`p-4 rounded-2xl border text-left transition-all ${modality === m.id ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{m.label}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {modality === 'membresia' ? (
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Star className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Activación Inmediata</h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[240px] mx-auto">Tu plan quedará activo desde el momento de la confirmación.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Fecha de entrenamiento</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                      {UPCOMING_DATES.map(d => (
                        <button key={d.dateKey} onClick={() => setSelectedDate(d.dateKey)} className={`flex-shrink-0 w-16 p-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all ${selectedDate === d.dateKey ? 'border-champagne-500 bg-champagne-500 text-slate-950 font-bold shadow-md' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                          <span className="text-[10px] uppercase font-bold opacity-60">{d.shortDay}</span>
                          <span className="text-base font-black">{d.shortDate.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider ml-1">Horarios disponibles</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {['06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map(t => (
                        <button key={t} onClick={() => setSelectedTime(t)} className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${selectedTime === t ? 'bg-slate-900 text-white dark:bg-champagne-500 dark:text-slate-950 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>{t}</button>
                      ))}
                    </div>
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
                    <HeartPulse className="w-5 h-5 text-champagne-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{modality} · {venue.name}</p>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{selectedActivity?.name}</h4>
                  </div>
                  <span className="text-sm font-black text-champagne-600 shrink-0">
                    {formatCOP(selectedActivity?.price || 0)}
                  </span>
                </div>

                {modality !== 'membresia' && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-sand-200 dark:border-obsidian-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-champagne-600" />
                    <span>{selectedDate}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">· {selectedTime}</span>
                  </div>
                )}
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
        <button onClick={step === 1 ? onCancel : handleBack} className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-1.5 min-h-[44px]"><ArrowLeft className="w-4 h-4" /><span>{step === 1 ? 'Cancelar' : 'Anterior'}</span></button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && !selectedActivity) || (step === 4 && (!clientName || !clientPhone || !consentWhatsApp))} className="flex-1 max-w-xs px-5 py-3.5 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 min-h-[44px]"><span>{step === 4 ? 'Confirmar Reserva' : 'Continuar'}</span>{step < 4 && <ArrowRight className="w-4 h-4" />}</button>
      </div>
    </div>
  );
};
