'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxImage {
  src: string;
  label?: string;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasMultiple) {
        setIndex((i) => (i - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight' && hasMultiple) {
        setIndex((i) => (i + 1) % images.length);
      }
    }
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, hasMultiple, images.length]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + images.length) % images.length);
            }}
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      <div
        className="flex max-h-[90vh] max-w-4xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {current.label && (
          <p className="text-sm font-medium text-white/80">{current.label}</p>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.label ?? ''}
          className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        {hasMultiple && (
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === index ? 'bg-white' : 'bg-white/40'
                }`}
                aria-label={img.label ?? `Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
