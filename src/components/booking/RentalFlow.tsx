import React, { useState, useMemo } from 'react';
import { Appointment, Venue, ServiceItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Car, Calendar, MapPin, Info } from 'lucide-react';
import { formatCOP } from '../../utils/scheduleUtils';
import { UPCOMING_DATES } from '../../data/initialData';
import { ContactFields } from './ContactFields';

interface FlowProps {
  venue: Venue;
  services: ServiceItem[];
  onConfirm: (appt: Partial<Appointment>) => void;
  onCancel: () => void;
}

export const RentalFlow: React.FC<FlowProps> = ({
  venue, services, onConfirm, onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<ServiceItem | null>(null);
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState('09:00 AM');
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnTime, setReturnTime] = useState('09:00 AM');
  const [pickupLoc, setPickupLoc] = useState('Sede Principal');
  const [extras, setExtras] = useState<string[]>([]);
  
  // Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [consentWhatsApp, setConsentWhatsApp] = useState(false);

  const vehicles = services.filter(s => s.isActive && s.category === venue.category);

  const numDays = useMemo(() => {
    if (!pickupDate || !returnDate) return 1;
    const pIdx = UPCOMING_DATES.findIndex(d => d.dateKey === pickupDate);
    const rIdx = UPCOMING_DATES.findIndex(d => d.dateKey === returnDate);
    return Math.max(1, rIdx - pIdx);
  }, [pickupDate, returnDate]);

  const totalPrice = (selectedVehicle?.price || 150000) * numDays;

  const handleNext = () => {
    if (step === 1 && selectedVehicle) setStep(2);
    else if (step === 2 && pickupDate && returnDate) setStep(3);
    else if (step === 3) setStep(4);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const confirmBooking = () => {
    if (!selectedVehicle || !clientName || !clientPhone) return;
    const apptData: Partial<Appointment> = {
      engineType: 'rental',
      subCategory: venue.subCategory,
      service: selectedVehicle.name,
      dateKey: pickupDate,
      pickupTime,
      returnTime,
      pickupLocation: pickupLoc,
      vehicleDetails: { brand: 'Launcit Premium', model: selectedVehicle.name },
      price: totalPrice,
      amenities: extras,
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
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Selecciona tu vehículo</h3>
              <div className="grid gap-2.5">
                {vehicles.map(v => (
                  <button key={v.id} onClick={() => setSelectedVehicle(v)} className={`p-3.5 rounded-2xl border text-left transition-all ${selectedVehicle?.id === v.id ? 'border-champagne-500 bg-champagne-500/10 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 bg-sand-100 dark:bg-obsidian-800 rounded-xl flex items-center justify-center border border-sand-200 dark:border-obsidian-750 shrink-0"><Car className="w-6 h-6 text-slate-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{v.name}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{v.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs sm:text-sm text-champagne-600">{formatCOP(v.price)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">/ día</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Fechas y Lugar</h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block">Recogida</label><select value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-2.5 rounded-xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold text-slate-900 dark:text-white">{UPCOMING_DATES.map(d => <option key={d.dateKey} value={d.dateKey}>{d.dateKey}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block">Hora</label><select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-2.5 rounded-xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold font-mono text-slate-900 dark:text-white">{['08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block">Devolución</label><select value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-2.5 rounded-xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold text-slate-900 dark:text-white">{UPCOMING_DATES.map(d => <option key={d.dateKey} value={d.dateKey}>{d.dateKey}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block">Hora</label><select value={returnTime} onChange={e => setReturnTime(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-2.5 rounded-xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold font-mono text-slate-900 dark:text-white">{['08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-wider block">Lugar de entrega</label>
                  <div className="flex gap-1.5">
                    {['Sede Principal', 'Aeropuerto JMC', 'A Domicilio'].map(loc => (
                      <button key={loc} onClick={() => setPickupLoc(loc)} className={`flex-1 p-2.5 rounded-xl border text-[10px] font-bold transition-all ${pickupLoc === loc ? 'border-champagne-500 bg-champagne-500 text-slate-950 shadow-sm' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900 text-slate-300'}`}>{loc}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">Servicios opcionales</h3>
              <div className="grid gap-2.5">
                {['Seguro Todo Riesgo', 'Conductor Adicional', 'GPS Satelital', 'Silla para Bebé'].map(ex => (
                  <button key={ex} onClick={() => setExtras(prev => prev.includes(ex) ? prev.filter(e => e !== ex) : [...prev, ex])} className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${extras.includes(ex) ? 'border-champagne-500 bg-champagne-500/10' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{ex}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${extras.includes(ex) ? 'bg-champagne-500 border-champagne-500 text-slate-950' : 'border-sand-300'}`}>{extras.includes(ex) && <ArrowRight className="w-3 h-3" />}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Compact Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-obsidian-900 flex items-center justify-center border border-sand-200 dark:border-obsidian-800 shadow-sm shrink-0">
                    <Car className="w-5 h-5 text-champagne-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{venue.subCategory || 'Alquiler'}</p>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{selectedVehicle?.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{pickupLoc}</p>
                  </div>
                  <span className="text-sm font-black text-champagne-600 shrink-0">
                    {formatCOP(totalPrice)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sand-200 dark:border-obsidian-800 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-champagne-600" />
                    <span>{pickupDate} al {returnDate}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white ml-1">({numDays} {numDays === 1 ? 'día' : 'días'})</span>
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
        <button onClick={step === 1 ? onCancel : handleBack} className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-1.5 min-h-[44px]"><ArrowLeft className="w-4 h-4" /><span>{step === 1 ? 'Cancelar' : 'Anterior'}</span></button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && !selectedVehicle) || (step === 2 && (!pickupDate || !returnDate)) || (step === 4 && (!clientName || !clientPhone || !consentWhatsApp))} className="flex-1 max-w-xs px-5 py-3.5 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 min-h-[44px]"><span>{step === 4 ? 'Confirmar Alquiler' : 'Continuar'}</span>{step < 4 && <ArrowRight className="w-4 h-4" />}</button>
      </div>
    </div>
  );
};
