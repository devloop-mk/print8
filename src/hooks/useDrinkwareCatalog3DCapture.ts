'use client';

import { useEffect, useRef, useState } from 'react';
import {
  captureDrinkware3DFrontPreview,
  type DrinkwareCaptureOptions,
} from '@/components/products/customizer/Drinkware3DCapture';

const captureCache = new Map<string, string>();
let captureQueue: Promise<unknown> = Promise.resolve();

function enqueueCapture<T>(task: () => Promise<T>): Promise<T> {
  const run = captureQueue.then(task, task);
  captureQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function useDrinkwareCatalog3DCapture({
  enabled,
  cacheKey,
  captureOptions,
}: {
  enabled: boolean;
  cacheKey: string;
  captureOptions: DrinkwareCaptureOptions | null;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    () => captureCache.get(cacheKey) ?? null,
  );
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !captureOptions) return;

    const cached = captureCache.get(cacheKey);
    if (cached) {
      setImageUrl(cached);
      return;
    }

    const element = rootRef.current;
    if (!element) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || cancelled) return;
        observer.disconnect();
        setLoading(true);

        void enqueueCapture(async () => {
          const hit = captureCache.get(cacheKey);
          if (hit) return hit;
          return captureDrinkware3DFrontPreview(captureOptions);
        }).then((url) => {
          if (cancelled) return;
          if (url) {
            captureCache.set(cacheKey, url);
            setImageUrl(url);
          }
          setLoading(false);
        });
      },
      { rootMargin: '160px 0px' },
    );

    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [cacheKey, captureOptions, enabled]);

  return { rootRef, imageUrl, loading };
}
