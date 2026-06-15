'use client';

import type { DesignColorTheme } from '@/lib/data/design-layouts';

export function CornerFlourish({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true" fill="none">
      <path d="M0 0 C20 8 32 20 40 40 C28 24 14 10 0 0 Z" fill={colors.accent} opacity="0.85" />
      <path d="M8 0 C22 12 30 24 36 40 C24 28 14 14 8 0 Z" fill={colors.secondary} opacity="0.35" />
    </svg>
  );
}

export function GeometricAccent({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="10" y="10" width="48" height="48" rx="4" fill={colors.accent} opacity="0.12" />
      <rect x="34" y="34" width="56" height="56" rx="6" fill={colors.accent} opacity="0.2" />
      <path d="M88 18 L108 38 L88 58 Z" fill={colors.secondary} opacity="0.45" />
    </svg>
  );
}

export function FloralCorner({
  colors,
  className,
  flip,
}: {
  colors: DesignColorTheme;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <circle cx="24" cy="24" r="10" fill={colors.accent} opacity="0.25" />
      <circle cx="42" cy="16" r="7" fill={colors.secondary} opacity="0.35" />
      <circle cx="16" cy="42" r="7" fill={colors.secondary} opacity="0.35" />
      <path d="M30 48 C42 30 58 24 72 36 C58 40 44 52 30 48 Z" fill={colors.accent} opacity="0.18" />
      <path d="M8 72 C24 58 40 54 56 60" stroke={colors.accent} strokeWidth="2" opacity="0.35" fill="none" />
    </svg>
  );
}

export function FloralWreath({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 220 80" className={className} aria-hidden="true" fill="none">
      <path
        d="M20 50 C35 18 55 10 110 12 C165 10 185 18 200 50"
        stroke={colors.accent}
        strokeWidth="2"
        opacity="0.45"
      />
      <circle cx="36" cy="34" r="8" fill={colors.accent} opacity="0.22" />
      <circle cx="62" cy="22" r="6" fill={colors.secondary} opacity="0.3" />
      <circle cx="110" cy="16" r="7" fill={colors.accent} opacity="0.28" />
      <circle cx="158" cy="22" r="6" fill={colors.secondary} opacity="0.3" />
      <circle cx="184" cy="34" r="8" fill={colors.accent} opacity="0.22" />
      <path d="M48 42 C54 30 66 24 78 28" stroke={colors.secondary} strokeWidth="1.5" opacity="0.5" />
      <path d="M172 42 C166 30 154 24 142 28" stroke={colors.secondary} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function WeddingRings({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 72 40" className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="22" r="14" stroke={colors.accent} strokeWidth="3" opacity="0.85" />
      <circle cx="42" cy="22" r="14" stroke={colors.secondary} strokeWidth="3" opacity="0.75" />
      <path d="M30 12 L42 28" stroke={colors.accent} strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function HeartAccent({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 38 C10 28 4 20 8 12 C12 6 18 6 24 12 C30 6 36 6 40 12 C44 20 38 28 24 38 Z"
        fill={colors.accent}
        opacity="0.28"
      />
    </svg>
  );
}

export function BalloonCluster({
  colors,
  className,
  flip,
}: {
  colors: DesignColorTheme;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 90 120"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <ellipse cx="30" cy="28" rx="18" ry="22" fill={colors.accent} opacity="0.75" />
      <ellipse cx="58" cy="40" rx="15" ry="19" fill={colors.secondary} opacity="0.65" />
      <ellipse cx="42" cy="58" rx="12" ry="15" fill={colors.accent} opacity="0.45" />
      <path d="M30 50 L26 92" stroke={colors.text} strokeWidth="1.2" opacity="0.25" />
      <path d="M58 59 L64 96" stroke={colors.text} strokeWidth="1.2" opacity="0.25" />
      <path d="M42 73 L40 98" stroke={colors.text} strokeWidth="1.2" opacity="0.25" />
    </svg>
  );
}

export function PartyBanner({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 240 36" className={className} aria-hidden="true">
      <path d="M0 18 L30 4 L60 18 L90 4 L120 18 L150 4 L180 18 L210 4 L240 18 L240 28 L0 28 Z" fill={colors.accent} opacity="0.18" />
      <path d="M0 18 L30 4 L60 18 L90 4 L120 18 L150 4 L180 18 L210 4 L240 18" stroke={colors.accent} strokeWidth="1.5" fill="none" opacity="0.55" />
    </svg>
  );
}

export function ConfettiDots({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      {[
        [18, 22, 8],
        [48, 14, 6],
        [88, 18, 5],
        [120, 10, 7],
        [160, 24, 10],
        [182, 48, 7],
        [24, 78, 6],
        [96, 72, 8],
        [140, 86, 9],
        [170, 64, 5],
      ].map(([cx, cy, r], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r={r}
          fill={index % 2 === 0 ? colors.accent : colors.secondary}
          opacity={0.35 + (index % 3) * 0.1}
        />
      ))}
      {[
        [60, 30, 12],
        [145, 36, 14],
        [110, 88, 10],
      ].map(([x, y, size], index) => (
        <rect
          key={`sq-${index}`}
          x={x}
          y={y}
          width={size}
          height={size}
          rx="1"
          fill={colors.accent}
          opacity="0.2"
          transform={`rotate(${index * 18} ${Number(x) + Number(size) / 2} ${Number(y) + Number(size) / 2})`}
        />
      ))}
    </svg>
  );
}

export function SparkleStars({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" fill={colors.accent}>
      <path d="M20 18 L22 24 L28 24 L23 28 L25 34 L20 30 L15 34 L17 28 L12 24 L18 24 Z" opacity="0.35" />
      <path d="M96 14 L97.5 18 L101.5 18 L98.5 20.5 L100 24.5 L96 22 L92 24.5 L93.5 20.5 L90.5 18 L94.5 18 Z" opacity="0.45" />
      <path d="M88 78 L90 84 L96 84 L91 88 L93 94 L88 90 L83 94 L85 88 L80 84 L86 84 Z" opacity="0.3" />
      <path d="M34 88 L35 92 L39 92 L36 94.5 L37.5 98.5 L34 96 L30.5 98.5 L32 94.5 L29 92 L33 92 Z" opacity="0.4" />
    </svg>
  );
}

export function MenuOrnament({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 24" className={className} aria-hidden="true">
      <line x1="0" y1="12" x2="70" y2="12" stroke={colors.accent} strokeWidth="1.5" />
      <circle cx="100" cy="12" r="5" fill={colors.accent} opacity="0.7" />
      <line x1="130" y1="12" x2="200" y2="12" stroke={colors.accent} strokeWidth="1.5" />
    </svg>
  );
}

export function MenuUtensils({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true" fill="none">
      <path d="M18 10 L18 42 C18 50 10 50 10 42 L10 10" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 10 L14 34" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M22 10 L22 34" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M52 10 L52 48 L58 56 L46 56 Z" stroke={colors.secondary} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="52" cy="62" r="4" fill={colors.secondary} opacity="0.5" />
    </svg>
  );
}

export function MenuPattern({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((__, col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 40}
            cy={20 + row * 40}
            r="2"
            fill={colors.accent}
            opacity={0.08 + ((row + col) % 3) * 0.03}
          />
        )),
      )}
    </svg>
  );
}

export function BrandMark({
  colors,
  label,
  className,
}: {
  colors: DesignColorTheme;
  label: string;
  className?: string;
}) {
  const initial = label.trim().charAt(0).toUpperCase() || 'P';
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${className ?? ''}`}
      style={{
        backgroundColor: `${colors.accent}18`,
        color: colors.accent,
        border: `2px solid ${colors.accent}55`,
      }}
    >
      {initial}
    </div>
  );
}

export function DividerLine({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
      }}
    />
  );
}

export function BackgroundWash({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className ?? ''}`}
      style={{
        background: `radial-gradient(circle at 20% 15%, ${colors.accent}18 0%, transparent 42%), radial-gradient(circle at 80% 85%, ${colors.secondary}16 0%, transparent 38%)`,
      }}
    />
  );
}

export function RoseBloom({
  colors,
  className,
  flip,
}: {
  colors: DesignColorTheme;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <circle cx="40" cy="40" r="10" fill={colors.accent} opacity="0.35" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="40"
          cy="22"
          rx="9"
          ry="16"
          fill={colors.accent}
          opacity="0.28"
          transform={`rotate(${angle} 40 40)`}
        />
      ))}
      {[36, 108, 180, 252, 324].map((angle) => (
        <ellipse
          key={`inner-${angle}`}
          cx="40"
          cy="28"
          rx="6"
          ry="11"
          fill={colors.secondary}
          opacity="0.32"
          transform={`rotate(${angle} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="5" fill={colors.accent} opacity="0.55" />
    </svg>
  );
}

export function VineCorner({
  colors,
  className,
  flip,
}: {
  colors: DesignColorTheme;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      fill="none"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M4 96 C18 72 28 48 36 28 C42 14 48 6 58 4 C44 18 34 38 28 58 C22 74 14 88 4 96 Z"
        fill={colors.accent}
        opacity="0.2"
      />
      <path
        d="M8 88 C20 68 30 48 38 30"
        stroke={colors.accent}
        strokeWidth="1.5"
        opacity="0.45"
      />
      <ellipse cx="42" cy="24" rx="8" ry="5" fill={colors.secondary} opacity="0.35" transform="rotate(-25 42 24)" />
      <ellipse cx="24" cy="42" rx="7" ry="4" fill={colors.accent} opacity="0.3" transform="rotate(35 24 42)" />
      <ellipse cx="52" cy="38" rx="6" ry="4" fill={colors.secondary} opacity="0.28" transform="rotate(10 52 38)" />
      <circle cx="58" cy="8" r="3" fill={colors.accent} opacity="0.4" />
      <circle cx="12" cy="58" r="2.5" fill={colors.secondary} opacity="0.35" />
    </svg>
  );
}

export function LaurelWreath({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 180 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 30 C28 14 48 8 90 8 C132 8 152 14 168 30"
        stroke={colors.accent}
        strokeWidth="1.5"
        opacity="0.5"
      />
      {[
        [24, 24, -30],
        [42, 16, -15],
        [60, 12, 0],
        [78, 12, 0],
        [96, 12, 0],
        [114, 12, 0],
        [132, 16, 15],
        [150, 24, 30],
      ].map(([cx, cy, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx="5"
          ry="9"
          fill={colors.accent}
          opacity="0.22"
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

export function ElegantFrame({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" fill="none">
      <rect x="12" y="12" width="176" height="176" rx="4" stroke={colors.accent} strokeWidth="1" opacity="0.35" />
      <rect x="20" y="20" width="160" height="160" rx="2" stroke={colors.secondary} strokeWidth="0.75" opacity="0.25" />
      <path d="M12 12 L36 12 L12 36 Z" fill={colors.accent} opacity="0.18" />
      <path d="M188 12 L164 12 L188 36 Z" fill={colors.accent} opacity="0.18" />
      <path d="M12 188 L36 188 L12 164 Z" fill={colors.accent} opacity="0.18" />
      <path d="M188 188 L164 188 L188 164 Z" fill={colors.accent} opacity="0.18" />
    </svg>
  );
}

export function BotanicalSprig({
  colors,
  className,
  flip,
}: {
  colors: DesignColorTheme;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 96"
      className={className}
      aria-hidden="true"
      fill="none"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M32 88 C32 60 30 40 28 20 C26 8 24 4 20 4"
        stroke={colors.accent}
        strokeWidth="1.8"
        opacity="0.45"
        strokeLinecap="round"
      />
      <ellipse cx="38" cy="28" rx="10" ry="6" fill={colors.accent} opacity="0.25" transform="rotate(25 38 28)" />
      <ellipse cx="22" cy="44" rx="9" ry="5" fill={colors.secondary} opacity="0.3" transform="rotate(-20 22 44)" />
      <ellipse cx="36" cy="58" rx="8" ry="5" fill={colors.accent} opacity="0.22" transform="rotate(15 36 58)" />
      <circle cx="20" cy="12" r="4" fill={colors.secondary} opacity="0.35" />
    </svg>
  );
}

export function GoldAccentBar({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 8" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.accent} stopOpacity="0.2" />
          <stop offset="50%" stopColor={colors.accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="0" y="2" width="200" height="4" rx="2" fill="url(#goldGrad)" />
    </svg>
  );
}

export function CakeCelebration({
  colors,
  className,
}: {
  colors: DesignColorTheme;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <rect x="10" y="38" width="52" height="22" rx="4" fill={colors.accent} opacity="0.35" />
      <rect x="16" y="26" width="40" height="14" rx="3" fill={colors.secondary} opacity="0.4" />
      <rect x="22" y="16" width="28" height="12" rx="3" fill={colors.accent} opacity="0.5" />
      <path d="M36 8 L36 16" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="6" r="4" fill={colors.secondary} opacity="0.7" />
      <circle cx="20" cy="48" r="3" fill={colors.secondary} opacity="0.45" />
      <circle cx="52" cy="48" r="3" fill={colors.accent} opacity="0.45" />
    </svg>
  );
}
