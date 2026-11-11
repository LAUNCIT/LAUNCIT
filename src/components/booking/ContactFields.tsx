import React from 'react';
import { User, MessageCircle, Mail, FileText } from 'lucide-react';

interface ContactFieldsProps {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

export const ContactFields: React.FC<ContactFieldsProps> = ({
  name, setName, phone, setPhone, email, setEmail, notes, setNotes
}) => {
  return (
    <div className="space-y-4 pt-4 border-t border-sand-200 dark:border-obsidian-800">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-champagne-600" />
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Tus datos de contacto</h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Completo *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              required
              placeholder="Ej. Juan Martínez"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-champagne-500/20 focus:border-champagne-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp / Móvil *</label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="tel" 
              required
              placeholder="+57 312 456 7890"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-sm font-mono focus:ring-2 focus:ring-champagne-500/20 focus:border-champagne-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Correo Electrónico (Opcional)</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="email" 
            placeholder="tu@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-champagne-500/20 focus:border-champagne-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Notas o requerimientos</label>
        <div className="relative">
          <FileText className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
          <textarea 
            rows={2}
            placeholder="Algún detalle adicional que debamos saber..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 text-sm focus:ring-2 focus:ring-champagne-500/20 focus:border-champagne-500 outline-none transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
};
