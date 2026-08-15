'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { resolveCanvasAssetUrl } from '@/lib/storage/asset-url';
import {
  applySvgTemplate,
  prepareSvgForInlineDom,
  scopeSvgIdsForInlineDom,
} from '@/lib/designs/svg-template-engine';
import { toSvgSiteLocale } from '@/lib/designs/svg-locale-defaults';

const rawSvgCache = new Map<string, string>();
const rawSvgInflight = new Map<string, Promise<string>>();
const renderedSvgCache = new Map<string, string>();
const inlineThumbCache = new Map<string, string>();

async function loadRawSvg(path: string): Promise<string> {
  const cached = rawSvgCache.get(path);
  if (cached) return cached;

  const inflight = rawSvgInflight.get(path);
  if (inflight) return inflight;

  const promise = fetch(resolveCanvasAssetUrl(path))
    .then((response) => response.text())
    .then((svg) => {
      rawSvgCache.set(path, svg);
      rawSvgInflight.delete(path);
      return svg;
    })
    .catch((error) => {
      rawSvgInflight.delete(path);
      throw error;
    });

  rawSvgInflight.set(path, promise);
  return promise;
}

function getRenderedCacheKey(
  templateId: string,
  path: string,
  side: 'front' | 'back',
  locale: string,
  stateKey: string,
) {
  return `${templateId}:${path}:${side}:${locale}:${stateKey}`;
}

function getRenderedSvgMarkup(
  template: SvgDesignTemplate,
  svgSource: string,
  state: SvgTemplateState,
  side: 'front' | 'back',
  locale: ReturnType<typeof toSvgSiteLocale>,
  stateKey: string,
  path: string,
): string {
  const cacheKey = getRenderedCacheKey(template.id, path, side, locale, stateKey);
  const cached = renderedSvgCache.get(cacheKey);
  if (cached) return cached;

  const markup = applySvgTemplate(svgSource, template, state, side, locale);
  renderedSvgCache.set(cacheKey, markup);
  return markup;
}

export function useRenderedSvgTemplate(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string | null {
  const locale = toSvgSiteLocale(useLocale());
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
    return getRenderedSvgMarkup(template, svgSource, state, side, locale, stateKey, path);
  }, [loaded, locale, path, side, stateKey, template]);
}

/** Cached inline SVG for gallery thumbs — skips per-card ResizeObserver remount cost. */
export function useInlineSvgThumbMarkup(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
  scopeId: string,
): string | null {
  const markup = useRenderedSvgTemplate(template, state, side);
  const locale = toSvgSiteLocale(useLocale());
  const path =
    side === 'front' ? template.sides.front.path : template.sides.back?.path;
  const stateKey = JSON.stringify(state);

  return useMemo(() => {
    if (!markup || !path) return null;

    const cacheKey = `${getRenderedCacheKey(template.id, path, side, locale, stateKey)}:${scopeId}`;
    const cached = inlineThumbCache.get(cacheKey);
    if (cached) return cached;

    const inlineSvg = scopeSvgIdsForInlineDom(
      prepareSvgForInlineDom(markup),
      scopeId,
    );
    inlineThumbCache.set(cacheKey, inlineSvg);
    return inlineSvg;
  }, [locale, markup, path, scopeId, side, stateKey, template.id]);
}

/** @deprecated Use useRenderedSvgTemplate — blob img URLs cannot load external SVG images. */
export function useSvgTemplateUrl(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string | null {
  return useRenderedSvgTemplate(template, state, side);
}
