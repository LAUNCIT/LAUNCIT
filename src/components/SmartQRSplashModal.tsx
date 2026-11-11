// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Venue } from '../types';
import { 
  Sparkles, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Phone, 
  Share2, 
  Maximize2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getGlobalGlbUrl, FALLBACK_DEMO_GLB, DEFAULT_GLOBAL_GLB } from '../config/arConfig';

interface SmartQRSplashModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onEnterVenue: (venue: Venue) => void;
  onClose: () => void;
}

export const SmartQRSplashModal: React.FC<SmartQRSplashModalProps> = ({
  venue,
  isOpen,
  onEnterVenue,
  onClose,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelSrc, setModelSrc] = useState<string>(getGlobalGlbUrl());
  const [hasModelError, setHasModelError] = useState<boolean>(false);
  const [isArSupported, setIsArSupported] = useState<boolean>(false);
  const [arStatusMessage, setArStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!venue) return;
    setHasModelError(false);
    setModelSrc(getGlobalGlbUrl());

    // Check device capability for WebXR / AR
    if ('xr' in navigator && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsArSupported(supported);
      }).catch(() => {
        setIsArSupported(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      });
    } else {
      setIsArSupported(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }
  }, [venue, isOpen]);

  // Handle Model Loading Error (e.g. if custom GLB fails or is invalid)
  const handleModelError = () => {
    if (modelSrc !== FALLBACK_DEMO_GLB) {
      setHasModelError(true);
      setModelSrc(FALLBACK_DEMO_GLB);
    }
  };

  // Attach native error listener to custom element <model-viewer>
  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    const onNativeError = (e: any) => {
      console.warn('model-viewer error:', e?.detail || e);
      handleModelError();
    };

    mv.addEventListener('error', onNativeError);
    return () => {
      mv.removeEventListener('error', onNativeError);
    };
  }, [modelSrc]);

  // Trigger Native AR Mode
  const handleActivateAr = () => {
    const mv = modelViewerRef.current;
    if (mv && typeof mv.activateAR === 'function') {
      try {
        mv.activateAR();
      } catch (err) {
        setArStatusMessage('Abre esta página en tu celular para activar la cámara en Realidad Aumentada.');
      }
    } else {
      // Find internal ar-button slot if present
      const arBtn = mv?.shadowRoot?.querySelector('#ar-button') || mv?.querySelector('[slot="ar-button"]');
      if (arBtn) {
        arBtn.click();
      } else {
        setArStatusMessage('Para experimentar Realidad Aumentada, abre este enlace desde un celular Android o iPhone.');
      }
    }
  };

  const handleShare = () => {
    if (!venue) return;
    const url = `${window.location.origin}/?negocio=${encodeURIComponent(venue.name)}`;
    if (navigator.share) {
      navigator.share({
        title: `${venue.name} — Experiencia AR Launcit`,
        text: `Mira la experiencia 3D y Realidad Aumentada de ${venue.name} en Launcit:`,
        url,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setArStatusMessage('¡Enlace de experiencia AR copiado al portapapeles!');
      setTimeout(() => setArStatusMessage(null), 3000);
    }
  };

  if (!isOpen || !venue) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      >
        {/* Glow ambient background lights */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-champagne-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full bg-obsidian-900 border border-sand-200/15 dark:border-obsidian-800 rounded-[32px] sm:rounded-[36px] p-5 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden my-auto">
          
          {/* Top Bar: Brand Badge & Close */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-champagne-500/10 border border-champagne-500/25 text-champagne-400 text-[10px] font-mono font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-champagne-400" />
              <span>LAUNCI / {venue.categoryLabel || venue.category}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                title="Compartir enlace del negocio"
                className="w-9 h-9 rounded-full bg-obsidian-800 border border-obsidian-750 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Cerrar"
                className="w-9 h-9 rounded-full bg-obsidian-800 border border-obsidian-750 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scanned Venue Presentation & Welcome */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {venue.name}
            </h1>
            <p className="text-xs font-bold text-champagne-400 tracking-wider uppercase font-mono">
              Bienvenido a una nueva experiencia con LAUNCI
            </p>
            {venue.address && (
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-champagne-500 shrink-0" />
                <span className="truncate max-w-xs">{venue.address}</span>
              </p>
            )}
          </div>

          {/* 3D Model Viewer with Google <model-viewer> (Global Launcit 3D Logo) */}
          <div className="relative w-full h-64 sm:h-72 rounded-3xl bg-gradient-to-b from-obsidian-950 to-obsidian-900 border border-champagne-500/20 shadow-inner overflow-hidden flex items-center justify-center group">
            
            {/* Interactive hint tag */}
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg bg-obsidian-900/80 backdrop-blur-md border border-white/10 text-[9px] font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
              <Maximize2 className="w-3 h-3 text-champagne-400" />
              <span>Gira 360° con tu dedo</span>
            </div>

            {/* Global Model Viewer element with native AR capabilities */}
            <model-viewer
              ref={modelViewerRef}
              src={modelSrc}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              rotation-per-second="25deg"
              shadow-intensity="1.5"
              environment-image="neutral"
              exposure="1.0"
              touch-action="pan-y"
              alt="Logotipo 3D oficial de Launcit"
              onError={handleModelError}
              style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            >
              {/* Invisible fallback AR slot handled by main AR button */}
              <button slot="ar-button" className="hidden" aria-hidden="true" />
            </model-viewer>

            {/* Fallback Notice if local /logo_launcit.glb is not yet placed */}
            {hasModelError && (
              <div className="absolute bottom-2 inset-x-2 z-10 p-2 rounded-xl bg-amber-950/85 border border-amber-500/40 text-[10px] text-amber-200 flex items-center gap-2 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-left leading-tight">
                  Mostrando modelo demo. Coloca <strong>logo_launcit.glb</strong> en la carpeta <strong>/public</strong> para ver tu logo propio.
                </span>
              </div>
            )}
          </div>

          {/* Status notification toast inside modal */}
          {arStatusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-[11px] text-indigo-200 text-center font-medium"
            >
              {arStatusMessage}
            </motion.div>
          )}

          {/* Action Buttons Section */}
          <div className="space-y-3 pt-1">
            {/* PRIMARY BUTTON 1: Realidad Aumentada (AR) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleActivateAr}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all glow-up"
            >
              <Camera className="w-5 h-5 text-indigo-200 animate-pulse" />
              <span>Ver en tu espacio (AR)</span>
            </motion.button>

            {/* PRIMARY BUTTON 2: Entrar al Negocio */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onEnterVenue(venue)}
              className="w-full py-3.5 px-6 rounded-2xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-champagne-500/20 transition-all"
            >
              <span>Entrar al Negocio</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Business Contact Footer Info */}
          <div className="pt-2 border-t border-sand-200/10 dark:border-obsidian-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[10px]">Launcit WebAR Engine</span>
            </div>
            {venue.phone && (
              <a
                href={`tel:${venue.phone}`}
                className="flex items-center gap-1 text-champagne-400 hover:underline font-mono text-[10px]"
              >
                <Phone className="w-3 h-3" />
                <span>{venue.phone}</span>
              </a>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
