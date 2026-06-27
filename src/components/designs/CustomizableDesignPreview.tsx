'use client';

import type { CSSProperties, FC } from 'react';
import type { DesignOrderFieldId } from '@/lib/data/design-order-fields';
import type {
  DesignColorTheme,
  DesignLayout,
  DesignLayoutVariant,
} from '@/lib/data/design-layouts';
import {
  BackgroundWash,
  BalloonCluster,
  BotanicalSprig,
  BrandMark,
  ConfettiDots,
  CornerFlourish,
  DividerLine,
  FloralCorner,
  FloralWreath,
  GeometricAccent,
  HeartAccent,
  MenuOrnament,
  MenuPattern,
  MenuUtensils,
  PartyBanner,
  RoseBloom,
  SparkleStars,
  VineCorner,
  WeddingRings,
} from '@/components/designs/DesignDecorations';

export type DesignPreviewSide = 'front' | 'back';

interface CustomizableDesignPreviewProps {
  layout: DesignLayout;
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
  side: DesignPreviewSide;
  className?: string;
  backLabel?: string;
  frontLabel?: string;
}

function line(value?: string) {
  return value?.trim() || null;
}

function HeadlineLabel({
  text,
  colors,
  className,
  style,
}: {
  text?: string;
  colors: DesignColorTheme;
  className?: string;
  style?: CSSProperties;
}) {
  const content = line(text);
  if (!content) return null;

  return (
    <p className={className} style={{ color: colors.accent, ...style }}>
      {content}
    </p>
  );
}

function ContactLines({
  values,
  colors,
  fields,
}: {
  values: Partial<Record<DesignOrderFieldId, string>>;
  colors: DesignColorTheme;
  fields: DesignOrderFieldId[];
}) {
  const lines = fields
    .map((field) => line(values[field]))
    .filter(Boolean) as string[];

  if (lines.length === 0) return null;

  return (
    <div
      className="space-y-0.5"
      style={{ fontSize: 'clamp(8px, 2cqw, 12px)', color: colors.secondary }}
    >
      {lines.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function BusinessMinimalFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full overflow-hidden rounded-lg shadow-sm"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <GeometricAccent colors={colors} className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 opacity-80" />
      <div className="w-[18%] shrink-0" style={{ backgroundColor: colors.accent }} />
      <div className="relative z-10 flex flex-1 flex-col justify-center px-[8%] py-[10%]">
        {line(values.fullName) && (
          <p className="font-bold leading-tight" style={{ fontSize: 'clamp(14px, 5.5cqw, 28px)' }}>
            {values.fullName}
          </p>
        )}
        {line(values.jobTitle) && (
          <p className="mt-1 font-medium" style={{ fontSize: 'clamp(10px, 2.8cqw, 16px)', color: colors.accent }}>
            {values.jobTitle}
          </p>
        )}
        {line(values.companyName) && (
          <p className="mt-2" style={{ fontSize: 'clamp(9px, 2.4cqw, 14px)', color: colors.secondary }}>
            {values.companyName}
          </p>
        )}
      </div>
    </div>
  );
}

function BusinessMinimalBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg px-[10%] py-[12%] text-center shadow-sm"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <CornerFlourish colors={colors} className="pointer-events-none absolute left-0 top-0 h-16 w-16" />
      <CornerFlourish colors={colors} className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 rotate-180" />
      <BrandMark
        colors={colors}
        label={values.companyName ?? values.fullName ?? 'P'}
        className="relative z-10 mb-4 h-14 w-14 text-xl"
      />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 mb-2 text-xs font-semibold uppercase tracking-[0.25em]"
      />
      <DividerLine colors={colors} className="relative z-10 mb-4 w-24" />
      <div className="relative z-10">
        <ContactLines
          values={values}
          colors={colors}
          fields={['phone', 'email', 'website', 'address']}
        />
      </div>
    </div>
  );
}

function BusinessClassicFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 px-[10%] py-[12%] text-center shadow-sm"
      style={{ backgroundColor: colors.background, borderColor: colors.accent, color: colors.text }}
    >
      <MenuOrnament colors={colors} className="mb-4 w-32" />
      {line(values.fullName) && (
        <p className="font-bold uppercase tracking-wide" style={{ fontSize: 'clamp(12px, 4.8cqw, 24px)' }}>
          {values.fullName}
        </p>
      )}
      {line(values.jobTitle) && (
        <p className="mt-1" style={{ fontSize: 'clamp(9px, 2.5cqw, 14px)', color: colors.accent }}>
          {values.jobTitle}
        </p>
      )}
      {line(values.companyName) && (
        <p className="mt-2 font-medium" style={{ fontSize: 'clamp(9px, 2.4cqw, 13px)', color: colors.secondary }}>
          {values.companyName}
        </p>
      )}
    </div>
  );
}

function BusinessClassicBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 px-[10%] py-[12%] text-center shadow-sm"
      style={{ backgroundColor: colors.background, borderColor: colors.accent, color: colors.text }}
    >
      <FloralCorner colors={colors} className="pointer-events-none absolute left-2 top-2 h-16 w-16 opacity-70" />
      <FloralCorner colors={colors} flip className="pointer-events-none absolute bottom-2 right-2 h-16 w-16 opacity-70" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 text-xs font-semibold uppercase tracking-[0.25em]"
      />
      <div className="relative z-10 mt-4">
        <ContactLines
          values={values}
          colors={colors}
          fields={['phone', 'email', 'website', 'address']}
        />
      </div>
    </div>
  );
}

function BusinessExecutiveFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full overflow-hidden rounded-lg shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <GeometricAccent colors={colors} className="pointer-events-none absolute -left-6 bottom-0 h-28 w-28 opacity-90" />
      <CornerFlourish colors={colors} className="pointer-events-none absolute right-0 top-0 h-20 w-20" />
      <div
        className="absolute left-0 top-0 h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${colors.accent}, ${colors.secondary})` }}
      />
      <div className="relative z-10 flex h-full flex-col justify-center px-[12%] py-[14%]">
        {line(values.companyName) && (
          <p
            className="font-semibold uppercase tracking-[0.35em]"
            style={{ fontSize: 'clamp(8px, 2cqw, 11px)', color: colors.accent }}
          >
            {values.companyName}
          </p>
        )}
        {line(values.fullName) && (
          <p className="mt-3 font-bold leading-tight" style={{ fontSize: 'clamp(15px, 5.8cqw, 30px)' }}>
            {values.fullName}
          </p>
        )}
        {line(values.jobTitle) && (
          <p className="mt-2" style={{ fontSize: 'clamp(10px, 2.6cqw, 15px)', color: colors.secondary }}>
            {values.jobTitle}
          </p>
        )}
        <DividerLine colors={colors} className="mt-4 w-20" />
      </div>
    </div>
  );
}

function BusinessExecutiveBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg px-[10%] py-[12%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div
        className="pointer-events-none absolute inset-5 rounded-xl border"
        style={{ borderColor: `${colors.accent}44` }}
      />
      <BrandMark
        colors={colors}
        label={values.companyName ?? values.fullName ?? 'P'}
        className="relative z-10 mb-5 h-16 w-16 text-2xl"
      />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
      />
      <DividerLine colors={colors} className="relative z-10 mb-4 w-28" />
      <div className="relative z-10 space-y-1" style={{ fontSize: 'clamp(8px, 2.1cqw, 12px)', color: colors.secondary }}>
        {line(values.phone) && <p>{values.phone}</p>}
        {line(values.email) && <p>{values.email}</p>}
        {line(values.website) && <p>{values.website}</p>}
        {line(values.address) && <p>{values.address}</p>}
      </div>
    </div>
  );
}

function BirthdayFunFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-[10%] py-[14%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <PartyBanner colors={colors} className="pointer-events-none absolute inset-x-4 top-3 w-[calc(100%-2rem)] opacity-90" />
      <BalloonCluster colors={colors} className="pointer-events-none absolute -left-1 bottom-8 h-24 w-16 opacity-90" />
      <BalloonCluster colors={colors} flip className="pointer-events-none absolute -right-1 bottom-10 h-24 w-16 opacity-90" />
      <ConfettiDots colors={colors} className="pointer-events-none absolute inset-x-0 top-10 h-20 w-full opacity-80" />
      <SparkleStars colors={colors} className="pointer-events-none absolute right-6 top-16 h-14 w-14 opacity-70" />
      <HeadlineLabel
        text={values.frontHeadline}
        colors={colors}
        className="relative z-10 rounded-full px-4 py-1.5 font-bold uppercase tracking-[0.25em]"
        style={{
          fontSize: 'clamp(8px, 2cqw, 11px)',
          backgroundColor: `${colors.accent}14`,
          border: `1px solid ${colors.accent}33`,
        }}
      />
      {line(values.celebrantName) && (
        <p
          className="relative z-10 mt-4 font-extrabold leading-tight"
          style={{ fontSize: 'clamp(20px, 7.5cqw, 38px)', color: colors.text }}
        >
          {values.celebrantName}
        </p>
      )}
      <DividerLine colors={colors} className="relative z-10 my-3 w-20" />
      {line(values.eventDate) && (
        <p
          className="relative z-10 font-semibold"
          style={{ fontSize: 'clamp(12px, 3.5cqw, 20px)', color: colors.accent }}
        >
          {values.eventDate}
        </p>
      )}
      {line(values.venue) && (
        <p
          className="relative z-10 mt-2"
          style={{ fontSize: 'clamp(10px, 2.8cqw, 16px)', color: colors.secondary }}
        >
          {values.venue}
        </p>
      )}
    </div>
  );
}

function BirthdayFunBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-[12%] py-[14%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <ConfettiDots colors={colors} className="pointer-events-none absolute inset-x-0 bottom-4 h-20 w-full opacity-70" />
      <HeartAccent colors={colors} className="relative z-10 mb-3 h-10 w-10" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 font-bold uppercase tracking-[0.25em]"
        style={{ fontSize: 'clamp(10px, 2.4cqw, 13px)' }}
      />
      {line(values.phone) && (
        <p className="relative z-10 mt-4 font-semibold" style={{ fontSize: 'clamp(11px, 3cqw, 18px)' }}>
          {values.phone}
        </p>
      )}
      {line(values.additionalInfo) && (
        <p
          className="relative z-10 mt-4 max-w-[90%] leading-relaxed"
          style={{ fontSize: 'clamp(9px, 2.2cqw, 13px)', color: colors.secondary }}
        >
          {values.additionalInfo}
        </p>
      )}
    </div>
  );
}

function BirthdayModernFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="h-[22%] shrink-0" style={{ backgroundColor: colors.accent }} />
      <GeometricAccent colors={colors} className="pointer-events-none absolute -right-6 top-8 h-24 w-24 opacity-40" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-[12%] py-[10%] text-center">
        <HeadlineLabel
          text={values.frontHeadline}
          colors={colors}
          className="font-semibold uppercase tracking-[0.35em]"
          style={{ fontSize: 'clamp(7px, 1.8cqw, 10px)', color: colors.secondary }}
        />
        {line(values.celebrantName) && (
          <p
            className="mt-4 font-bold leading-tight"
            style={{ fontSize: 'clamp(18px, 6.5cqw, 34px)' }}
          >
            {values.celebrantName}
          </p>
        )}
        <DividerLine colors={colors} className="my-4 w-24" />
        {line(values.eventDate) && (
          <p
            className="font-semibold"
            style={{ fontSize: 'clamp(11px, 3.2cqw, 18px)', color: colors.accent }}
          >
            {values.eventDate}
          </p>
        )}
        {line(values.venue) && (
          <p
            className="mt-2"
            style={{ fontSize: 'clamp(9px, 2.5cqw, 14px)', color: colors.secondary }}
          >
            {values.venue}
          </p>
        )}
      </div>
    </div>
  );
}

function BirthdayModernBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl px-[12%] py-[14%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <GeometricAccent colors={colors} className="pointer-events-none absolute -left-4 bottom-4 h-20 w-20 opacity-35" />
      <MenuOrnament colors={colors} className="relative z-10 mb-5 w-36" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 font-bold uppercase tracking-[0.3em]"
        style={{ fontSize: 'clamp(9px, 2.2cqw, 12px)' }}
      />
      {line(values.phone) && (
        <p className="relative z-10 mt-4 font-semibold" style={{ fontSize: 'clamp(11px, 3cqw, 18px)' }}>
          {values.phone}
        </p>
      )}
      {line(values.additionalInfo) && (
        <p
          className="relative z-10 mt-4 max-w-[90%] leading-relaxed"
          style={{ fontSize: 'clamp(9px, 2.2cqw, 13px)', color: colors.secondary }}
        >
          {values.additionalInfo}
        </p>
      )}
    </div>
  );
}

function WeddingFloralFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-[12%] py-[14%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <FloralWreath colors={colors} className="pointer-events-none absolute inset-x-6 top-5 w-[calc(100%-3rem)] opacity-90" />
      <FloralCorner colors={colors} className="pointer-events-none absolute left-2 top-16 h-20 w-20 opacity-80" />
      <FloralCorner colors={colors} flip className="pointer-events-none absolute bottom-2 right-2 h-20 w-20 opacity-80" />
      <RoseBloom colors={colors} className="pointer-events-none absolute left-6 bottom-20 h-14 w-14 opacity-50" />
      <RoseBloom colors={colors} flip className="pointer-events-none absolute right-6 bottom-20 h-14 w-14 opacity-50" />
      <BotanicalSprig colors={colors} className="pointer-events-none absolute right-2 top-24 h-20 w-12 opacity-60" />
      <BotanicalSprig colors={colors} flip className="pointer-events-none absolute left-2 top-24 h-20 w-12 opacity-60" />
      <div
        className="pointer-events-none absolute inset-5 rounded-[2rem] border-2"
        style={{ borderColor: `${colors.accent}40` }}
      />
      <WeddingRings colors={colors} className="relative z-10 mb-3 h-8 w-16" />
      <HeadlineLabel
        text={values.frontHeadline}
        colors={colors}
        className="relative z-10 uppercase tracking-[0.35em]"
        style={{ fontSize: 'clamp(8px, 2cqw, 12px)', color: colors.secondary }}
      />
      {line(values.coupleNames) && (
        <p
          className="relative z-10 mt-4 font-serif font-bold italic leading-tight"
          style={{ fontSize: 'clamp(16px, 6cqw, 32px)', color: colors.accent }}
        >
          {values.coupleNames}
        </p>
      )}
      <DividerLine colors={colors} className="relative z-10 my-4 w-24" />
      {line(values.eventDate) && (
        <p className="relative z-10 font-medium" style={{ fontSize: 'clamp(11px, 3cqw, 18px)' }}>
          {values.eventDate}
        </p>
      )}
      {line(values.venue) && (
        <p
          className="relative z-10 mt-2"
          style={{ fontSize: 'clamp(10px, 2.6cqw, 15px)', color: colors.secondary }}
        >
          {values.venue}
        </p>
      )}
    </div>
  );
}

function WeddingFloralBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-[12%] py-[14%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <HeartAccent colors={colors} className="pointer-events-none absolute left-8 top-10 h-12 w-12 opacity-50" />
      <HeartAccent colors={colors} className="pointer-events-none absolute bottom-10 right-8 h-10 w-10 opacity-40" />
      <VineCorner colors={colors} className="pointer-events-none absolute left-2 bottom-2 h-16 w-16 opacity-55" />
      <VineCorner colors={colors} flip className="pointer-events-none absolute right-2 bottom-2 h-16 w-16 opacity-55" />
      <MenuOrnament colors={colors} className="relative z-10 mb-5 w-40" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 font-semibold uppercase tracking-[0.25em]"
        style={{ fontSize: 'clamp(9px, 2.2cqw, 12px)' }}
      />
      {(line(values.phone) || line(values.email)) && (
        <p className="relative z-10 mt-4" style={{ fontSize: 'clamp(10px, 2.6cqw, 14px)', color: colors.secondary }}>
          {[line(values.phone), line(values.email)].filter(Boolean).join(' · ')}
        </p>
      )}
      {line(values.additionalInfo) && (
        <p
          className="relative z-10 mt-4 max-w-[85%] leading-relaxed"
          style={{ fontSize: 'clamp(9px, 2.2cqw, 13px)', color: colors.secondary }}
        >
          {values.additionalInfo}
        </p>
      )}
    </div>
  );
}

function WeddingMinimalFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl px-[12%] py-[14%] text-center shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <div
        className="pointer-events-none absolute inset-4 rounded-2xl border"
        style={{ borderColor: `${colors.accent}35` }}
      />
      <div
        className="pointer-events-none absolute inset-6 rounded-xl border"
        style={{ borderColor: `${colors.accent}20` }}
      />
      <FloralCorner colors={colors} className="pointer-events-none absolute left-4 top-4 h-14 w-14 opacity-60" />
      <FloralCorner colors={colors} flip className="pointer-events-none absolute bottom-4 right-4 h-14 w-14 opacity-60" />
      <RoseBloom colors={colors} className="pointer-events-none absolute left-8 top-20 h-10 w-10 opacity-45" />
      <RoseBloom colors={colors} flip className="pointer-events-none absolute right-8 top-20 h-10 w-10 opacity-45" />
      <WeddingRings colors={colors} className="relative z-10 mb-4 h-8 w-16" />
      <div className="relative z-10 h-px w-16" style={{ backgroundColor: colors.accent }} />
      <HeadlineLabel
        text={values.frontHeadline}
        colors={colors}
        className="relative z-10 mt-4 uppercase tracking-[0.2em]"
        style={{ fontSize: 'clamp(7px, 1.8cqw, 10px)', color: colors.secondary }}
      />
      {line(values.coupleNames) && (
        <p
          className="relative z-10 mt-6 font-light uppercase tracking-[0.25em]"
          style={{ fontSize: 'clamp(12px, 3.8cqw, 22px)' }}
        >
          {values.coupleNames}
        </p>
      )}
      {line(values.eventDate) && (
        <p
          className="relative z-10 mt-5 font-medium"
          style={{ fontSize: 'clamp(11px, 3cqw, 18px)', color: colors.accent }}
        >
          {values.eventDate}
        </p>
      )}
      {line(values.venue) && (
        <p
          className="relative z-10 mt-2"
          style={{ fontSize: 'clamp(10px, 2.5cqw, 14px)', color: colors.secondary }}
        >
          {values.venue}
        </p>
      )}
      <div className="relative z-10 mt-6 h-px w-16" style={{ backgroundColor: colors.accent }} />
    </div>
  );
}

function WeddingMinimalBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl px-[12%] py-[14%] text-center shadow-sm"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <BackgroundWash colors={colors} />
      <GeometricAccent colors={colors} className="pointer-events-none absolute -left-4 top-4 h-20 w-20 opacity-50" />
      <BotanicalSprig colors={colors} className="pointer-events-none absolute bottom-6 left-6 h-16 w-10 opacity-50" />
      <BotanicalSprig colors={colors} flip className="pointer-events-none absolute bottom-6 right-6 h-16 w-10 opacity-50" />
      <GeometricAccent colors={colors} className="relative z-10 mb-4 h-16 w-16 opacity-70" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 text-xs font-semibold uppercase tracking-[0.3em]"
      />
      <div className="mt-5 space-y-1" style={{ fontSize: 'clamp(9px, 2.2cqw, 13px)', color: colors.secondary }}>
        {line(values.phone) && <p>{values.phone}</p>}
        {line(values.email) && <p>{values.email}</p>}
        {line(values.additionalInfo) && <p className="pt-2">{values.additionalInfo}</p>}
      </div>
    </div>
  );
}

function MenuElegantFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg px-[10%] py-[12%] shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <MenuPattern colors={colors} className="pointer-events-none absolute inset-0 h-full w-full opacity-80" />
      <div
        className="pointer-events-none absolute inset-4 rounded-md border-2"
        style={{ borderColor: `${colors.accent}35` }}
      />
      <FloralCorner colors={colors} className="pointer-events-none absolute left-3 top-3 h-14 w-14 opacity-60" />
      <FloralCorner colors={colors} flip className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 opacity-60" />
      <MenuUtensils colors={colors} className="relative z-10 mb-4 h-14 w-14 opacity-80" />
      <MenuOrnament colors={colors} className="relative z-10 mb-4 w-44" />
      {line(values.restaurantName) && (
        <p
          className="relative z-10 text-center font-serif font-bold uppercase tracking-[0.2em]"
          style={{ fontSize: 'clamp(14px, 5cqw, 28px)', color: colors.accent }}
        >
          {values.restaurantName}
        </p>
      )}
      <HeadlineLabel
        text={values.frontHeadline}
        colors={colors}
        className="relative z-10 mt-3 uppercase tracking-[0.3em]"
        style={{ fontSize: 'clamp(7px, 1.8cqw, 10px)', color: colors.secondary }}
      />
      <MenuOrnament colors={colors} className="relative z-10 mt-4 w-44" />
    </div>
  );
}

function MenuElegantBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg px-[10%] py-[12%] shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <MenuPattern colors={colors} className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
      <MenuUtensils colors={colors} className="relative z-10 mx-auto mb-4 h-12 w-12 opacity-70" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 text-center font-semibold uppercase tracking-[0.25em]"
        style={{ fontSize: 'clamp(10px, 2.5cqw, 14px)' }}
      />
      <div
        className="relative z-10 mt-auto space-y-2 text-center"
        style={{ fontSize: 'clamp(8px, 2.2cqw, 12px)', color: colors.secondary }}
      >
        <ContactLines
          values={values}
          colors={colors}
          fields={['phone', 'address', 'website', 'email']}
        />
        {line(values.additionalInfo) && <p className="pt-2 italic">{values.additionalInfo}</p>}
      </div>
    </div>
  );
}

function MenuModernFront({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div
        className="flex h-[38%] flex-col items-center justify-center px-[10%]"
        style={{ backgroundColor: colors.accent }}
      >
        <GeometricAccent
          colors={{
            ...colors,
            accent: colors.background,
            secondary: colors.text,
          }}
          className="pointer-events-none absolute right-4 top-4 h-16 w-16 opacity-25"
        />
        {line(values.restaurantName) && (
          <p
            className="relative z-10 text-center font-bold uppercase tracking-[0.18em]"
            style={{ fontSize: 'clamp(13px, 4.8cqw, 26px)', color: colors.background }}
          >
            {values.restaurantName}
          </p>
        )}
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center px-[10%] py-[8%] text-center">
        <MenuOrnament colors={colors} className="mb-4 w-40" />
        <HeadlineLabel
          text={values.frontHeadline}
          colors={colors}
          className="uppercase tracking-[0.35em]"
          style={{ fontSize: 'clamp(8px, 2cqw, 11px)', color: colors.secondary }}
        />
        <DividerLine colors={colors} className="mt-5 w-32" />
      </div>
    </div>
  );
}

function MenuModernBack({
  colors,
  values,
}: {
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-lg px-[10%] py-[12%] shadow-md"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: colors.accent }}
      />
      <GeometricAccent colors={colors} className="pointer-events-none absolute -right-4 bottom-4 h-20 w-20 opacity-30" />
      <HeadlineLabel
        text={values.backHeadline}
        colors={colors}
        className="relative z-10 text-center font-bold uppercase tracking-[0.3em]"
        style={{ fontSize: 'clamp(10px, 2.5cqw, 14px)' }}
      />
      <div
        className="relative z-10 mt-auto space-y-2 text-center"
        style={{ fontSize: 'clamp(8px, 2.2cqw, 12px)', color: colors.secondary }}
      >
        <ContactLines
          values={values}
          colors={colors}
          fields={['phone', 'address', 'website', 'email']}
        />
        {line(values.additionalInfo) && <p className="pt-2">{values.additionalInfo}</p>}
      </div>
    </div>
  );
}

function LayoutBody({
  variant,
  side,
  colors,
  values,
}: {
  variant: DesignLayoutVariant;
  side: DesignPreviewSide;
  colors: DesignColorTheme;
  values: Partial<Record<DesignOrderFieldId, string>>;
}) {
  const map: Record<
    DesignLayoutVariant,
    {
      front: FC<{ colors: DesignColorTheme; values: Partial<Record<DesignOrderFieldId, string>> }>;
      back: FC<{ colors: DesignColorTheme; values: Partial<Record<DesignOrderFieldId, string>> }>;
    }
  > = {
    'business-minimal': { front: BusinessMinimalFront, back: BusinessMinimalBack },
    'business-classic': { front: BusinessClassicFront, back: BusinessClassicBack },
    'business-executive': { front: BusinessExecutiveFront, back: BusinessExecutiveBack },
    'birthday-fun': { front: BirthdayFunFront, back: BirthdayFunBack },
    'birthday-modern': { front: BirthdayModernFront, back: BirthdayModernBack },
    'wedding-floral': { front: WeddingFloralFront, back: WeddingFloralBack },
    'wedding-minimal': { front: WeddingMinimalFront, back: WeddingMinimalBack },
    'menu-elegant': { front: MenuElegantFront, back: MenuElegantBack },
    'menu-modern': { front: MenuModernFront, back: MenuModernBack },
  };

  const Component = map[variant][side];
  return <Component colors={colors} values={values} />;
}

export function CustomizableDesignPreview({
  layout,
  colors,
  values,
  side,
  className,
  backLabel,
  frontLabel,
}: CustomizableDesignPreviewProps) {
  return (
    <div
      className={`w-full max-w-full min-w-0 ${className ?? ''}`}
      style={{ aspectRatio: `${layout.aspectRatio}`, containerType: 'inline-size' }}
    >
      {(frontLabel || backLabel) && (
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-500">
          {side === 'front' ? frontLabel : backLabel}
        </p>
      )}
      <div className="h-full w-full">
        <LayoutBody variant={layout.variant} side={side} colors={colors} values={values} />
      </div>
    </div>
  );
}
