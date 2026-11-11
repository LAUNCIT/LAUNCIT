import React, { useState, useMemo } from 'react';
import { Appointment, Venue, ServiceItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Car, Info, MapPin } from 'lucide-react';
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

  const vehicles = services.filter(s => s.isActive && s.category === venue.category);

  const numDays = useMemo(() => {
    if (!pickupDate || !returnDate) return 0;
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
      vehicleDetails: { brand: 'Launci Premium', model: selectedVehicle.name },
      price: totalPrice,
      amenities: extras,
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alquiler</span>
        </div>
        <div className="h-1 bg-sand-200 dark:bg-obsidian-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-champagne-500" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 sm:pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Selecciona tu vehículo</h3>
              <div className="grid gap-3">
                {vehicles.map(v => (
                  <button key={v.id} onClick={() => setSelectedVehicle(v)} className={`p-5 rounded-3xl border text-left transition-all glow-up ${selectedVehicle?.id === v.id ? 'border-champagne-500 bg-champagne-500/10 shadow-lg shadow-champagne-500/5' : 'border-sand-200 dark:border-obsidian-800 hover:border-champagne-500/50'}`}>
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-14 bg-sand-100 dark:bg-obsidian-800 rounded-2xl flex items-center justify-center border border-sand-200 dark:border-obsidian-750 shadow-inner"><Car className="w-8 h-8 text-slate-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-slate-900 dark:text-white truncate">{v.name}</p>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{v.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-sm text-champagne-600">{formatCOP(v.price)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">/ día</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Fechas y Lugar</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 rounded-3xl bg-sand-50 dark:bg-obsidian-850 border border-sand-200 dark:border-obsidian-800 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Recogida</label><select value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-3 rounded-2xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold">{UPCOMING_DATES.map(d => <option key={d.dateKey} value={d.dateKey}>{d.dateKey}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Hora</label><select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-3 rounded-2xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold font-mono">{['08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Devolución</label><select value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-3 rounded-2xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold">{UPCOMING_DATES.map(d => <option key={d.dateKey} value={d.dateKey}>{d.dateKey}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Hora</label><select value={returnTime} onChange={e => setReturnTime(e.target.value)} className="w-full bg-white dark:bg-obsidian-900 p-3 rounded-2xl border border-sand-200 dark:border-obsidian-800 text-xs font-bold font-mono">{['08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '04:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Lugar de entrega</label>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    {['Sede Principal', 'Aeropuerto JMC', 'A Domicilio'].map(loc => (
                      <button key={loc} onClick={() => setPickupLoc(loc)} className={`flex-1 p-3 rounded-2xl border text-[10px] font-bold transition-all glow-up ${pickupLoc === loc ? 'border-champagne-500 bg-champagne-500 text-slate-950 shadow-md shadow-champagne-500/20' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900 text-slate-600'}`}>{loc}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Servicios opcionales</h3>
              <div className="grid gap-3">
                {['Seguro Todo Riesgo', 'Conductor Adicional', 'GPS Satelital', 'Silla para Bebé'].map(ex => (
                  <button key={ex} onClick={() => setExtras(prev => prev.includes(ex) ? prev.filter(e => e !== ex) : [...prev, ex])} className={`p-5 rounded-3xl border text-left transition-all glow-up flex items-center justify-between ${extras.includes(ex) ? 'border-champagne-500 bg-champagne-500/10 shadow-lg shadow-champagne-500/5' : 'border-sand-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-900'}`}>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{ex}</span>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${extras.includes(ex) ? 'bg-champagne-500 border-champagne-500 text-slate-950 shadow-md shadow-champagne-500/20' : 'border-sand-300'}`}>{extras.includes(ex) && <ArrowRight className="w-3 h-3" />}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-champagne-500/10 rounded-full blur-3xl" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10"><Car className="w-8 h-8 text-champagne-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-champagne-400 uppercase tracking-widest">Contrato de Alquiler</p>
                    <h4 className="text-xl font-bold truncate">{selectedVehicle?.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {pickupLoc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 font-mono relative z-10">
                  <div><p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Entrega</p><p className="text-sm font-bold text-champagne-400">{pickupDate}</p><p className="text-[10px] text-slate-400">{pickupTime}</p></div>
                  <div><p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Devolución</p><p className="text-sm font-bold text-champagne-400">{returnDate}</p><p className="text-[10px] text-slate-400">{returnTime}</p></div>
                </div>
                <div className="space-y-3 pt-2 relative z-10">
                  <div className="flex justify-between text-xs text-slate-400"><span>Total días: {numDays}</span><span className="font-mono">{formatCOP(totalPrice)}</span></div>
                  <div className="flex justify-between pt-4 border-t border-white/10 items-center"><span className="font-black uppercase tracking-tighter text-sm">Valor Total</span><span className="font-black text-champagne-400 text-2xl">{formatCOP(totalPrice)}</span></div>
                </div>
              </div>

              <ContactFields name={clientName} setName={setClientName} phone={clientPhone} setPhone={setClientPhone} email={clientEmail} setEmail={setClientEmail} notes={clientNotes} setNotes={setClientNotes} />

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3 shadow-inner">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600/80 leading-tight italic">Requisitos: Ser mayor de 21 años con licencia vigente y tarjeta de crédito para depósito de garantía.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-sand-200 dark:border-obsidian-800 bg-sand-50/50 dark:bg-obsidian-900/50 flex justify-between items-center gap-3 sticky bottom-0 z-10 backdrop-blur-md">
        <button onClick={step === 1 ? onCancel : handleBack} className="px-6 py-4 rounded-2xl text-xs font-bold text-slate-500 hover:bg-sand-100 dark:hover:bg-obsidian-800 transition-all flex items-center gap-2 glow-up"><ArrowLeft className="w-4 h-4" /><span>{step === 1 ? 'Cancelar' : 'Anterior'}</span></button>
        <button onClick={step === 4 ? confirmBooking : handleNext} disabled={(step === 1 && !selectedVehicle) || (step === 2 && (!pickupDate || !returnDate)) || (step === 4 && (!clientName || !clientPhone))} className="flex-1 px-6 py-4 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-champagne-500/20 flex items-center justify-center gap-2 glow-up"><span>{step === 4 ? 'Confirmar Alquiler' : 'Continuar'}</span>{step < 4 && <ArrowRight className="w-4 h-4" />}</button>
      </div>
    </div>
  );
};
