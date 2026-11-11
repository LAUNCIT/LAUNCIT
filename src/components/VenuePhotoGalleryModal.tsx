import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Phone,
  CalendarCheck,
  Camera,
} from 'lucide-react';
import { Venue } from '../types';
import { CATEGORY_LABELS } from '../data/initialData';
import { ResilientImage } from './ResilientImage';

interface VenuePhotoGalleryModalProps {
  isOpen: boolean;
  venue: Venue | null;
  onClose: () => void;
  onBookVenue: (venue: Venue) => void;
}

export const VenuePhotoGalleryModal: React.FC<VenuePhotoGalleryModalProps> = ({
  isOpen,
  venue,
  onClose,
  onBookVenue,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    setActivePhotoIdx(0);
  }, [venue]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && venue?.photos && venue.photos.length > 1) {
        setActivePhotoIdx((prev) => (prev + 1) % venue.photos!.length);
      }
      if (e.key === 'ArrowLeft' && venue?.photos && venue.photos.length > 1) {
        setActivePhotoIdx((prev) =>
          prev === 0 ? venue.photos!.length - 1 : prev - 1
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, venue, onClose]);

  if (!isOpen || !venue) return null;

  const photosList =
    venue.photos && venue.photos.length > 0 ? venue.photos : [venue.image];
  const currentPhoto = photosList[activePhotoIdx] || venue.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-obsidian-900 border border-sand-200 dark:border-obsidian-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="venue-gallery-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-sand-200 dark:border-obsidian-800 flex items-center justify-between gap-3 bg-white/50 dark:bg-obsidian-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-champagne-500/15 border border-champagne-500/30 flex items-center justify-center text-champagne-400 shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="venue-gallery-title"
                  className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate"
                >
                  {venue.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sand-100 dark:bg-obsidian-800 text-slate-500 dark:text-slate-400 shrink-0">
                  {CATEGORY_LABELS[venue.category]}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-champagne-500" />
                  {venue.location}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 text-champagne-400 font-mono font-bold">
                  <Star className="w-3 h-3 fill-champagne-400" />
                  {venue.rating.toFixed(1)}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-sand-100 dark:bg-obsidian-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Cerrar galería"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Photo Viewer Area */}
        <div className="relative flex-1 min-h-[180px] sm:min-h-[380px] max-h-[40vh] sm:max-h-[500px] bg-obsidian-950 flex items-center justify-center overflow-hidden">
          <ResilientImage
            src={currentPhoto}
            alt={`${venue.name} foto ${activePhotoIdx + 1}`}
            fallbackLabel={venue.name}
            className="w-full h-full max-h-full object-contain sm:object-cover"
          />

          {/* Navigation Arrows (if > 1 photo) */}
          {photosList.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActivePhotoIdx((prev) =>
                    prev === 0 ? photosList.length - 1 : prev - 1
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 border border-white/20 text-white flex items-center justify-center shadow-lg transition-all"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActivePhotoIdx((prev) => (prev + 1) % photosList.length)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/70 hover:bg-slate-950 border border-white/20 text-white flex items-center justify-center shadow-lg transition-all"
                aria-label="Siguiente foto"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Badge: Foto X de Y */}
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-sm border border-white/10 text-white font-mono text-[11px] font-bold">
            {activePhotoIdx + 1} / {photosList.length}
          </div>
        </div>

        {/* Thumbnails Strip */}
        {photosList.length > 1 && (
          <div className="px-5 py-3 bg-sand-100/60 dark:bg-obsidian-950/60 border-t border-b border-sand-200 dark:border-obsidian-800 flex items-center gap-2.5 overflow-x-auto hide-scrollbar">
            {photosList.map((url, idx) => {
              const isSelected = idx === activePhotoIdx;
              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-14 h-10 sm:w-16 sm:h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    isSelected
                      ? 'border-champagne-500 scale-105 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <ResilientImage
                    src={url}
                    alt={`Miniatura ${idx + 1}`}
                    fallbackLabel={venue.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Venue Info & Call To Action */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-obsidian-900">
          <div className="space-y-1 max-w-xl">
            {venue.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {venue.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
              {venue.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-champagne-500 shrink-0" />
                  {venue.address}
                </span>
              )}
              {venue.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {venue.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-sand-200 dark:border-obsidian-750 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-champagne-500 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBookVenue(venue);
              }}
              className="px-5 py-2.5 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-2 shadow-gold-subtle"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Reservar en este Local</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
