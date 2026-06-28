'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { applySvgTemplate } from '@/lib/designs/svg-template-engine';

const rawSvgCache = new Map<string, string>();

async function loadRawSvg(path: string): Promise<string> {
  const cached = rawSvgCache.get(path);
  if (cached) return cached;

  const response = await fetch(path);
  const svg = await response.text();
  rawSvgCache.set(path, svg);
  return svg;
}

export function useRenderedSvgTemplate(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string | null {
  const path =
    side === 'front' ? template.sides.front.path : template.sides.back?.path;
  const [loaded, setLoaded] = useState<{ path: string; svg: string } | null>(() => {
    if (!path) return null;
    const cached = rawSvgCache.get(path);
    return cached ? { path, svg: cached } : null;
  });
  const stateKey = JSON.stringify(state);

  useEffect(() => {
    if (!path) {
      setLoaded(null);
      return;
    }

    const cached = rawSvgCache.get(path);
    if (cached) {
      setLoaded({ path, svg: cached });
      return;
    }

    setLoaded(null);

    let cancelled = false;
    void loadRawSvg(path).then((svg) => {
      if (!cancelled) setLoaded({ path, svg });
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return useMemo(() => {
    if (!path) return null;
    const cached = rawSvgCache.get(path);
    const svgSource = cached ?? (loaded?.path === path ? loaded.svg : null);
    if (!svgSource) return null;
    return applySvgTemplate(svgSource, template, state, side);
  }, [loaded, template, stateKey, side, path]);
}

/** @deprecated Use useRenderedSvgTemplate — blob img URLs cannot load external SVG images. */
export function useSvgTemplateUrl(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string | null {
  return useRenderedSvgTemplate(template, state, side);
}
