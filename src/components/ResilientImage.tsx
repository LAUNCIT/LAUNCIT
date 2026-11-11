import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-obsidian-850 via-obsidian-900 to-obsidian-950 text-champagne-400 p-4 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-6 h-6 mb-1.5 opacity-80" />
        {fallbackLabel && (
          <span className="text-[11px] font-semibold text-slate-300 line-clamp-1">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  if (!currentSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-obsidian-900 border border-obsidian-800 text-slate-600 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
};
