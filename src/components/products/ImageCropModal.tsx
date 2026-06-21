'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { cropImageToBlob } from '@/lib/products/crop-image';
import { PRODUCT_PHOTO_CROP_ASPECT } from '@/lib/products/customizer-constants';

type ImageCropModalProps = {
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
};

export function ImageCropModal({
  imageSrc,
  aspect = PRODUCT_PHOTO_CROP_ASPECT,
  onCancel,
  onComplete,
}: ImageCropModalProps) {
  const t = useTranslations('products.customizer');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      onComplete(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/60 p-4 sm:items-center">
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('cropTitle')}
      >
        <div className="border-b border-ink-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-ink-900">{t('cropTitle')}</h3>
          <p className="mt-1 text-sm text-ink-500">{t('cropSubtitle')}</p>
        </div>

        <div className="relative h-[min(55vh,420px)] w-full bg-ink-900">
          <Cropper
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
          <label className="block text-sm font-medium text-ink-700">
            {t('cropZoom')}
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-600"
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
