import type { ReactNode } from 'react';
import { LOGO_HORIZONTAL_LIGHT } from '@/lib/brand/logos';

export type OgImageContent = {
  title: string;
  description: string;
  subtitle?: string;
  badge?: string;
  locale: string;
  previewImageUrl?: string;
  logoUrl?: string;
};

// Print 8 brand palette (matches tailwind.config.ts `brand`/`ink` scales).
const BRAND = {
  600: '#2f7cb2',
  700: '#286694',
  800: '#225376',
  900: '#1c435f',
  950: '#122b3d',
};
const INK_900 = '#0f172a';

export function OgImageLayout({
  title,
  description,
  subtitle,
  badge,
  locale,
  previewImageUrl,
  logoUrl,
}: OgImageContent) {
  const isMk = locale === 'mk';
  const markUrl = logoUrl ?? LOGO_HORIZONTAL_LIGHT;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${BRAND[700]} 0%, ${BRAND[900]} 48%, ${INK_900} 100%)`,
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'rgba(139, 186, 217, 0.18)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          left: -60,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 48,
          right: 420,
          width: 120,
          height: 120,
          borderRadius: 24,
          border: '2px solid rgba(255,255,255,0.12)',
          transform: 'rotate(18deg)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          padding: '56px 64px',
          color: '#ffffff',
          maxWidth: previewImageUrl ? '720px' : '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={markUrl}
            alt=""
            width={216}
            height={58}
            style={{ objectFit: 'contain' }}
          />
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.78)' }}>
            {subtitle || (isMk ? 'Професионално печатење' : 'Professional printing')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {badge ? (
            <div
              style={{
                alignSelf: 'flex-start',
                padding: '10px 18px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.18)',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: 0.4,
              }}
            >
              {badge}
            </div>
          ) : null}

          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 700,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              color: 'rgba(255,255,255,0.86)',
              maxWidth: 640,
            }}
          >
            {description}
          </div>
        </div>

        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.55)' }}>print8.mk</div>
      </div>

      {previewImageUrl ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 420,
            padding: '48px 56px 48px 0',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 430,
              borderRadius: 28,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 28,
              boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      ) : (
        <OgDecorPanel locale={locale} />
      )}
    </div>
  );
}

function OgDecorPanel({ locale }: { locale: string }) {
  const isMk = locale === 'mk';
  const cards: Array<{ label: string; color: string; rotate: number; top: number; left: number }> = [
    { label: isMk ? 'Карти' : 'Cards', color: '#dceaf4', rotate: -8, top: 90, left: 40 },
    { label: isMk ? 'Печат' : 'Print', color: '#f0f6fa', rotate: 10, top: 210, left: 120 },
    { label: isMk ? 'Дизајн' : 'Design', color: '#b9d5e9', rotate: -4, top: 330, left: 60 },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: 380,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            position: 'absolute',
            top: card.top,
            left: card.left,
            width: 220,
            height: 130,
            borderRadius: 20,
            background: card.color,
            transform: `rotate(${card.rotate}deg)`,
            boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: 18,
            color: BRAND[900],
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {card.label}
        </div>
      ))}
    </div>
  );
}

export function renderOgImage(content: OgImageContent): ReactNode {
  return <OgImageLayout {...content} />;
}
