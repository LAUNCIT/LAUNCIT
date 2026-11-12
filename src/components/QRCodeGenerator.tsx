import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, ExternalLink, Check, Eye, Sparkles, Camera } from 'lucide-react';
import { Venue } from '../types';

export interface QRCodeGeneratorProps {
  venue: Venue;
  onShowToast?: (msg: string) => void;
  allVenues?: Venue[];
  onSelectVenue?: (venueId: string) => void;
  className?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  venue,
  onShowToast,
  allVenues,
  onSelectVenue,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const qrSvgId = `qr-svg-${venue.id}`;

  // Automatically generate the unique URL for ver.html respecting repository subpaths (e.g. GitHub Pages /LAUNCIT/)
  const getFullArUrl = () => {
    let base = `./ver.html?negocio=${encodeURIComponent(venue.name)}`;
    if (venue.logo) {
      base += `&logo=${encodeURIComponent(venue.logo)}`;
    }
    if (typeof window === 'undefined') return base;
    const pathname = window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/$/, '');
    let url = `${window.location.origin}${pathname}/ver.html?negocio=${encodeURIComponent(venue.name)}`;
    if (venue.logo) {
      url += `&logo=${encodeURIComponent(venue.logo)}`;
    }
    return url;
  };
  const arUrl = getFullArUrl();

  // Download QR Code as High-Resolution PNG (1000x1000px)
  const handleDownloadPNG = () => {
    const svgElement = document.getElementById(qrSvgId);
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // High resolution for clean print and scans
        canvas.width = 1000;
        canvas.height = 1000;
        if (ctx) {
          // Clean white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 1000, 1000);
          ctx.drawImage(img, 50, 50, 900, 900);
        }
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const safeName = venue.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        downloadLink.download = `QR_Launcit_${safeName}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        onShowToast?.(`Código QR PNG de "${venue.name}" descargado.`);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Error generating PNG from QR SVG:', err);
    }
  };

  // Download QR Code as Vector SVG
  const handleDownloadSVG = () => {
    const svgElement = document.getElementById(qrSvgId);
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      const safeName = venue.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      downloadLink.download = `QR_Launcit_${safeName}.svg`;
      downloadLink.href = url;
      downloadLink.click();
      URL.revokeObjectURL(url);
      onShowToast?.(`Código QR SVG vectorial de "${venue.name}" descargado.`);
    } catch (err) {
      console.error('Error generating SVG download:', err);
    }
  };

  // Copy Link to Clipboard
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(arUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast?.('¡Enlace WebAR copiado al portapapeles!');
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-obsidian-900 to-obsidian-900 border border-indigo-500/30 shadow-xl relative overflow-hidden w-full min-w-0 flex flex-col justify-between space-y-3.5 ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-3 min-w-0 w-full">
        {/* Header: Badge & Venue Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Código QR Activo</span>
            </span>
          </div>

          {allVenues && allVenues.length > 1 && onSelectVenue && (
            <div className="flex items-center gap-1.5 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Negocio:
              </label>
              <select
                value={venue.id}
                onChange={(e) => onSelectVenue(e.target.value)}
                className="bg-obsidian-850 border border-indigo-500/30 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-champagne-500 max-w-[150px] truncate"
              >
                {allVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Business Title */}
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight break-words truncate">
            {venue.name}
          </h2>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Escaneo directo hacia la Realidad Aumentada de este local.
          </p>
        </div>

        {/* Compact WebAR Link Box */}
        <div className="p-2 rounded-xl bg-obsidian-950/80 border border-indigo-500/25 flex items-center justify-between gap-2 min-w-0 w-full">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
              Enlace Web AR Único
            </p>
            <p className="font-mono text-[11px] text-indigo-300 truncate">
              {arUrl}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
              title="Copiar enlace WebAR"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <a
              href={arUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors"
              title="Abrir página WebAR del cliente (ver.html)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* QR Code Card (Centered & Responsive) */}
        <div className="flex flex-col items-center justify-center my-1">
          <div className="w-full max-w-[210px] p-3 bg-white rounded-xl shadow-lg text-slate-900 text-center flex flex-col items-center justify-center mx-auto">
            <p className="text-[9px] font-black tracking-widest text-indigo-600 uppercase">LAUNCIT AR</p>
            <p className="text-[10px] font-bold text-slate-800 truncate max-w-[170px] mx-auto mb-1">
              {venue.name}
            </p>

            <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex items-center justify-center max-w-full">
              <QRCodeSVG
                id={qrSvgId}
                value={arUrl}
                size={135}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: venue.logo || './logo.png',
                  x: undefined,
                  y: undefined,
                  height: 28,
                  width: 28,
                  excavate: true,
                }}
                className="max-w-full h-auto"
              />
            </div>

            <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
              Escanea y descubre
            </p>
          </div>
        </div>

        {/* Action & Download Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSVG}
            className="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 font-bold text-xs uppercase tracking-wider hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>

          <a
            href={arUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-champagne-500/50 bg-white/5 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-champagne-400" />
            <span>VER CLIENTE</span>
          </a>

          <a
            href={`./escanear.html?negocio=${encodeURIComponent(venue.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-champagne-500/40 bg-champagne-500/10 text-champagne-400 hover:bg-champagne-500/20 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-md shadow-champagne-500/10"
          >
            <Camera className="w-3.5 h-3.5 text-champagne-400" />
            <span>Probar escáner LAUNCIT</span>
          </a>
        </div>
      </div>
    </div>
  );
};
