'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { cropImageToBlob } from '@/lib/products/crop-image';
import {
  PRODUCT_PHOTO_CROP_ASPECT,
  PRODUCT_PHOTO_CROP_ASPECT_OPTIONS,
} from '@/lib/products/customizer-constants';
import { cn } from '@/lib/utils';

type ImageCropModalProps = {
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onComplete: (blob: Blob) => void | Promise<void>;
};

export function ImageCropModal({
  imageSrc,
  aspect: initialAspect = PRODUCT_PHOTO_CROP_ASPECT,
  onCancel,
  onComplete,
}: ImageCropModalProps) {
  const t = useTranslations('products.customizer');
  const [aspect, setAspect] = useState(initialAspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPhase, setSavingPhase] = useState<'crop' | 'upload'>('crop');

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function selectAspect(ratio: number) {
    if (saving) return;
    setAspect(ratio);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function handleApply() {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);
    setSavingPhase('crop');
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      setSavingPhase('upload');
      await Promise.resolve(onComplete(blob));
    } finally {
      setSaving(false);
      setSavingPhase('crop');
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/60 p-4 sm:items-center">
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-busy={saving}
        aria-label={t('cropTitle')}
      >
        {saving ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <LoadingIndicator
              label={
                savingPhase === 'upload' ? t('cropUploading') : t('cropProcessing')
              }
              size="md"
            />
          </div>
        ) : null}

        <div className="border-b border-ink-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-ink-900">{t('cropTitle')}</h3>
          <p className="mt-1 text-sm text-ink-500">{t('cropSubtitle')}</p>
        </div>

        <div className="relative h-[min(55vh,420px)] w-full bg-ink-900">
          <Cropper
            key={aspect}
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="space-y-3 border-t border-ink-100 px-5 py-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">
              {t('cropAspect')}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_PHOTO_CROP_ASPECT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectAspect(option.ratio)}
                  disabled={saving}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50',
                    aspect === option.ratio
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                  )}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-ink-700">
            {t('cropZoom')}
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            disabled={saving}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-600 disabled:opacity-50"
          />
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={saving}
            >
              {t('cropCancel')}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => void handleApply()}
              loading={saving}
              disabled={saving || !croppedAreaPixels}
            >
              {t('cropApply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
