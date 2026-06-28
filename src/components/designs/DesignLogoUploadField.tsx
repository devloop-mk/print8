'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { readLogoDataUrl } from '@/lib/designs/logo-upload';
import { ImagePlus, Trash2 } from 'lucide-react';

export function DesignLogoUploadField({
  label,
  hint,
  letterValue,
  onLetterChange,
  logoDataUrl,
  onLogoChange,
  showLetter = true,
}: {
  label: string;
  hint?: string;
  showLetter?: boolean;
  letterValue: string;
  onLetterChange: (value: string) => void;
  logoDataUrl: string | null | undefined;
  onLogoChange: (dataUrl: string | null) => void;
}) {
  const t = useTranslations('designs.customize');
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const hasLogo = Boolean(logoDataUrl);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await readLogoDataUrl(file);
      onLogoChange(dataUrl);
    } catch {
      setError(t('logoUploadError'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-200/80 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-ink-500">{hint}</p> : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDataUrl!} alt="" className="h-full w-full object-contain" />
          ) : showLetter ? (
            <span className="text-3xl font-bold uppercase text-brand-700">
              {letterValue.trim().slice(0, 2) || 'AB'}
            </span>
          ) : (
            <ImagePlus className="h-8 w-8 text-ink-300" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {!hasLogo && showLetter ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-700">
                {t('logoLetterLabel')}
              </label>
              <input
                type="text"
                value={letterValue}
                maxLength={3}
                onChange={(e) => onLetterChange(e.target.value)}
                className="w-full max-w-[8rem] rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="gap-1.5"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {hasLogo ? t('logoReplace') : t('logoUpload')}
            </Button>
            {hasLogo ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onLogoChange(null)}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('logoRemove')}
              </Button>
            ) : null}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              void handleFile(file);
              e.target.value = '';
            }}
          />

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <p className="text-xs text-ink-500">{t('logoUploadHint')}</p>
        </div>
      </div>
    </div>
  );
}
