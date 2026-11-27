'use client';

import { useId } from 'react';
import { Sparkles } from 'lucide-react';
import type { NyScratchPrizeKey } from '@/lib/scratch/scratch-config';

const PERCENT_STYLES: Record<'percent5' | 'percent10' | 'percent15', string> = {
  percent5: 'text-[#fde68a]',
  percent10: 'text-[#fbbf24]',
  percent15: 'text-[#f59e0b]',
};

function MugMark() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className="h-[76%] w-[76%]" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${uid}-ceramic`} x1="16" y1="14" x2="48" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffaf3" />
          <stop offset="0.55" stopColor="#f3ebe0" />
          <stop offset="1" stopColor="#e4d5c4" />
        </linearGradient>
        <linearGradient id={`${uid}-print`} x1="22" y1="28" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1c5082" />
          <stop offset="1" stopColor="#3e408d" />
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="58" rx="15" ry="3.2" fill="#050b16" opacity="0.35" />
      <path
        d="M44.5 26c8.8 1.6 9.6 16.4-0.2 20"
        fill="none"
        stroke="#c9a227"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M44.5 27.6c6.4 1.4 7 12.8-0.1 15.8"
        fill="none"
        stroke="#1c5082"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17 22h26l-2.6 30.2c-.4 4.4-20.4 4.4-20.8 0L17 22Z"
        fill={`url(#${uid}-ceramic)`}
      />
      <path
        d="M20 28c.8 10 1.4 18 2 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <ellipse cx="30" cy="21.2" rx="13.4" ry="5" fill="#1a100c" />
      <ellipse cx="30" cy="20.4" rx="10.6" ry="3.4" fill="#5c3318" />
      <ellipse cx="30" cy="21.2" rx="13.4" ry="5" fill="none" stroke="#fbbf24" strokeWidth="1.7" />
      <rect x="22.5" y="29" width="15" height="12.5" rx="1.8" fill="#fff" />
      <rect x="23.6" y="30" width="12.8" height="8.2" rx="1.1" fill={`url(#${uid}-print)`} />
      <circle cx="30" cy="34.1" r="2.1" fill="#fbbf24" />
      <rect x="26" y="39.4" width="8" height="1.15" rx="0.6" fill="#e8c97a" />
      <path
        d="M24 12.5c0-3.4 3.2-3.4 3.2 0 0 3.2 3 3.2 3 -.2"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M33 11.8c0-3.2 2.8-3.2 2.8 0 0 3 2.6 3 2.6-0.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function TshirtMark({ jackpot }: { jackpot?: boolean }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${uid}-tee`} x1="12" y1="12" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2a5f96" />
          <stop offset="0.5" stopColor="#1c5082" />
          <stop offset="1" stopColor="#3e408d" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="16" ry="3" fill="#050b16" opacity="0.32" />
      <path
        d="M20.5 16.5 32 22.5 43.5 16.5 54 25.5 45.5 31.5v21.2c0 2.2-6.2 4.6-13.5 4.6s-13.5-2.4-13.5-4.6V31.5L10 25.5Z"
        fill={`url(#${uid}-tee)`}
      />
      <path d="M22 30.5 13.2 25.2 21 18.2" fill="#163a62" />
      <path d="M42 30.5 50.8 25.2 43 18.2" fill="#163a62" />
      <path
        d="M24.5 18.2c2.4-1.2 4.7-2 7.5-2s5.1.8 7.5 2"
        fill="none"
        stroke="#0b1730"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M26.2 17.6 32 26.2 37.8 17.6" fill="#0b1730" />
      <path d="M28.4 17.8q3.6-3.2 7.2 0" fill="#f4f1ea" opacity="0.92" />
      <path
        d="M20 50.8c3.8 1.4 7.8 2.1 12 2.1s8.2-.7 12-2.1"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="1.2"
        opacity="0.45"
      />
      <rect x="23.5" y="32.2" width="17" height="13.2" rx="1.8" fill="#fff" />
      <rect x="24.7" y="33.3" width="14.6" height="8.6" rx="1.1" fill="#1c5082" />
      <rect x="27.2" y="43" width="9.6" height="1.15" rx="0.6" fill="#e8c97a" />
      {jackpot ? (
        <circle cx="32" cy="37.4" r="2.35" fill="#fbbf24" />
      ) : (
        <path
          d="M29.2 35.4h5.6v2.1h-2.05v4.4h-1.5v-4.4H29.2z"
          fill="#fde68a"
        />
      )}
      <path
        d="M21.5 28c1.2 8 2 16 2.4 21"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  );
}

function TruckMark() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" className="h-[72%] w-[72%]" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${uid}-cab`} x1="8" y1="18" x2="56" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="54" rx="18" ry="3" fill="#050b16" opacity="0.3" />
      <rect x="8" y="24" width="28" height="18" rx="2.5" fill="#e8eef6" />
      <rect x="10" y="26" width="24" height="10" rx="1.4" fill="#1c5082" />
      <path d="M36 28h12l6 8v6H36V28Z" fill={`url(#${uid}-cab)`} />
      <rect x="40" y="31" width="8" height="6" rx="1" fill="#1c5082" opacity="0.85" />
      <circle cx="18" cy="46" r="5" fill="#0b1730" />
      <circle cx="18" cy="46" r="2.2" fill="#fbbf24" />
      <circle cx="44" cy="46" r="5" fill="#0b1730" />
      <circle cx="44" cy="46" r="2.2" fill="#fbbf24" />
    </svg>
  );
}

export function NyScratchPrizeMark({
  prizeKey,
}: {
  prizeKey: NyScratchPrizeKey;
}) {
  if (prizeKey === 'percent5' || prizeKey === 'percent10' || prizeKey === 'percent15') {
    const value = prizeKey === 'percent5' ? 5 : prizeKey === 'percent10' ? 10 : 15;
    return (
      <span className="flex h-full w-full flex-col items-center justify-center gap-0.5">
        {prizeKey === 'percent15' ? (
          <Sparkles className="h-3 w-3 text-[#fbbf24]" aria-hidden />
        ) : null}
        <span
          className={`font-display text-2xl font-black leading-none tracking-tight sm:text-[1.85rem] ${PERCENT_STYLES[prizeKey]}`}
        >
          {value}%
        </span>
      </span>
    );
  }

  if (prizeKey === 'shipping') {
    return (
      <span className="flex h-full w-full items-center justify-center">
        <TruckMark />
      </span>
    );
  }

  if (prizeKey === 'mug') {
    return (
      <span className="flex h-full w-full items-center justify-center">
        <MugMark />
      </span>
    );
  }

  return (
    <span className="flex h-full w-full items-center justify-center">
      <TshirtMark jackpot />
    </span>
  );
}
