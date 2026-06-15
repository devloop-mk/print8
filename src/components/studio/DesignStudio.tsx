'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { designTemplates } from '@/lib/data/catalog';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { SecureUpload } from '@/components/upload/SecureUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const categoryPresetSizes = {
  'business-cards': [
    {
      key: 'card-small',
      label: 'Standard card (9×5 cm)',
      widthCm: 9,
      heightCm: 5,
    },
    {
      key: 'card-large',
      label: 'Standard card (9×5.5 cm)',
      widthCm: 9,
      heightCm: 5.5,
    },
  ],
  wedding: [
    { key: 'a5', label: 'A5 (14.8x21 cm)', widthCm: 14.8, heightCm: 21 },
    { key: 'a6', label: 'A6 (10.5x14.8 cm)', widthCm: 10.5, heightCm: 14.8 },
  ],
  birthday: [
    { key: 'a5', label: 'A5 (14.8x21 cm)', widthCm: 14.8, heightCm: 21 },
    { key: 'a6', label: 'A6 (10.5x14.8 cm)', widthCm: 10.5, heightCm: 14.8 },
  ],
  menus: [
    { key: 'a4', label: 'A4 (21x29.7 cm)', widthCm: 21, heightCm: 29.7 },
    { key: 'a3', label: 'A3 (29.7x42 cm)', widthCm: 29.7, heightCm: 42 },
  ],
  general: [
    { key: 'a4', label: 'A4 (21x29.7 cm)', widthCm: 21, heightCm: 29.7 },
    { key: 'a5', label: 'A5 (14.8x21 cm)', widthCm: 14.8, heightCm: 21 },
    { key: 'a6', label: 'A6 (10.5x14.8 cm)', widthCm: 10.5, heightCm: 14.8 },
  ],
} as const;

type SizeKey = string | 'custom';

type DesignCategory = keyof typeof categoryPresetSizes;

const pxPerCm = 14;

export function DesignStudio() {
  const t = useTranslations('studio');
  const td = useTranslations('designs');
  const searchParams = useSearchParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);
  const prevCanvasSizeRef = useRef({ width: 0, height: 0 });
  const { addItem } = useCart();
  const { token, loading: uploadLoading, error: uploadSessionError, refreshSession } = useUploadSession();

  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [textColor, setTextColor] = useState('#000000');
  const [saved, setSaved] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    { fileId: string; name: string }[]
  >([]);
  const categories = Object.keys(categoryPresetSizes) as DesignCategory[];
  const [selectedCategory, setSelectedCategory] =
    useState<DesignCategory>('general');
  const categorySizes = categoryPresetSizes[selectedCategory];
  const [selectedSize, setSelectedSize] = useState<SizeKey>(
    categorySizes[0].key,
  );
  const [customWidth, setCustomWidth] = useState<number>(
    categorySizes[0].widthCm,
  );
  const [customHeight, setCustomHeight] = useState<number>(
    categorySizes[0].heightCm,
  );

  const templateId = searchParams.get('template');

  useEffect(() => {
    setSelectedSize(categorySizes[0].key);
    setCustomWidth(categorySizes[0].widthCm);
    setCustomHeight(categorySizes[0].heightCm);
  }, [selectedCategory]);

  const categorySizeLimits =
    selectedCategory === 'business-cards'
      ? { widthMin: 8, widthMax: 10, heightMin: 4, heightMax: 6 }
      : { widthMin: 10, widthMax: 50, heightMin: 10, heightMax: 50 };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const activeSize =
    selectedSize === 'custom'
      ? {
          key: 'custom' as const,
          label: t('customSize'),
          widthCm: customWidth,
          heightCm: customHeight,
        }
      : (categorySizes.find((size) => size.key === selectedSize) ??
        categorySizes[0]);

  const canvasWidth = Math.max(240, Math.round(activeSize.widthCm * pxPerCm));
  const canvasHeight = Math.max(160, Math.round(activeSize.heightCm * pxPerCm));
  const sizeLabel =
    selectedSize === 'custom'
      ? `${activeSize.widthCm.toFixed(1)}×${activeSize.heightCm.toFixed(1)} ${t('cm')}`
      : activeSize.label;

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || fabricRef.current) return;

    const { Canvas, IText, FabricImage } = await import('fabric');

    const canvas = new Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
    });

    if (templateId) {
      try {
        const template = designTemplates.find((d) => d.id === templateId);
        if (template?.image) {
          const img = await FabricImage.fromURL(template.image);
          // scale to fit canvas while keeping margins
          img.scaleToWidth(
            Math.min(canvasWidth - 40, img.width || canvasWidth),
          );
          img.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
          });
          canvas.add(img);
        }
      } catch (err) {
        // ignore template load errors
      }
    }

    fabricRef.current = canvas;
    prevCanvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
  }, [canvasWidth, canvasHeight, templateId]);

  useEffect(() => {
    initCanvas();
    return () => {
      if (
        fabricRef.current &&
        typeof (fabricRef.current as { dispose?: () => void }).dispose ===
          'function'
      ) {
        (fabricRef.current as { dispose: () => void }).dispose();
        fabricRef.current = null;
      }
    };
  }, [initCanvas]);

  useEffect(() => {
    if (!fabricRef.current) return;

    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import('fabric')>['Canvas']
    >;

    const prevSize = prevCanvasSizeRef.current;

    if (prevSize.width && prevSize.height) {
      const scaleX = canvasWidth / prevSize.width;
      const scaleY = canvasHeight / prevSize.height;

      canvas.getObjects().forEach((object) => {
        object.set({
          left: (object.left ?? 0) * scaleX,
          top: (object.top ?? 0) * scaleY,
          scaleX: (object.scaleX ?? 1) * scaleX,
          scaleY: (object.scaleY ?? 1) * scaleY,
        });
        object.setCoords();
      });
    }

    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);
    canvas.backgroundColor = '#ffffff';
    canvas.calcOffset?.();
    canvas.renderAll();

    prevCanvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
  }, [canvasWidth, canvasHeight]);

  async function addTextToCanvas() {
    if (!text.trim() || !fabricRef.current) return;
    const { IText } = await import('fabric');
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import('fabric')>['Canvas']
    >;
    const textObj = new IText(text, {
      left: 100,
      top: 100,
      fontSize,
      fill: textColor,
    });
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    setText('');
  }

  async function addImageToCanvas(imageUrl: string) {
    if (!fabricRef.current) return;
    const { FabricImage } = await import('fabric');
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import('fabric')>['Canvas']
    >;
    const img = await FabricImage.fromURL(imageUrl);
    img.scaleToWidth(Math.min(200, canvasWidth * 0.6));
    img.set({ left: 150, top: 120 });
    canvas.add(img);
    canvas.renderAll();
  }

  function handleFileUpload(fileId: string, name: string) {
    setUploadedFiles((prev) => [...prev, { fileId, name }]);
    addImageToCanvas(`/api/files/${fileId}`);
  }

  function saveDesign() {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import('fabric')>['Canvas']
    >;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
    setPreviewDataUrl(dataUrl);
    setSaved(true);
  }

  function addToCart() {
    if (!previewDataUrl) saveDesign();
    const dataUrl =
      previewDataUrl ||
      (
        fabricRef.current as InstanceType<
          Awaited<typeof import('fabric')>['Canvas']
        >
      )?.toDataURL({ format: 'png', multiplier: 1 });

    addItem({
      type: 'design',
      name: templateId
        ? `Design (${templateId}) ${sizeLabel}`
        : `Custom design ${sizeLabel}`,
      price: 500,
      quantity: 1,
      designPreview: dataUrl,
      fileIds: uploadedFiles.map((f) => f.fileId),
      metadata: {
        templateId: templateId || 'custom',
        selectedSize,
        widthCm: activeSize.widthCm,
        heightCm: activeSize.heightCm,
      },
    });
    router.push('/cart');
  }

  async function clearCanvas() {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import('fabric')>['Canvas']
    >;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    setSaved(false);
    setPreviewDataUrl(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden p-4">
        <div className="flex justify-center overflow-auto rounded-lg border border-ink-200 bg-ink-50 p-4">
          <canvas ref={canvasRef} />
        </div>
        <div className="mt-4 rounded-lg border border-ink-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-ink-600">
            {t('sizeLabel')}: <strong>{sizeLabel}</strong>
          </p>
          <p className="text-sm text-ink-500">{t('canvasPreview')}</p>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 font-semibold text-ink-900">{t('sizeLabel')}</h3>
          <label className="mb-2 block text-sm font-medium text-ink-700">
            {t('productType')}
          </label>
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  selectedCategory === category
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400'
                }`}
              >
                {td(`categories.${category}`) || category}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-sm font-medium text-ink-700">
            {t('presetSize')}
          </label>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {categorySizes.map((sizeOption) => (
              <button
                key={sizeOption.key}
                type="button"
                onClick={() => {
                  setSelectedSize(sizeOption.key);
                  setCustomWidth(sizeOption.widthCm);
                  setCustomHeight(sizeOption.heightCm);
                }}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  selectedSize === sizeOption.key
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400'
                }`}
              >
                {sizeOption.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedSize('custom')}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                selectedSize === 'custom'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400'
              }`}
            >
              {t('customSize')}
            </button>
          </div>

          {selectedSize === 'custom' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500">
                  {t('width')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={categorySizeLimits.widthMin}
                    max={categorySizeLimits.widthMax}
                    step={0.1}
                    value={customWidth}
                    onChange={(e) =>
                      setCustomWidth(
                        clamp(
                          Number(e.target.value),
                          categorySizeLimits.widthMin,
                          categorySizeLimits.widthMax,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-ink-500">{t('cm')}</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500">
                  {t('height')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={categorySizeLimits.heightMin}
                    max={categorySizeLimits.heightMax}
                    step={0.1}
                    value={customHeight}
                    onChange={(e) =>
                      setCustomHeight(
                        clamp(
                          Number(e.target.value),
                          categorySizeLimits.heightMin,
                          categorySizeLimits.heightMax,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
                  />
                  <span className="text-sm text-ink-500">{t('cm')}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-ink-900">{t('addText')}</h3>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('textPlaceholder')}
            className="mb-3 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
          />
          <div className="mb-3 flex gap-3">
            <div>
              <label className="text-xs text-ink-500">{t('fontSize')}</label>
              <input
                type="number"
                min={12}
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-500">{t('textColor')}</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-ink-300"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={addTextToCanvas}
            className="w-full"
          >
            {t('addText')}
          </Button>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-ink-900">{t('addImage')}</h3>
          <p className="mb-3 text-xs text-ink-500">{t('uploadHint')}</p>
          <SecureUpload
            token={token}
            loading={uploadLoading}
            sessionError={uploadSessionError}
            onRefreshSession={refreshSession}
            onUpload={handleFileUpload}
          />
          {uploadedFiles.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-ink-600">
              {uploadedFiles.map((f) => (
                <li key={f.fileId}>✓ {f.name}</li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-2">
          <Button onClick={saveDesign}>{t('saveDesign')}</Button>
          <Button
            variant="secondary"
            onClick={addToCart}
          >
            {t('addToCart')}
          </Button>
          <Button
            variant="outline"
            onClick={clearCanvas}
          >
            {t('clear')}
          </Button>
          {saved && (
            <p className="text-center text-sm text-green-600">{t('saved')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
