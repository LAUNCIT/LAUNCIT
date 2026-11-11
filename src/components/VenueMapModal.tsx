import React from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Venue } from '../types';
import { X } from 'lucide-react';

interface VenueMapModalProps {
  venue: Venue | null;
  onClose: () => void;
}

export const VenueMapModal: React.FC<VenueMapModalProps> = ({ venue, onClose }) => {
  if (!venue) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl max-w-2xl w-full p-5 border border-sand-200 dark:border-obsidian-800 shadow-2xl flex flex-col h-[80vh]">
        <div className="flex items-center justify-between pb-4 border-b border-sand-200 dark:border-obsidian-800">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Cómo llegar: {venue.name}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-sand-100 dark:hover:bg-obsidian-750">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 mt-4 rounded-xl overflow-hidden relative border border-sand-200 dark:border-obsidian-800">
          <Map
            defaultZoom={15}
            defaultCenter={{ lat: venue.lat || 6.2442, lng: venue.lng || -75.5736 }}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {venue.lat && venue.lng && (
              <AdvancedMarker position={{ lat: venue.lat, lng: venue.lng }} />
            )}
          </Map>
        </div>
        <div className="pt-3 border-t border-sand-200 dark:border-obsidian-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 truncate max-w-sm">
            {venue.address || venue.location}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address || venue.location || venue.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-champagne-500 hover:bg-champagne-400 text-slate-950 font-bold transition-colors text-center shrink-0"
          >
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
};
