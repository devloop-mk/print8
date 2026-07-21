'use client';

import { useId, type CSSProperties } from 'react';
import { useLocale } from 'next-intl';
import { LOGO_MARK } from '@/lib/brand/logos';
import { cn } from '@/lib/utils';
import {
  SPIN_SEGMENTS,
  getSpinSliceDegrees,
} from '@/lib/rewards/spin-config';

const WHEEL_SIZE = 200;
const WHEEL_CX = WHEEL_SIZE / 2;
const WHEEL_CY = WHEEL_SIZE / 2;
const WHEEL_R = WHEEL_SIZE / 2 - 1;
const LABEL_R = WHEEL_R * 0.62;
const CIRCLE: CSSProperties = { borderRadius: '50%' };

function polar(cx: number, cy: number, r: number, angleFromTopDeg: number) {
  const rad = ((angleFromTopDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function slicePath(index: number, sliceDeg: number): string {
  const start = index * sliceDeg;
  const end = (index + 1) * sliceDeg;
  const p1 = polar(WHEEL_CX, WHEEL_CY, WHEEL_R, start);
  const p2 = polar(WHEEL_CX, WHEEL_CY, WHEEL_R, end);
  const largeArc = sliceDeg > 180 ? 1 : 0;
  return [
    `M ${WHEEL_CX} ${WHEEL_CY}`,
    `L ${p1.x} ${p1.y}`,
    `A ${WHEEL_R} ${WHEEL_R} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    'Z',
  ].join(' ');
}

function lighten(hex: string, amount: number): string {
  const raw = hex.replace('#', '');
  const n = parseInt(raw.length === 3 ? raw.replace(/(.)/g, '$1$1') : raw, 16);
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amount));
  const b = Math.min(255, (n & 255) + Math.round(255 * amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function darken(hex: string, amount: number): string {
  const raw = hex.replace('#', '');
  const n = parseInt(raw.length === 3 ? raw.replace(/(.)/g, '$1$1') : raw, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

type SpinWheelPreviewProps = {
  className?: string;
  /** Visual diameter in px (scales the whole wheel). */
  size?: number;
  /** Slight idle glow pulse behind the wheel. */
  animated?: boolean;
};

export function SpinWheelPreview({
  className,
  size = 168,
  animated = true,
}: SpinWheelPreviewProps) {
  const locale = useLocale();
  const uid = useId().replace(/:/g, '');
  const clipId = `spin-preview-clip-${uid}`;
  const sliceDeg = getSpinSliceDegrees();

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className={cn(
          'pointer-events-none absolute -inset-[14%] bg-[radial-gradient(circle_at_center,rgba(47,124,178,0.34)_0%,rgba(232,93,4,0.16)_38%,transparent_68%)]',
          animated && 'animate-spin-rim-pulse',
        )}
        style={CIRCLE}
      />

      <div
        className="absolute inset-0 shadow-[0_12px_32px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.35)_inset]"
        style={{
          ...CIRCLE,
          background:
            'conic-gradient(from 210deg, #f8d48a 0deg, #e85d04 40deg, #f0f6fa 75deg, #2f7cb2 130deg, #122b3d 190deg, #f59f0a 250deg, #b9d5e9 300deg, #f8d48a 360deg)',
        }}
      />
      <div
        className="absolute inset-[5px] bg-gradient-to-b from-[#f4f7fa] via-[#dceaf4] to-[#8bbad9] shadow-[0_2px_0_rgba(255,255,255,0.65)_inset]"
        style={CIRCLE}
      />
      <div
        className="absolute inset-[11px] bg-gradient-to-br from-[#1e4d6b] via-brand-900 to-brand-950 shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]"
        style={CIRCLE}
      />

      <svg
        className="pointer-events-none absolute inset-[11px] z-10"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="48.2"
          fill="none"
          stroke="rgba(248,212,138,0.55)"
          strokeWidth="1.1"
          strokeDasharray="1.6 4.2"
        />
        <circle
          cx="50"
          cy="50"
          r="46.4"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.7"
        />
      </svg>

      <div className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[10px]">
        <svg
          width="34"
          height="42"
          viewBox="0 0 42 52"
          className="drop-shadow-[0_4px_8px_rgba(15,23,42,0.4)]"
        >
          <defs>
            <linearGradient id={`ptr-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffb703" />
              <stop offset="45%" stopColor="#e85d04" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          <path
            d="M21 8 L33 22 L21 50 L9 22 Z"
            fill={`url(#ptr-${uid})`}
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle
            cx="21"
            cy="8"
            r="5.2"
            fill="#ffb703"
            stroke="#fff"
            strokeWidth="1.8"
          />
          <circle cx="21" cy="8" r="2.1" fill="#fff8e7" />
        </svg>
      </div>

      <div
        className="absolute inset-[18px] overflow-hidden shadow-[0_0_0_2px_rgba(255,255,255,0.12)]"
        style={{
          ...CIRCLE,
          transform: 'rotate(18deg)',
        }}
      >
        <svg
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          className="h-full w-full"
        >
          <defs>
            <clipPath id={clipId}>
              <circle cx={WHEEL_CX} cy={WHEEL_CY} r={WHEEL_R} />
            </clipPath>
            {SPIN_SEGMENTS.map((segment, index) => {
              const mid = index * sliceDeg + sliceDeg / 2;
              const p1 = polar(WHEEL_CX, WHEEL_CY, WHEEL_R, mid - 28);
              const p2 = polar(WHEEL_CX, WHEEL_CY, WHEEL_R * 0.15, mid + 28);
              return (
                <linearGradient
                  key={`grad-${segment.key}`}
                  id={`slice-${uid}-${index}`}
                  gradientUnits="userSpaceOnUse"
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                >
                  <stop offset="0%" stopColor={lighten(segment.color, 0.18)} />
                  <stop offset="48%" stopColor={segment.color} />
                  <stop offset="100%" stopColor={darken(segment.color, 0.22)} />
                </linearGradient>
              );
            })}
            <radialGradient id={`gloss-${uid}`} cx="35%" cy="28%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {SPIN_SEGMENTS.map((segment, index) => (
              <path
                key={segment.key}
                d={slicePath(index, sliceDeg)}
                fill={`url(#slice-${uid}-${index})`}
                stroke="rgba(255,255,255,0.88)"
                strokeWidth={1.5}
              />
            ))}
            <circle
              cx={WHEEL_CX}
              cy={WHEEL_CY}
              r={WHEEL_R}
              fill={`url(#gloss-${uid})`}
              pointerEvents="none"
            />
          </g>

          {SPIN_SEGMENTS.map((segment, index) => {
            const mid = index * sliceDeg + sliceDeg / 2;
            const point = polar(WHEEL_CX, WHEEL_CY, LABEL_R, mid);
            const label =
              locale === 'en' ? segment.labelEn : segment.labelMk;
            const isTryAgain = segment.key === 'try_again';
            const fontSize = isTryAgain
              ? locale === 'en'
                ? 6.4
                : 5.6
              : locale === 'en'
                ? 7.4
                : 7.8;
            return (
              <text
                key={`${segment.key}-label`}
                x={point.x}
                y={point.y}
                fill="#fff"
                stroke="rgba(0,0,0,0.32)"
                strokeWidth={0.65}
                paintOrder="stroke"
                fontSize={fontSize}
                fontWeight={700}
                letterSpacing="0.02em"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid} ${point.x} ${point.y})`}
                style={{ textTransform: 'uppercase' }}
              >
                {isTryAgain && locale !== 'en' ? (
                  <>
                    <tspan x={point.x} dy="-0.45em">
                      Обиди се
                    </tspan>
                    <tspan x={point.x} dy="1.15em">
                      повторно
                    </tspan>
                  </>
                ) : (
                  label
                )}
              </text>
            );
          })}
        </svg>
      </div>

      <div
        className="absolute left-1/2 top-1/2 z-20 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-gradient-to-b from-white via-[#fffaf2] to-brand-50"
        style={{
          ...CIRCLE,
          boxShadow:
            '0 4px 16px rgba(15,23,42,0.32), 0 0 0 2px #fff, 0 0 0 4px rgba(245,159,10,0.85), 0 0 0 5px rgba(30,77,107,0.35)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_MARK}
          alt=""
          className="h-[56%] w-[56%] object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
