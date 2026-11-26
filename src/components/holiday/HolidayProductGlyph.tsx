import { useId } from 'react';
import type { HolidayProductKind } from '@/lib/holiday/workshop-config';

const BLUE = '#1c5082';
const VIOLET = '#3e408d';
const GOLD = '#e8c97a';
const PAPER = '#f4f1ea';

export function HolidayProductGlyph({
  kind,
  golden = false,
  className,
}: {
  kind: HolidayProductKind;
  golden?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const accent = golden ? GOLD : BLUE;
  const accent2 = golden ? '#f8e7b0' : VIOLET;
  const gradId = `${uid}-${kind}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor={accent} />
          <stop offset="1" stopColor={accent2} />
        </linearGradient>
      </defs>
      {kind === 'mug' ? (
        <>
          <rect x="14" y="18" width="28" height="30" rx="4" fill={PAPER} />
          <rect x="14" y="18" width="28" height="30" rx="4" fill={`url(#${gradId})`} fillOpacity="0.88" />
          <path
            d="M42 26h6a7 7 0 0 1 0 14h-6"
            fill="none"
            stroke={accent2}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="20" y="26" width="16" height="10" rx="2" fill="white" fillOpacity="0.28" />
        </>
      ) : null}
      {kind === 'tshirt' ? (
        <>
          <path
            d="M20 16 32 20l12-4 8 8-6 4v22H18V28l-6-4 8-8Z"
            fill={`url(#${gradId})`}
          />
          <path d="M26 20h12v4H26z" fill={PAPER} fillOpacity="0.35" />
        </>
      ) : null}
      {kind === 'calendar' ? (
        <>
          <rect x="14" y="16" width="36" height="34" rx="5" fill={PAPER} />
          <rect x="14" y="16" width="36" height="12" rx="5" fill={`url(#${gradId})`} />
          <rect x="14" y="24" width="36" height="4" fill={`url(#${gradId})`} />
          <circle cx="22" cy="16" r="2.4" fill={GOLD} />
          <circle cx="42" cy="16" r="2.4" fill={GOLD} />
          <rect x="20" y="34" width="8" height="6" rx="1" fill={accent} opacity="0.45" />
          <rect x="32" y="34" width="8" height="6" rx="1" fill={accent2} opacity="0.4" />
          <rect x="20" y="43" width="24" height="3" rx="1.5" fill={accent} opacity="0.25" />
        </>
      ) : null}
      {kind === 'cards' ? (
        <>
          <rect x="18" y="22" width="30" height="20" rx="3" fill={accent2} transform="rotate(-12 33 32)" />
          <rect x="16" y="20" width="32" height="22" rx="3" fill={PAPER} />
          <rect x="16" y="20" width="32" height="22" rx="3" fill={`url(#${gradId})`} fillOpacity="0.9" />
          <rect x="22" y="26" width="14" height="3" rx="1.5" fill="white" fillOpacity="0.5" />
          <rect x="22" y="32" width="20" height="2" rx="1" fill="white" fillOpacity="0.28" />
        </>
      ) : null}
      {kind === 'poster' ? (
        <>
          <rect x="18" y="10" width="28" height="44" rx="3" fill={PAPER} />
          <rect x="18" y="10" width="28" height="44" rx="3" fill={`url(#${gradId})`} fillOpacity="0.82" />
          <rect x="23" y="18" width="18" height="12" rx="2" fill="white" fillOpacity="0.28" />
          <rect x="23" y="34" width="18" height="2.5" rx="1" fill="white" fillOpacity="0.4" />
          <rect x="23" y="39" width="12" height="2" rx="1" fill="white" fillOpacity="0.28" />
        </>
      ) : null}
      {kind === 'sticker' ? (
        <>
          <rect x="14" y="14" width="36" height="36" rx="12" fill={`url(#${gradId})`} />
          <circle cx="32" cy="32" r="10" fill={PAPER} fillOpacity="0.28" />
          <path d="M32 24v16M24 32h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}
      {kind === 'gift' ? (
        <>
          <rect x="14" y="26" width="36" height="24" rx="4" fill={`url(#${gradId})`} />
          <rect x="12" y="18" width="40" height="12" rx="3" fill={accent2} />
          <rect x="29" y="18" width="6" height="32" fill={GOLD} />
          <rect x="14" y="30" width="36" height="5" fill={GOLD} />
          <path d="M32 18c-6-8-14-2-8 4 4 2 8-2 8-4Zm0 0c6-8 14-2 8 4-4 2-8-2-8-4Z" fill={GOLD} />
        </>
      ) : null}
    </svg>
  );
}
