'use client';

import { useEffect, useId, useState, type CSSProperties, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { LOGO_MARK } from '@/lib/brand/logos';
import { cn } from '@/lib/utils';
import {
  SPIN_CLAIMED_FLAG_KEY,
  SPIN_PENDING_CLAIM_KEY,
  SPIN_PENDING_CLAIM_MS,
  SPIN_PENDING_COUPON_KEY,
  SPIN_SEGMENTS,
  getSpinLandingRotation,
  getSpinSegmentIndex,
  getSpinSliceDegrees,
  type SpinPrizeKey,
} from '@/lib/rewards/spin-config';

type SpinResult = {
  prizeKey: string;
  segmentIndex: number;
  discountAmount: number;
  minOrderAmount: number;
  couponCode: string | null;
  emailSent: boolean;
  validDays?: number;
};

type Phase = 'idle' | 'spinning' | 'claim' | 'result' | 'already';

const WHEEL_SIZE = 200;
const WHEEL_CX = WHEEL_SIZE / 2;
const WHEEL_CY = WHEEL_SIZE / 2;
const WHEEL_R = WHEEL_SIZE / 2 - 1;
const LABEL_R = WHEEL_R * 0.62;
/** Brand site zeros out Tailwind `rounded-full` — force real circles. */
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

function resolveWinSegment(
  segmentIndex: number,
  prizeKey?: string,
): { segmentIndex: number; segment: (typeof SPIN_SEGMENTS)[number] } {
  let index = segmentIndex;
  let segment =
    SPIN_SEGMENTS[index] ??
    SPIN_SEGMENTS.find((s) => s.key === prizeKey) ??
    SPIN_SEGMENTS.find((s) => s.discountAmount > 0 && s.weight > 0) ??
    SPIN_SEGMENTS[0];
  if (segment.discountAmount <= 0 || segment.key === 'try_again') {
    segment =
      SPIN_SEGMENTS.find((s) => s.discountAmount > 0 && s.weight > 0) ??
      segment;
    index = getSpinSegmentIndex(segment.key as SpinPrizeKey);
  }
  return { segmentIndex: index, segment };
}

type PendingClaim = {
  claimToken: string;
  result: SpinResult;
  createdAt: number;
};

function readPendingClaim(): PendingClaim | null {
  try {
    const raw = sessionStorage.getItem(SPIN_PENDING_CLAIM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingClaim;
    if (
      !parsed.claimToken ||
      !parsed.result ||
      Date.now() - parsed.createdAt > SPIN_PENDING_CLAIM_MS
    ) {
      sessionStorage.removeItem(SPIN_PENDING_CLAIM_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePendingClaim(claimToken: string, result: SpinResult) {
  try {
    sessionStorage.setItem(
      SPIN_PENDING_CLAIM_KEY,
      JSON.stringify({ claimToken, result, createdAt: Date.now() } satisfies PendingClaim),
    );
  } catch {
    /* ignore */
  }
}

function clearPendingClaim() {
  try {
    sessionStorage.removeItem(SPIN_PENDING_CLAIM_KEY);
  } catch {
    /* ignore */
  }
}

export function SpinWheelGame() {
  const t = useTranslations('spinWheel');
  const locale = useLocale();
  const router = useRouter();
  const { total, hydrated } = useCart();
  const reactId = useId();
  const uid = reactId.replace(/:/g, '');
  const clipId = `spin-wheel-clip-${uid}`;
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const sliceDeg = getSpinSliceDegrees();
  const idleMotion = phase === 'idle' && !reduceMotion;
  const winCelebration =
    (phase === 'claim' || phase === 'result') &&
    Boolean(result && result.discountAmount > 0) &&
    !reduceMotion;

  function animateToSegment(segmentIndex: number) {
    setRotation((prev) => {
      const turns = reduceMotion ? 1 : 6;
      const landing = getSpinLandingRotation(segmentIndex, turns);
      const base = Math.ceil(prev / 360) * 360;
      return base + landing;
    });
  }

  useEffect(() => {
    const pending = readPendingClaim();
    if (!pending) return;
    setClaimToken(pending.claimToken);
    setResult(pending.result);
    setPhase('claim');
    setRotation(getSpinLandingRotation(pending.result.segmentIndex, reduceMotion ? 1 : 6));
  }, [reduceMotion]);

  async function onSpin(event: FormEvent) {
    event.preventDefault();
    if (phase === 'spinning') return;

    const pending = readPendingClaim();
    if (pending) {
      setClaimToken(pending.claimToken);
      setResult(pending.result);
      setPhase('claim');
      setRotation(getSpinLandingRotation(pending.result.segmentIndex, reduceMotion ? 1 : 6));
      return;
    }

    setError(null);
    setPhase('spinning');

    try {
      const res = await fetch('/api/rewards/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: locale === 'en' ? 'en' : 'mk',
          website: '',
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        segmentIndex?: number;
        prizeKey?: string;
        discountAmount?: number;
        minOrderAmount?: number;
        claimToken?: string | null;
        validDays?: number;
        error?: string;
        code?: string;
      };

      if (!res.ok || !data.ok || typeof data.segmentIndex !== 'number') {
        setPhase('idle');
        setError(t('errors.generic'));
        return;
      }

      const { segmentIndex, segment } = resolveWinSegment(
        data.segmentIndex,
        data.prizeKey,
      );

      animateToSegment(segmentIndex);

      setClaimToken(data.claimToken ?? null);
      setResult({
        prizeKey: data.prizeKey ?? segment.key,
        segmentIndex,
        discountAmount: data.discountAmount ?? segment.discountAmount,
        minOrderAmount: data.minOrderAmount ?? segment.minOrderAmount,
        couponCode: null,
        emailSent: false,
        validDays: data.validDays,
      });

      if (data.claimToken) {
        savePendingClaim(data.claimToken, {
          prizeKey: data.prizeKey ?? segment.key,
          segmentIndex,
          discountAmount: data.discountAmount ?? segment.discountAmount,
          minOrderAmount: data.minOrderAmount ?? segment.minOrderAmount,
          couponCode: null,
          emailSent: false,
          validDays: data.validDays,
        });
      }

      const delay = reduceMotion ? 200 : 5200;
      window.setTimeout(() => {
        setPhase('claim');
      }, delay);
    } catch {
      setPhase('idle');
      setError(t('errors.generic'));
    }
  }

  async function onClaim(event: FormEvent) {
    event.preventDefault();
    if (claiming || !claimToken || !result) return;
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('errors.invalidEmail'));
      return;
    }

    setClaiming(true);

    try {
      const res = await fetch('/api/rewards/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          claimToken,
          locale: locale === 'en' ? 'en' : 'mk',
          website: '',
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        alreadyPlayed?: boolean;
        couponCode?: string | null;
        emailSent?: boolean;
        error?: string;
      };

      if (res.status === 409 || data.code === 'already_played') {
        setPhase('already');
        return;
      }

      if (res.status === 400 && data.code === 'invalid_token') {
        setError(t('errors.expiredSpin'));
        return;
      }

      if (!res.ok || !data.ok || !data.couponCode) {
        setError(t('errors.generic'));
        return;
      }

      setResult({
        ...result,
        couponCode: data.couponCode,
        emailSent: Boolean(data.emailSent),
      });
      setPhase('result');
      clearPendingClaim();
      try {
        localStorage.setItem(SPIN_CLAIMED_FLAG_KEY, '1');
      } catch {
        /* ignore */
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setClaiming(false);
    }
  }

  async function copyCode() {
    if (!result?.couponCode) return;
    try {
      await navigator.clipboard.writeText(result.couponCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const canUseNow =
    hydrated &&
    Boolean(result?.couponCode) &&
    (result?.discountAmount ?? 0) > 0 &&
    total > 0 &&
    total + 1e-9 >= (result?.minOrderAmount ?? Number.POSITIVE_INFINITY);

  function useCouponNow() {
    if (!result?.couponCode || !canUseNow) return;
    try {
      sessionStorage.setItem(
        SPIN_PENDING_COUPON_KEY,
        JSON.stringify({
          code: result.couponCode,
          email: email.trim().toLowerCase(),
        }),
      );
    } catch {
      /* ignore */
    }
    router.push('/checkout');
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[380px]">
        {/* Soft brand spotlight behind the wheel */}
        <div
          className={cn(
            'pointer-events-none absolute -inset-[14%] bg-[radial-gradient(circle_at_center,rgba(47,124,178,0.34)_0%,rgba(232,93,4,0.16)_38%,transparent_68%)]',
            idleMotion && 'animate-spin-rim-pulse',
          )}
          style={CIRCLE}
          aria-hidden
        />

        {/* Outer metallic / brand bezel */}
        <div
          className="absolute inset-0 shadow-[0_18px_50px_rgba(15,23,42,0.28),0_0_0_1px_rgba(255,255,255,0.35)_inset]"
          style={{
            ...CIRCLE,
            background:
              'conic-gradient(from 210deg, #f8d48a 0deg, #e85d04 40deg, #f0f6fa 75deg, #2f7cb2 130deg, #122b3d 190deg, #f59f0a 250deg, #b9d5e9 300deg, #f8d48a 360deg)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-[5px] bg-gradient-to-b from-[#f4f7fa] via-[#dceaf4] to-[#8bbad9] shadow-[0_2px_0_rgba(255,255,255,0.65)_inset]"
          style={CIRCLE}
          aria-hidden
        />

        {/* Deep inner rim */}
        <div
          className="absolute inset-[11px] bg-gradient-to-br from-[#1e4d6b] via-brand-900 to-brand-950 shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]"
          style={CIRCLE}
          aria-hidden
        />

        {/* Fixed tick ring */}
        <svg
          className="pointer-events-none absolute inset-[11px] z-10"
          viewBox="0 0 100 100"
          aria-hidden
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

        {/* Dramatic top pointer / crown */}
        <div
          className="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-[10px]"
          aria-hidden
        >
          <svg
            width="42"
            height="52"
            viewBox="0 0 42 52"
            className="drop-shadow-[0_6px_10px_rgba(15,23,42,0.45)]"
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

        {/* Rotating wheel */}
        <div
          className="absolute inset-[18px] overflow-hidden shadow-[0_0_0_2px_rgba(255,255,255,0.12)]"
          style={{
            ...CIRCLE,
            transform: `rotate(${rotation}deg)`,
            transition:
              phase === 'spinning' && !reduceMotion
                ? 'transform 5s cubic-bezier(0.12, 0.75, 0.12, 1)'
                : phase === 'spinning'
                  ? 'transform 0.2s linear'
                  : undefined,
          }}
        >
          <svg
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            className="h-full w-full"
            role="img"
            aria-label={t('wheelAria')}
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

        {/* Fixed center hub — tighter badge, smaller 8 mark (~60% prior size) */}
        <div
          className="absolute left-1/2 top-1/2 z-20 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-gradient-to-b from-white via-[#fffaf2] to-brand-50 shadow-[0_4px_16px_rgba(15,23,42,0.32),0_0_0_1px_rgba(232,93,4,0.35)]"
          style={{
            ...CIRCLE,
            boxShadow:
              '0 4px 16px rgba(15,23,42,0.32), 0 0 0 2px #fff, 0 0 0 4px rgba(245,159,10,0.85), 0 0 0 5px rgba(30,77,107,0.35)',
          }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_MARK}
            alt=""
            className="h-[56%] w-[56%] object-contain"
            draggable={false}
          />
        </div>

        {/* Win sparks (confetti-lite) */}
        {winCelebration ? (
          <div className="pointer-events-none absolute inset-0 z-40" aria-hidden>
            {[
              { top: '8%', left: '18%', color: '#e85d04', delay: '0ms' },
              { top: '14%', left: '78%', color: '#2f7cb2', delay: '80ms' },
              { top: '72%', left: '12%', color: '#f59f0a', delay: '120ms' },
              { top: '68%', left: '84%', color: '#2f7cb2', delay: '40ms' },
              { top: '42%', left: '6%', color: '#e85d04', delay: '160ms' },
              { top: '38%', left: '92%', color: '#f59f0a', delay: '100ms' },
            ].map((spark, i) => (
              <span
                key={i}
                className="absolute h-2 w-2 animate-spin-spark"
                style={{
                  ...CIRCLE,
                  top: spark.top,
                  left: spark.left,
                  backgroundColor: spark.color,
                  animationDelay: spark.delay,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {phase === 'already' ? (
        <div className="mt-8 border border-brand-200 bg-brand-50 px-5 py-6 text-center">
          <p className="font-display text-xl font-bold text-brand-900">
            {t('alreadyTitle')}
          </p>
          <p className="mt-2 text-sm text-ink-600">{t('alreadyBody')}</p>
          <Link href="/products" className="mt-5 inline-block">
            <Button>{t('shopCta')}</Button>
          </Link>
        </div>
      ) : null}

      {phase === 'claim' && result ? (
        <div
          className={cn(
            'mt-8 border border-ink-200 bg-white px-5 py-6 text-center shadow-lift',
            winCelebration && 'animate-spin-win-pop',
          )}
        >
          <p className="font-display text-2xl font-bold text-brand-900">
            {t('winTitle', { amount: result.discountAmount })}
          </p>
          <p className="mt-2 text-sm text-ink-600">{t('claimBody')}</p>
          <form onSubmit={onClaim} className="mt-5 space-y-4 text-left">
            <label className="block text-sm font-medium text-ink-700">
              {t('emailLabel')}
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                disabled={claiming}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full border border-ink-300 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500"
                placeholder={t('emailPlaceholder')}
              />
            </label>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              aria-hidden
            />
            <Button
              type="submit"
              size="lg"
              loading={claiming}
              disabled={claiming || !claimToken}
              className="w-full border-[#e85d04] bg-[#e85d04] hover:border-[#f48c06] hover:bg-[#f48c06]"
            >
              {claiming ? t('claiming') : t('claimCta')}
            </Button>
            {error ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </form>
          <p className="mt-4 text-center text-xs leading-relaxed text-ink-500">
            {t('rules')}
          </p>
        </div>
      ) : null}

      {phase === 'result' && result ? (
        <div
          className={cn(
            'mt-8 border border-ink-200 bg-white px-5 py-6 text-center shadow-lift',
            winCelebration && 'animate-spin-win-pop',
          )}
        >
          {result.discountAmount > 0 && result.couponCode ? (
            <>
              <p className="font-display text-2xl font-bold text-brand-900">
                {t('winTitle', { amount: result.discountAmount })}
              </p>
              <p className="mt-2 text-sm text-ink-600">
                {t('winBody', {
                  min: result.minOrderAmount,
                  days: result.validDays ?? 30,
                })}
              </p>
              {result.emailSent ? (
                <p className="mt-2 text-sm font-medium text-brand-700">
                  {t('emailSent')}
                </p>
              ) : (
                <p className="mt-2 text-sm text-ink-500">{t('emailFallback')}</p>
              )}
              <div className="mt-5 flex items-center justify-center gap-2">
                <code className="border-2 border-dashed border-[#e85d04] bg-ink-50 px-4 py-3 text-lg font-bold tracking-wider text-ink-900">
                  {result.couponCode}
                </code>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="border border-ink-200 bg-white p-3 text-ink-700 hover:bg-ink-50"
                  aria-label={t('copyCode')}
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-brand-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
              {canUseNow ? (
                <div className="mt-5">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={useCouponNow}
                  >
                    {t('useNowCta')}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-bold text-ink-800">
                {t('tryAgainTitle')}
              </p>
              <p className="mt-2 text-sm text-ink-600">{t('tryAgainBody')}</p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/products">
              <Button variant={canUseNow ? 'outline' : 'primary'}>
                {t('shopCta')}
              </Button>
            </Link>
            {!canUseNow ? (
              <Link href="/checkout">
                <Button variant="outline">{t('checkoutCta')}</Button>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === 'idle' || phase === 'spinning' ? (
        <form onSubmit={onSpin} className="mt-8 space-y-4">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
            aria-hidden
          />
          <Button
            type="submit"
            size="lg"
            loading={phase === 'spinning'}
            disabled={phase === 'spinning'}
            className={cn(
              'relative w-full overflow-hidden border-[#e85d04] bg-[#e85d04] shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] hover:border-[#f48c06] hover:bg-[#f48c06]',
            )}
          >
            {idleMotion ? (
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"
                style={{ backgroundSize: '200% 100%' }}
                aria-hidden
              />
            ) : null}
            <span className="relative">
              {phase === 'spinning' ? t('spinning') : t('spinCta')}
            </span>
          </Button>
          {error ? (
            <p className="text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-center text-xs leading-relaxed text-ink-500">
            {t('rules')}
          </p>
        </form>
      ) : null}
    </div>
  );
}
